import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for CSV processing

/**
 * POST /api/admin/import-tinsa
 * Import TINSA CSV files to update projects and typologies
 * 
 * This endpoint accepts CSV files in TINSA format and processes them to:
 * - Create/update projects
 * - Create detailed typology records with surfaces and pricing
 * 
 * Accepts multipart/form-data with a 'file' field containing the CSV
 */
export async function POST(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided. Please upload a CSV file.' },
                { status: 400 }
            )
        }

        if (!file.name.endsWith('.csv')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a CSV file.' },
                { status: 400 }
            )
        }

        console.log('[TINSA Import] Processing file:', file.name, 'Size:', file.size)

        // Read CSV content
        const content = await file.text()
        const lines = content.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
            return NextResponse.json(
                { error: 'CSV file is empty or has no data rows' },
                { status: 400 }
            )
        }

        // Parse CSV header
        const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        console.log('[TINSA Import] CSV columns:', header)

        const supabase = getSupabaseAdmin()

        let projectsProcessed = 0
        let projectsCreated = 0
        let projectsUpdated = 0
        let typologiesCreated = 0
        let errors: string[] = []

        // Group rows by project
        const projectGroups: Record<string, any[]> = {}

        // Parse data rows (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (!line.trim()) continue

            try {
                // Parse CSV row (handle Chilean number format: punto=miles, coma=decimal)
                const values = parseCSVLine(line)
                const row: Record<string, string> = {}

                header.forEach((col, idx) => {
                    row[col] = values[idx] || ''
                })

                // Extract project identifier (PROYECTO + COMUNA_INCOIN)
                const projectKey = `${row['PROYECTO']}_${row['COMUNA_INCOIN']}`.trim()

                if (!projectGroups[projectKey]) {
                    projectGroups[projectKey] = []
                }
                projectGroups[projectKey].push(row)

            } catch (error: any) {
                errors.push(`Line ${i + 1}: ${error.message}`)
            }
        }

        console.log('[TINSA Import] Found', Object.keys(projectGroups).length, 'unique projects')

        // Process each project group
        for (const [projectKey, rows] of Object.entries(projectGroups)) {
            try {
                projectsProcessed++
                const firstRow = rows[0]

                // Extract project data
                const projectName = firstRow['PROYECTO']?.trim()
                const commune = firstRow['COMUNA_INCOIN']?.trim()
                const developer = firstRow['INMOBILIARIA']?.trim()
                const region = firstRow['REGION']?.trim()

                if (!projectName || !commune) {
                    errors.push(`Project ${projectKey}: Missing required fields (PROYECTO or COMUNA_INCOIN)`)
                    continue
                }

                // Calculate project-level aggregates from typologies
                let totalUnits = 0
                let totalSold = 0
                let prices: number[] = []

                rows.forEach(row => {
                    const units = parseChileanNumber(row['UNIDADES'] || '0')
                    const sold = parseChileanNumber(row['VENDIDAS'] || '0')
                    const price = parseChileanNumber(row['PRECIO_UF'] || '0')

                    totalUnits += units
                    totalSold += sold
                    if (price > 0) prices.push(price)
                })

                const avgPrice = prices.length > 0
                    ? prices.reduce((a, b) => a + b, 0) / prices.length
                    : null

                // Check if project exists
                const { data: existingProject } = await supabase
                    .from('projects')
                    .select('id')
                    .eq('name', projectName)
                    .eq('commune', commune)
                    .single()

                let projectId: string

                if (existingProject) {
                    // Update existing project
                    projectId = existingProject.id
                    await supabase
                        .from('projects')
                        .update({
                            developer,
                            region,
                            total_units: totalUnits,
                            sold_units: totalSold,
                            available_units: totalUnits - totalSold,
                            avg_price_uf: avgPrice,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', projectId)

                    projectsUpdated++
                } else {
                    // Create new project
                    const { data: newProject, error: createError } = await supabase
                        .from('projects')
                        .insert({
                            name: projectName,
                            commune,
                            developer,
                            region,
                            total_units: totalUnits,
                            sold_units: totalSold,
                            available_units: totalUnits - totalSold,
                            avg_price_uf: avgPrice
                        })
                        .select('id')
                        .single()

                    if (createError || !newProject) {
                        errors.push(`Failed to create project ${projectName}: ${createError?.message}`)
                        continue
                    }

                    projectId = newProject.id
                    projectsCreated++
                }

                // Create typology records
                for (const row of rows) {
                    const bedrooms = parseChileanNumber(row['DORMITORIOS'] || '0')
                    const bathrooms = parseChileanNumber(row['BANOS'] || '0')
                    const surface = parseChileanNumber(row['SUPERFICIE_M2'] || '0')
                    const units = parseChileanNumber(row['UNIDADES'] || '0')
                    const sold = parseChileanNumber(row['VENDIDAS'] || '0')
                    const price = parseChileanNumber(row['PRECIO_UF'] || '0')

                    if (bedrooms === 0 && bathrooms === 0) continue // Skip invalid typologies

                    // Upsert typology (update if exists, create if not)
                    const { error: typologyError } = await supabase
                        .from('project_typologies')
                        .upsert({
                            project_id: projectId,
                            bedrooms,
                            bathrooms,
                            avg_surface_m2: surface > 0 ? surface : null,
                            total_units: units,
                            available_units: units - sold,
                            avg_price_uf: price > 0 ? price : null,
                            avg_price_m2_uf: (price > 0 && surface > 0) ? price / surface : null
                        }, {
                            onConflict: 'project_id,bedrooms,bathrooms'
                        })

                    if (typologyError) {
                        errors.push(`Typology error for ${projectName}: ${typologyError.message}`)
                    } else {
                        typologiesCreated++
                    }
                }

            } catch (error: any) {
                errors.push(`Project ${projectKey}: ${error.message}`)
            }
        }

        console.log('[TINSA Import] Complete:', {
            projectsProcessed,
            projectsCreated,
            projectsUpdated,
            typologiesCreated,
            errors: errors.length
        })

        return NextResponse.json({
            success: true,
            message: `Import complete. Processed ${projectsProcessed} projects.`,
            stats: {
                projects_processed: projectsProcessed,
                projects_created: projectsCreated,
                projects_updated: projectsUpdated,
                typologies_created: typologiesCreated,
                errors: errors.length
            },
            errors: errors.slice(0, 10) // Return first 10 errors
        })

    } catch (error: any) {
        console.error('[TINSA Import] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Parse Chilean number format: punto=thousands separator, coma=decimal
 * Examples: "1.234,56" -> 1234.56, "1234" -> 1234
 */
function parseChileanNumber(value: string): number {
    if (!value || value.trim() === '') return 0

    // Remove quotes and trim
    const cleaned = value.replace(/"/g, '').trim()

    // Replace punto (thousands) with nothing, coma (decimal) with dot
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')

    const num = parseFloat(normalized)
    return isNaN(num) ? 0 : num
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }

    values.push(current.trim())
    return values
}

/**
 * GET /api/admin/import-tinsa
 * Get import instructions
 */
export async function GET(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    return NextResponse.json({
        endpoint: '/api/admin/import-tinsa',
        method: 'POST',
        description: 'Import TINSA CSV files to update projects and create detailed typologies',
        usage: {
            content_type: 'multipart/form-data',
            field_name: 'file',
            file_type: '.csv',
            example: 'curl -X POST -F "file=@tinsa_data.csv" -H "Cookie: your-auth-cookie" /api/admin/import-tinsa'
        },
        expected_columns: [
            'PROYECTO',
            'COMUNA_INCOIN',
            'INMOBILIARIA',
            'REGION',
            'DORMITORIOS',
            'BANOS',
            'SUPERFICIE_M2',
            'UNIDADES',
            'VENDIDAS',
            'PRECIO_UF'
        ],
        notes: [
            'CSV must use Chilean number format (punto=thousands, coma=decimal)',
            'Projects are grouped by PROYECTO + COMUNA_INCOIN',
            'Existing projects will be updated, new ones created',
            'Typologies are upserted (updated if exist, created if not)'
        ]
    })
}
