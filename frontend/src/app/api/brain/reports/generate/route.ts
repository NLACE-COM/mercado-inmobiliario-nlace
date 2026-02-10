import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import OpenAI from 'openai'

// Increase timeout for Vercel Hobby plan (max 10s usually, but let's try to be fast)
export const maxDuration = 60 // Allow up to 60 seconds (Pro plan) or try to fit in 10s (Hobby)
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/brain/reports/generate
 * Generate a new report with REAL DATA and OpenAI Analysis
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, report_type, parameters } = body // e.g., parameters: { commune: 'SANTIAGO' }

        if (!title || !report_type || !parameters) {
            return NextResponse.json(
                { error: 'Missing required fields: title, report_type, parameters' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        // 1. Create Initial Report Entry (status: 'generating')
        const { data: initialReport, error: createError } = await supabase
            .from('generated_reports')
            .insert({
                title,
                report_type,
                parameters,
                status: 'generating',
                content: null
            })
            .select()
            .single()

        if (createError) {
            console.error('Error creating initial report:', createError)
            return NextResponse.json({ error: 'Failed to create report entry' }, { status: 500 })
        }

        // 2. Fetch Real Data from Supabase (Projects Table)
        const commune = parameters.commune?.trim() || ''
        console.log(`[Report Generate] Searching projects for commune: "${commune}"`)

        let projectsQuery = supabase
            .from('projects')
            .select('id, name, developer, commune, avg_price_uf, avg_price_m2_uf, total_units, available_units, sales_speed_monthly, project_status, property_type')

        if (commune) {
            // Use ilike for case-insensitive matching
            projectsQuery = projectsQuery.ilike('commune', commune)
        }

        // Limit to prevent huge payloads, but enough for stats
        const { data: projects, error: fetchError } = await projectsQuery.limit(500)

        if (fetchError) {
            console.error('Error fetching project data:', fetchError)
            // Function continues but report will be failed
            await updateReportStatus(supabase, initialReport.id, 'failed', fetchError.message)
            return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
        }

        if (!projects || projects.length === 0) {
            console.log(`[Report Generate] No projects found for commune: "${commune}"`)
            await updateReportStatus(supabase, initialReport.id, 'completed', null, {
                title,
                sections: [
                    {
                        type: 'analysis_text',
                        title: 'Sin Resultados',
                        content: `No se encontraron proyectos para la comuna de **${commune}**.\n\nVerifique que el nombre de la comuna esté escrito correctamente (ej: "Ñuñoa" en lugar de "Nunoa") y que existan proyectos activos en nuestra base de datos para esta ubicación.`
                    }
                ]
            })
            return NextResponse.json(initialReport) // Return early
        }

        // 3. Calculate Statistics
        const stats = calculateStats(projects)

        // 4. Generate Analysis with OpenAI
        const analysisText = await generateAIAnalysis(commune, stats)

        // 5. Structure Final Content matching ReportView component
        const reportContent = {
            title,
            sections: [
                {
                    type: 'kpi_grid',
                    data: {
                        total_projects: projects.length,
                        avg_price: Math.round(stats.avgPrice),
                        avg_price_m2: Math.round(stats.avgPriceM2),
                        total_stock: stats.totalStock,
                        avg_sales_speed: stats.avgSalesSpeed.toFixed(1),
                        avg_mao: stats.monthsToSellOut.toFixed(1)
                    }
                },
                {
                    type: 'analysis_text',
                    title: 'Análisis de Mercado con IA',
                    content: analysisText
                },
                {
                    type: 'chart_bar', // Reusing bar chart for status distribution for now
                    title: 'Distribución de Stock por Estado de Obra',
                    data: stats.statusDistribution.map(s => ({
                        developer: s.name, // Mapping 'name' to 'developer' as expected by the bar chart component which uses 'developer' for YAxis
                        stock: s.value
                    }))
                },
                {
                    type: 'project_table',
                    title: 'Top Proyectos por Stock',
                    data: projects
                        .sort((a: any, b: any) => (b.available_units || 0) - (a.available_units || 0))
                        .slice(0, 20)
                        .map((p: any) => ({
                            id: p.id,
                            name: p.name,
                            developer: p.developer || 'S/I',
                            stock: p.available_units,
                            avg_price_uf: p.avg_price_uf,
                            sales_speed: p.sales_speed_monthly,
                            mao: p.sales_speed_monthly > 0 ? (p.available_units / p.sales_speed_monthly).toFixed(1) : '-'
                        }))
                }
            ]
        }

        // 6. Update Report (status: 'completed')
        await updateReportStatus(supabase, initialReport.id, 'completed', null, reportContent)

        return NextResponse.json({ ...initialReport, status: 'completed', content: reportContent })

    } catch (error: any) {
        console.error('Error likely in AI generation or DB update:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error during generation' },
            { status: 500 }
        )
    }
}

