import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    const auth = await requireAuth(request)
    if (auth.error) return auth.error

    try {
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const {
            filters,
            scope,
            kpis,
            regionData,
            mixData,
            priceRangeData,
            topCommunes,
            typologyCompetition,
        } = body || {}

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.2,
            messages: [
                {
                    role: 'system',
                    content: `Eres un analista inmobiliario senior en Chile.
Genera un análisis corto en español, accionable y específico a los datos filtrados.
Prioriza siempre la comparación entre OFERTA y VENTA por TIPOLOGÍA.
Estructura estricta:
1) "Lectura Ejecutiva" (2-3 frases)
2) "Insights Clave" (3 bullets)
3) "Acciones Recomendadas" (3 bullets)
No inventes datos; usa solo los datos entregados.`,
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        filters,
                        scope,
                        kpis,
                        regionData,
                        mixData,
                        priceRangeData,
                        topCommunes,
                        typologyCompetition,
                    }),
                },
            ],
        })

        const analysis = completion.choices[0]?.message?.content?.trim() || 'No fue posible generar análisis.'

        return NextResponse.json({
            analysis,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[Dashboard Analysis] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate analysis' },
            { status: 500 }
        )
    }
}
