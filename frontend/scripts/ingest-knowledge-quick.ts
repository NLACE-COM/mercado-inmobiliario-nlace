import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
    console.error('Missing environment variables in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiKey })

const documents = [
    {
        content: `Ley 21.210/2020 - IVA Viviendas
Contenido clave:
- Vigencia: Enero 2021
- Umbral: >2000 UF Y >140m²
- IVA: 19% sobre precio
- Impacto: Vivienda 4000 UF → +760 UF
- Consecuencias: Caída 50% ventas segmento >4000 UF en el periodo inicial de implementación.
- Fuente: Ley 21.210/2020 Diario Oficial`,
        metadata: {
            source: 'Ley 21.210/2020',
            type: 'ley',
            date: '2020-02-24',
            topic: ['iva', 'impuestos', 'vivienda_premium']
        }
    },
    {
        content: `Ley 21.442 - Subsidios DS1/DS19
Conceptos clave:
- DS1 (Clase Media): Subsidio para viviendas de hasta 2000-2400 UF. Generalmente varía entre 250 a 500 UF según tramo.
- DS19 (Programa de Integración Social): Para viviendas de hasta 1200 UF (vulnerables) y hasta 2200 UF (sectores medios).
- Impacto: Impulsa fuertemente la demanda en el rango 2000-3500 UF al facilitar el pie y financiamiento.
- Fuente: MINVU (Ministerio de Vivienda y Urbanismo)`,
        metadata: {
            source: 'MINVU',
            type: 'ley/subsidio',
            topic: ['subsidios', 'clase_media', 'ds1', 'ds19']
        }
    },
    {
        content: `Impacto Inmobiliario del Estallido Social 2019
Datos clave:
- Fecha de inicio: 18 de octubre de 2019.
- Duración del impacto directo: Aproximadamente 18 meses.
- Absorción mensual: Cayó de un promedio de 12.5% a 7.8% (caída del 37% en la velocidad de venta).
- Meses para Agotar Oferta (MAO): Aumentó significativamente de 9.2 meses a 18.3 meses.
- Sectores más afectados: Santiago Centro (-35% en ventas), Providencia (-28%).
- Fuente: Estudios CChC + Inteligencia de Mercado TINSA`,
        metadata: {
            source: 'CChC/TINSA',
            type: 'historia_mercado',
            date: '2019-10-18',
            topic: ['estallido_social', 'crisis', 'santiago_centro', 'mao']
        }
    },
    {
        content: `Impacto Pandemia COVID-19 (2020-2021)
Fases del mercado:
- Shock Inicial (Marzo-Junio 2020): Ventas cayeron un 67% debido a cuarentenas y total incertidumbre.
- Boom de Recuperación (Enero-Junio 2021): Ventas aumentaron un 45% impulsadas por la Tasa de Política Monetaria (TPM) en 0.5% (mínimo histórico) y los retiros de fondos de pensiones (AFP).
- Normalización posterior (Julio 2021+): Alzas en la TPM y fin de liquidez extraordinaria llevaron a una baja progresiva en la absorción.
Cambios permanentes: Mayor demanda por departamentos con terrazas, espacios para home office y aceleración de la digitalización en salas de ventas.
Fuente: CChC + Banco Central de Chile`,
        metadata: {
            source: 'CChC/Banco Central',
            type: 'historia_mercado',
            date: '2020-03-01',
            topic: ['covid19', 'pandemia', 'tpm', 'liquidez']
        }
    },
    {
        content: `TPM y Crédito Hipotecario en Chile
Evolución de la Tasa de Política Monetaria (TPM):
- 2020: 0.5% (mínimo histórico post-pandemia).
- Octubre 2022: 11.25% (peak para controlar inflación).
- Febrero 2026: ~4.0% (nivel de normalización actual).

Impacto en dividendo estimado (para crédito de 3000 UF a 20 años):
- Escenario TPM 0.5%: Dividendo aproximado ~9.5 UF/mes.
- Escenario TPM 11.25%: Dividendo aproximado ~19.2 UF/mes (+102% de aumento).

Elasticidad del mercado: Se estima que por cada +1% en la tasa hipotecaria, las ventas caen aproximadamente un 8% (ceteris paribus).
Fuente: Banco Central de Chile`,
        metadata: {
            source: 'Banco Central',
            type: 'economia',
            topic: ['tpm', 'tasas_interes', 'credito_hipotecario', 'dividendo']
        }
    }
]

async function ingest() {
    console.log('--- Iniciando Ingesta de Knowledge Base Inicial ---')

    for (const doc of documents) {
        try {
            console.log(`Ingestando: ${doc.metadata.source || 'Documento'}...`)

            // Generate embedding using OpenAI
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: doc.content,
            })
            const embedding = response.data[0].embedding

            // Insert into Supabase
            const { data, error } = await supabase
                .from('knowledge_docs')
                .insert({
                    content: doc.content,
                    metadata: doc.metadata,
                    embedding: embedding
                })
                .select()

            if (error) {
                console.error(`Error en Supabase para ${doc.metadata.source}:`, error.message)
            } else {
                console.log(`¡Éxito! ID: ${data[0].id}`)
            }
        } catch (error: any) {
            console.error(`Error procesando documento:`, error.message)
        }
    }

    console.log('--- Proceso Finalizado ---')
}

ingest()