// --- Helper Functions ---

async function updateReportStatus(supabase: any, id: string, status: string, errorMessage: string | null = null, content: any = null) {
    await supabase
        .from('generated_reports')
        .update({ status, error_message: errorMessage, content })
        .eq('id', id)
}

function calculateStats(projects: any[]) {
    let totalPrice = 0
    let totalPriceM2 = 0
    let totalStock = 0
    let totalSpeed = 0
    let countPrice = 0
    let countPriceM2 = 0

    const statusCount: Record<string, number> = {}

    projects.forEach(p => {
        if (p.avg_price_uf) { totalPrice += Number(p.avg_price_uf); countPrice++; }
        if (p.avg_price_m2_uf) { totalPriceM2 += Number(p.avg_price_m2_uf); countPriceM2++; }
        if (p.available_units) totalStock += Number(p.available_units);
        if (p.sales_speed_monthly) totalSpeed += Number(p.sales_speed_monthly);

        // Status Distribution
        const status = p.project_status || 'Sin Información'
        statusCount[status] = (statusCount[status] || 0) + 1
    })

    const avgPrice = countPrice > 0 ? totalPrice / countPrice : 0
    const avgPriceM2 = countPriceM2 > 0 ? totalPriceM2 / countPriceM2 : 0
    const avgSalesSpeed = projects.length > 0 ? totalSpeed / projects.length : 0
    const monthsToSellOut = avgSalesSpeed > 0 ? (totalStock / avgSalesSpeed) : 0

    // Format for Recharts/Chart.js
    const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

    return {
        avgPrice,
        avgPriceM2,
        totalStock,
        avgSalesSpeed,
        monthsToSellOut,
        statusDistribution
    }
}

async function generateAIAnalysis(commune: string, stats: any) {
    try {
        const prompt = `
        Actúa como un analista inmobiliario senior experto en el mercado chileno.
        Analiza los siguientes datos del mercado inmobiliario para la comuna de ${commune}:

        - Precio Promedio: ${Math.round(stats.avgPrice)} UF
        - Precio Promedio UF/m²: ${Math.round(stats.avgPriceM2)} UF/m²
        - Stock Total Disponible: ${stats.totalStock} unidades
        - Velocidad de Venta Promedio: ${stats.avgSalesSpeed.toFixed(1)} unidades/mes
        - Meses para Agotar Oferta (MAO): ${stats.monthsToSellOut.toFixed(1)} meses
        - Distribución por Estado: ${JSON.stringify(stats.statusDistribution)}

        Redacta un análisis breve pero perspicaz (máximo 3 párrafos).
        1. Evalúa si es un mercado de compradores o vendedores basándote en el MAO (MAO > 24 meses suele ser mercado lento/compradores).
        2. Comenta sobre los precios comparados con el promedio general (si tienes conocimiento, si no, solo describe los niveles).
        3. Identifica la etapa predominante de los proyectos (En Blanco, Verde, etc.) y qué riesgo implica para la inversión.
        
        Usa formato Markdown simple (negritas para destacar cifras). Sé profesional y directo.
        `

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o-mini", // Fast and cheap
            temperature: 0.7,
        });

        return completion.choices[0]?.message?.content || "No se pudo generar el análisis detallado."
    } catch (e) {
        console.error("OpenAI Error:", e)
        return "Hubo un error al contactar al servicio de inteligencia artificial para el análisis narrativo. Sin embargo, los datos estadísticos son correctos."
    }
}
