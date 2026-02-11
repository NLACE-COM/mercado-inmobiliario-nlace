import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for backfill operation

/**
 * POST /api/admin/backfill-typologies
 * Backfill project typologies from existing project data
 * 
 * This endpoint extracts typology information from project property_type fields
 * and creates basic typology records. For complete typology data with surfaces
 * and detailed pricing, TINSA CSV import is required.
 */
export async function POST(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const supabase = getSupabaseAdmin()

        console.log('[Backfill Typologies] Starting...')

        // 1. Fetch all projects
        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, property_type, avg_price_uf, min_price_uf, max_price_uf')

        if (projectsError) {
            console.error('[Backfill Typologies] Error fetching projects:', projectsError)
            return NextResponse.json(
                { error: 'Failed to fetch projects' },
                { status: 500 }
            )
        }

        if (!projects || projects.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No projects found',
                stats: { processed: 0, created: 0, skipped: 0 }
            })
        }

        let processed = 0
        let created = 0
        let skipped = 0

        // 2. Process each project
        for (const project of projects) {
            processed++

            // Skip if no property_type data
            if (!project.property_type) {
                skipped++
                continue
            }

            // Parse property_type for typology codes
            // Expected formats: "Departamento 1D-1B, 2D-2B" or "1D+1B, 2D+2B"
            const typologyPattern = /(\d+)D[+-](\d+)B/gi
            const matches = [...project.property_type.matchAll(typologyPattern)]

            if (matches.length === 0) {
                skipped++
                continue
            }

            // 3. Create typology records
            for (const match of matches) {
                const bedrooms = parseInt(match[1])
                const bathrooms = parseInt(match[2])

                // Check if typology already exists for this project
                const { data: existing } = await supabase
                    .from('project_typologies')
                    .select('id')
                    .eq('project_id', project.id)
                    .eq('bedrooms', bedrooms)
                    .eq('bathrooms', bathrooms)
                    .single()

                if (existing) {
                    // Already exists, skip
                    continue
                }

                // Create new typology record
                const { error: insertError } = await supabase
                    .from('project_typologies')
                    .insert({
                        project_id: project.id,
                        bedrooms,
                        bathrooms,
                        // Use project prices as base (not ideal but better than nothing)
                        min_price_uf: project.min_price_uf,
                        max_price_uf: project.max_price_uf,
                        avg_price_uf: project.avg_price_uf,
                        // Surface data would come from TINSA CSV
                        min_surface_m2: null,
                        max_surface_m2: null,
                        avg_surface_m2: null,
                        total_units: null,
                        available_units: null
                    })

                if (insertError) {
                    console.error(`[Backfill Typologies] Error creating typology for project ${project.id}:`, insertError)
                } else {
                    created++
                }
            }
        }

        console.log('[Backfill Typologies] Complete:', { processed, created, skipped })

        return NextResponse.json({
            success: true,
            message: `Backfill complete. Processed ${processed} projects, created ${created} typologies, skipped ${skipped}.`,
            stats: { processed, created, skipped }
        })

    } catch (error: any) {
        console.error('[Backfill Typologies] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
