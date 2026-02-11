# PLAN DE INTEGRACIÓN API TOCTOC
## Estrategia de Enriquecimiento de Datos

**Fecha:** 11 de Febrero 2026
**Objetivo:** Integrar datos de TocToc para enriquecer reportes con información de mercado complementaria
**Enfoque:** Integración incremental, no invasiva, con datos existentes

---

## 📊 CONTEXTO Y VALOR

### ¿Qué es TocToc?

TocToc es el **tercer portal inmobiliario más visitado de Chile**, fundado en 2011, con:
- +140,000 propiedades (venta y arriendo)
- Cobertura nacional (Santiago y regiones)
- Herramientas de financiamiento y tasación
- Sistema de tours virtuales con realidad virtual

### ¿Por qué integrar TocToc?

**Valor agregado:**
1. **Datos de listados activos** - Propiedades publicadas en tiempo real
2. **Precios de publicación** - Referencias de mercado actuales
3. **Metadata enriquecida** - Amenidades, características, fotos
4. **Volumen de oferta** - Indicador de competencia por zona
5. **Cross-validation** - Comparar datos internos vs mercado público

**Diferenciación:**
- Reportes más completos combinando datos propios + TocToc
- Análisis de competencia con datos reales de publicaciones
- Detección de gaps en oferta vs demanda
- Benchmarking de precios publicados vs transados

---

## 🏗️ ARQUITECTURA DE INTEGRACIÓN

### Principios de Diseño

1. **No invasiva** - No reemplaza datos existentes, los complementa
2. **Asíncrona** - Sincronización en background, no bloquea UI
3. **Resiliente** - Manejo robusto de errores de API externa
4. **Auditable** - Log completo de sincronizaciones
5. **Incremental** - Datos TocToc como capa adicional opcional

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Dashboard / Analytics / Reportes                 │  │
│  └───────────────────┬──────────────────────────────┘  │
│                      │                                   │
│                      ▼                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Unified Data Layer (combina datos propios +     │  │
│  │  TocToc)                                          │  │
│  └───────────────────┬──────────────────────────────┘  │
└────────────────────┬─┴───────────────────────────────┬──┘
                     │                                  │
            ┌────────▼────────┐              ┌─────────▼────────┐
            │  Supabase DB    │              │  TocToc Cache    │
            │  (datos propios)│              │  (Supabase)      │
            └─────────────────┘              └─────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Supabase Edge  │
                                              │  Function       │
                                              │  (sync worker)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  TocToc API     │
                                              │  (api.toctoc    │
                                              │  .com)          │
                                              └─────────────────┘
```

---

## 🗄️ MODELO DE DATOS

### Nueva Tabla: `toctoc_listings`

Almacena datos sincronizados desde TocToc API:

```sql
CREATE TABLE toctoc_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación TocToc
  toctoc_id VARCHAR(100) UNIQUE NOT NULL,
  toctoc_url TEXT,

  -- Información básica
  title TEXT NOT NULL,
  description TEXT,
  property_type VARCHAR(50), -- 'casa', 'departamento', 'oficina', etc.
  operation_type VARCHAR(20), -- 'venta', 'arriendo'

  -- Ubicación
  region VARCHAR(100),
  commune VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Características
  bedrooms INTEGER,
  bathrooms INTEGER,
  total_area_m2 DECIMAL(10, 2),
  built_area_m2 DECIMAL(10, 2),
  parking_spaces INTEGER,

  -- Precios
  price_clp BIGINT,
  price_uf DECIMAL(12, 2),
  price_per_m2_uf DECIMAL(10, 2),
  maintenance_fee_clp INTEGER,

  -- Metadata
  amenities JSONB, -- ['piscina', 'gimnasio', 'terraza', etc.]
  images JSONB, -- [{url, alt}]
  construction_year INTEGER,
  developer VARCHAR(255),
  project_name VARCHAR(255),

  -- Estado
  listing_status VARCHAR(50) DEFAULT 'active', -- 'active', 'sold', 'removed'
  publication_date TIMESTAMP,
  last_updated TIMESTAMP,

  -- Sincronización
  synced_at TIMESTAMP DEFAULT NOW(),
  sync_source VARCHAR(50) DEFAULT 'api', -- 'api', 'manual'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_toctoc_commune ON toctoc_listings(commune);
CREATE INDEX idx_toctoc_property_type ON toctoc_listings(property_type);
CREATE INDEX idx_toctoc_price_uf ON toctoc_listings(price_uf);
CREATE INDEX idx_toctoc_operation ON toctoc_listings(operation_type);
CREATE INDEX idx_toctoc_status ON toctoc_listings(listing_status);
CREATE INDEX idx_toctoc_location ON toctoc_listings USING GIST(
  ll_to_earth(latitude, longitude)
);
```

### Nueva Tabla: `toctoc_sync_log`

Auditoría de sincronizaciones:

```sql
CREATE TABLE toctoc_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'commune'
  status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'

  -- Parámetros
  filters JSONB, -- {commune: 'ÑUÑOA', operation: 'venta'}

  -- Resultados
  records_fetched INTEGER,
  records_created INTEGER,
  records_updated INTEGER,
  records_failed INTEGER,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  triggered_by VARCHAR(50), -- 'cron', 'manual', 'user_request'
  user_id UUID REFERENCES auth.users(id)
);
```

### Tabla de Relación: `project_toctoc_matches`

Relaciona proyectos internos con listings de TocToc:

```sql
CREATE TABLE project_toctoc_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  toctoc_listing_id UUID REFERENCES toctoc_listings(id) ON DELETE CASCADE,

  -- Confianza del match
  match_confidence DECIMAL(3, 2), -- 0.00 - 1.00
  match_method VARCHAR(50), -- 'exact_name', 'address', 'coordinates', 'manual'

  -- Estado
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(project_id, toctoc_listing_id)
);
```

---

## 🔌 CAPA DE INTEGRACIÓN

### 1. Cliente API TocToc

```typescript
// backend/src/lib/integrations/toctoc-client.ts

import { createClient } from '@supabase/supabase-js'

interface TocTocConfig {
  apiKey: string
  baseUrl: string
  timeout: number
}

interface TocTocListingResponse {
  id: string
  title: string
  price: number
  currency: string
  // ... más campos según API real
}

interface TocTocSearchParams {
  commune?: string
  region?: string
  operation?: 'venta' | 'arriendo'
  propertyType?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export class TocTocClient {
  private config: TocTocConfig
  private supabase: ReturnType<typeof createClient>

  constructor(config: TocTocConfig) {
    this.config = config
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  /**
   * Buscar propiedades en TocToc API
   */
  async searchListings(params: TocTocSearchParams): Promise<TocTocListingResponse[]> {
    try {
      const url = new URL(`${this.config.baseUrl}/listings/search`)

      // Construir query params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`TocToc API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.results || []

    } catch (error) {
      console.error('[TocToc] Search error:', error)

      // Log error a Supabase
      await this.logError('search', params, error)

      throw error
    }
  }

  /**
   * Obtener detalle de una propiedad específica
   */
  async getListingDetails(toctocId: string): Promise<TocTocListingResponse> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/listings/${toctocId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(this.config.timeout)
        }
      )

      if (!response.ok) {
        throw new Error(`TocToc API error: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error(`[TocToc] Get listing ${toctocId} error:`, error)
      await this.logError('get_listing', { toctocId }, error)
      throw error
    }
  }

  /**
   * Rate limiting y retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        if (i === maxRetries - 1) throw error

        // Retry en caso de rate limit o errores 5xx
        if (error.status === 429 || error.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
          continue
        }

        throw error
      }
    }
    throw new Error('Max retries exceeded')
  }

  /**
   * Log de errores
   */
  private async logError(operation: string, params: any, error: any) {
    try {
      await this.supabase.from('toctoc_sync_log').insert({
        sync_type: operation,
        status: 'failed',
        filters: params,
        error_message: error.message,
        error_details: {
          stack: error.stack,
          name: error.name
        },
        triggered_by: 'api_client'
      })
    } catch (logError) {
      console.error('[TocToc] Failed to log error:', logError)
    }
  }
}

// Singleton instance
let toctocClient: TocTocClient | null = null

export function getTocTocClient(): TocTocClient {
  if (!toctocClient) {
    toctocClient = new TocTocClient({
      apiKey: process.env.TOCTOC_API_KEY!,
      baseUrl: process.env.TOCTOC_API_URL || 'https://api.toctoc.com',
      timeout: 30000 // 30 segundos
    })
  }
  return toctocClient
}
```

### 2. Servicio de Sincronización

```typescript
// backend/src/lib/integrations/toctoc-sync.ts

import { getTocTocClient } from './toctoc-client'
import { createClient } from '@supabase/supabase-js'

interface SyncOptions {
  commune?: string
  operation?: 'venta' | 'arriendo'
  incremental?: boolean
}

export class TocTocSyncService {
  private client = getTocTocClient()
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  /**
   * Sincronizar listings de una comuna específica
   */
  async syncCommune(commune: string, options: SyncOptions = {}) {
    const syncLogId = await this.startSyncLog('commune', { commune, ...options })

    try {
      let page = 1
      let totalFetched = 0
      let totalCreated = 0
      let totalUpdated = 0
      const limit = 50

      while (true) {
        // Fetch página de TocToc
        const listings = await this.client.searchListings({
          commune,
          operation: options.operation || 'venta',
          page,
          limit
        })

        if (listings.length === 0) break

        // Procesar cada listing
        for (const listing of listings) {
          const result = await this.upsertListing(listing)
          if (result === 'created') totalCreated++
          if (result === 'updated') totalUpdated++
        }

        totalFetched += listings.length
        page++

        // Rate limiting
        await this.sleep(1000)

        // Si no hay más resultados, salir
        if (listings.length < limit) break
      }

      // Completar log
      await this.completeSyncLog(syncLogId, {
        status: 'completed',
        records_fetched: totalFetched,
        records_created: totalCreated,
        records_updated: totalUpdated
      })

      return {
        success: true,
        fetched: totalFetched,
        created: totalCreated,
        updated: totalUpdated
      }

    } catch (error: any) {
      await this.failSyncLog(syncLogId, error)
      throw error
    }
  }

  /**
   * Upsert de un listing
   */
  private async upsertListing(listing: any): Promise<'created' | 'updated' | 'skipped'> {
    try {
      // Normalizar datos de TocToc a nuestro schema
      const normalized = this.normalizeListing(listing)

      // Verificar si existe
      const { data: existing } = await this.supabase
        .from('toctoc_listings')
        .select('id, updated_at')
        .eq('toctoc_id', normalized.toctoc_id)
        .single()

      if (existing) {
        // Update si hay cambios
        if (this.hasChanges(existing, normalized)) {
          await this.supabase
            .from('toctoc_listings')
            .update({
              ...normalized,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          return 'updated'
        }
        return 'skipped'
      } else {
        // Insert nuevo
        await this.supabase
          .from('toctoc_listings')
          .insert(normalized)

        return 'created'
      }

    } catch (error) {
      console.error('[TocToc] Upsert error:', error)
      throw error
    }
  }

  /**
   * Normalizar datos de TocToc API a nuestro schema
   */
  private normalizeListing(listing: any) {
    return {
      toctoc_id: listing.id,
      toctoc_url: listing.url || `https://www.toctoc.com/propiedad/${listing.id}`,
      title: listing.title,
      description: listing.description,
      property_type: this.mapPropertyType(listing.property_type),
      operation_type: listing.operation_type,
      region: listing.location?.region,
      commune: listing.location?.commune?.toUpperCase(),
      address: listing.location?.address,
      latitude: listing.location?.coordinates?.lat,
      longitude: listing.location?.coordinates?.lng,
      bedrooms: listing.characteristics?.bedrooms,
      bathrooms: listing.characteristics?.bathrooms,
      total_area_m2: listing.characteristics?.total_area,
      built_area_m2: listing.characteristics?.built_area,
      parking_spaces: listing.characteristics?.parking,
      price_clp: listing.price?.clp,
      price_uf: listing.price?.uf,
      price_per_m2_uf: listing.price?.uf_per_m2,
      maintenance_fee_clp: listing.price?.maintenance_fee,
      amenities: listing.amenities || [],
      images: listing.images || [],
      construction_year: listing.characteristics?.year_built,
      developer: listing.developer?.name,
      project_name: listing.project_name,
      listing_status: listing.status || 'active',
      publication_date: listing.published_at,
      last_updated: listing.updated_at,
      synced_at: new Date().toISOString()
    }
  }

  /**
   * Mapear tipos de propiedad
   */
  private mapPropertyType(type: string): string {
    const mapping: Record<string, string> = {
      'apartment': 'departamento',
      'house': 'casa',
      'office': 'oficina',
      'land': 'terreno',
      'warehouse': 'bodega'
    }
    return mapping[type] || type
  }

  /**
   * Detectar cambios
   */
  private hasChanges(existing: any, normalized: any): boolean {
    // Comparar campos clave
    const keys = ['price_uf', 'listing_status', 'description']
    return keys.some(key => existing[key] !== normalized[key])
  }

  /**
   * Helpers para sync log
   */
  private async startSyncLog(type: string, filters: any): Promise<string> {
    const { data } = await this.supabase
      .from('toctoc_sync_log')
      .insert({
        sync_type: type,
        status: 'running',
        filters,
        triggered_by: 'system'
      })
      .select('id')
      .single()

    return data!.id
  }

  private async completeSyncLog(id: string, results: any) {
    await this.supabase
      .from('toctoc_sync_log')
      .update({
        ...results,
        completed_at: new Date().toISOString(),
        duration_seconds: 0 // calcular
      })
      .eq('id', id)
  }

  private async failSyncLog(id: string, error: any) {
    await this.supabase
      .from('toctoc_sync_log')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

---

## 🔄 ESTRATEGIA DE SINCRONIZACIÓN

### Opciones de Sincronización

#### 1. Sincronización Programada (Cron)

```typescript
// supabase/functions/toctoc-sync-cron/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { TocTocSyncService } from '../../../backend/src/lib/integrations/toctoc-sync.ts'

serve(async (req) => {
  try {
    const syncService = new TocTocSyncService()

    // Obtener todas las comunas únicas de los proyectos existentes
    const { data: projects } = await supabase
      .from('projects')
      .select('commune')
      .not('commune', 'is', null)

    const communes = [...new Set(projects.map(p => p.commune))]
      .sort()

    const results = []

    for (const commune of communes) {
      console.log(`[Cron] Syncing ${commune}...`)

      const result = await syncService.syncCommune(commune, {
        operation: 'venta'
      })

      results.push({ commune, ...result })

      // Delay entre comunas para no saturar API
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_communes: results.length,
        results
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('[Cron] Sync error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

**Configurar en Supabase:**
```sql
-- Crear cron job (ejecutar diariamente a las 2 AM)
SELECT cron.schedule(
  'toctoc-daily-sync',
  '0 2 * * *', -- 2 AM diariamente
  $$
    SELECT net.http_post(
      url := 'https://[proyecto-id].supabase.co/functions/v1/toctoc-sync-cron',
      headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
    );
  $$
);
```

#### 2. Sincronización On-Demand

```typescript
// frontend/src/app/api/sync/toctoc/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { TocTocSyncService } from '@/lib/integrations/toctoc-sync'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parsear parámetros
    const body = await request.json()
    const { commune, operation } = body

    if (!commune) {
      return NextResponse.json(
        { error: 'Commune is required' },
        { status: 400 }
      )
    }

    // Ejecutar sincronización
    const syncService = new TocTocSyncService()
    const result = await syncService.syncCommune(commune, { operation })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('[API] TocToc sync error:', error)

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 📊 ENRIQUECIMIENTO DE REPORTES

### Integración en Generación de Reportes

```typescript
// backend/src/lib/reports/commune-market-report-enhanced.ts

import { createClient } from '@supabase/supabase-js'

interface EnhancedMarketData {
  // Datos propios
  internalProjects: any[]
  internalMetrics: any

  // Datos TocToc
  toctocListings: any[]
  toctocMetrics: any

  // Análisis combinado
  combined: {
    totalSupply: number
    avgPriceGap: number
    competitionIndex: number
  }
}

export async function generateEnhancedCommuneReport(commune: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Obtener datos internos (existente)
  const { data: internalProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('commune', commune)

  // 2. Obtener datos TocToc
  const { data: toctocListings } = await supabase
    .from('toctoc_listings')
    .select('*')
    .eq('commune', commune)
    .eq('listing_status', 'active')
    .eq('operation_type', 'venta')

  // 3. Calcular métricas combinadas
  const enhancedData = combineDataSources(internalProjects, toctocListings)

  // 4. Generar secciones del reporte
  const sections = [
    // Secciones existentes...

    // NUEVA: Análisis de Competencia TocToc
    {
      type: 'text',
      title: 'Análisis de Oferta Pública (TocToc)',
      content: generateTocTocAnalysis(toctocListings, enhancedData)
    },

    // NUEVA: Comparación Precios
    {
      type: 'chart',
      chartType: 'comparison_bar',
      title: 'Comparación Precios: Datos Propios vs Mercado Público',
      data: {
        categories: ['0-2000 UF', '2000-3000 UF', '3000-4000 UF', '4000+ UF'],
        series: [
          {
            name: 'Datos Propios',
            data: calculatePriceDistribution(internalProjects)
          },
          {
            name: 'TocToc (Publicados)',
            data: calculatePriceDistribution(toctocListings)
          }
        ]
      }
    },

    // NUEVA: Gaps de Oferta
    {
      type: 'table',
      title: 'Gaps de Oferta por Tipología',
      data: identifySupplyGaps(internalProjects, toctocListings)
    }
  ]

  return {
    title: `Análisis de Mercado Completo: ${commune}`,
    sections,
    metadata: {
      internal_projects: internalProjects.length,
      toctoc_listings: toctocListings.length,
      generated_at: new Date().toISOString()
    }
  }
}

function combineDataSources(internal: any[], toctoc: any[]) {
  const totalSupply =
    internal.reduce((sum, p) => sum + p.available_units, 0) +
    toctoc.length

  const avgPriceInternal = internal.reduce((sum, p) => sum + p.avg_price_uf, 0) / internal.length
  const avgPriceTocToc = toctoc.reduce((sum, l) => sum + l.price_uf, 0) / toctoc.length

  const avgPriceGap = ((avgPriceTocToc - avgPriceInternal) / avgPriceInternal) * 100

  return {
    totalSupply,
    avgPriceGap,
    competitionIndex: toctoc.length / internal.length
  }
}

function generateTocTocAnalysis(listings: any[], combinedData: any): string {
  return `
## Análisis de Oferta Pública (TocToc)

Se identificaron **${listings.length} propiedades** activamente publicadas en TocToc para esta comuna.

### Insights Clave:

- **Precio Promedio Publicado**: ${calculateAvg(listings, 'price_uf').toFixed(0)} UF
- **Gap vs Datos Transaccionales**: ${combinedData.avgPriceGap > 0 ? '+' : ''}${combinedData.avgPriceGap.toFixed(1)}%
- **Ratio Competencia**: ${combinedData.competitionIndex.toFixed(2)}x (publicaciones vs proyectos internos)

${combinedData.avgPriceGap > 10
  ? '⚠️ **Alerta**: Los precios publicados están significativamente sobre los datos transaccionales, lo que podría indicar sobrevaloración o baja velocidad de venta.'
  : '✓ Los precios publicados están alineados con datos transaccionales.'
}
  `.trim()
}

function identifySupplyGaps(internal: any[], toctoc: any[]) {
  const typologies = ['1D-1B', '2D-1B', '2D-2B', '3D-2B', '3D-3B']

  return typologies.map(typ => {
    const internalCount = internal.filter(p =>
      p.property_type?.includes(typ)
    ).length

    const toctocCount = toctoc.filter(l =>
      matchTypology(l, typ)
    ).length

    const gap = toctocCount - internalCount

    return {
      typology: typ,
      internal: internalCount,
      toctoc: toctocCount,
      gap,
      gap_percentage: internalCount > 0 ? (gap / internalCount * 100).toFixed(1) + '%' : 'N/A',
      interpretation: gap > 5
        ? '⬆️ Sobre-ofertado'
        : gap < -5
        ? '⬇️ Sub-ofertado (oportunidad)'
        : '➡️ Equilibrado'
    }
  })
}

function calculateAvg(arr: any[], field: string): number {
  const values = arr.map(item => item[field]).filter(v => v != null)
  return values.length > 0
    ? values.reduce((sum, v) => sum + v, 0) / values.length
    : 0
}

function matchTypology(listing: any, typology: string): boolean {
  const [bedrooms, bathrooms] = typology.split('-').map(s => parseInt(s.replace(/\D/g, '')))
  return listing.bedrooms === bedrooms && listing.bathrooms === bathrooms
}

function calculatePriceDistribution(items: any[]): number[] {
  const ranges = [
    { min: 0, max: 2000 },
    { min: 2000, max: 3000 },
    { min: 3000, max: 4000 },
    { min: 4000, max: Infinity }
  ]

  return ranges.map(range =>
    items.filter(item => {
      const price = item.avg_price_uf || item.price_uf || 0
      return price >= range.min && price < range.max
    }).length
  )
}
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura Base
**Esfuerzo:** ⚡⚡ (Bajo-Medio)
**Impacto:** ⭐⭐⭐ (Medio)

**Tareas:**
1. Crear tablas en Supabase (`toctoc_listings`, `toctoc_sync_log`, `project_toctoc_matches`)
2. Configurar variables de entorno para API de TocToc
3. Implementar `TocTocClient` base con autenticación
4. Testing de conectividad con API

**Archivos a crear:**
- `supabase/migrations/202602XX_create_toctoc_tables.sql`
- `backend/src/lib/integrations/toctoc-client.ts`
- `.env.local` (agregar `TOCTOC_API_KEY`, `TOCTOC_API_URL`)

---

### Fase 2: Sincronización Básica
**Esfuerzo:** ⚡⚡⚡ (Medio)
**Impacto:** ⭐⭐⭐⭐ (Alto)

**Tareas:**
1. Implementar `TocTocSyncService` con método `syncCommune()`
2. Crear endpoint API `/api/sync/toctoc` para sync manual
3. Testing con comuna piloto (ej: Ñuñoa)
4. Validar normalización de datos

**Resultado esperado:**
- Capacidad de sincronizar listings de una comuna específica
- Datos almacenados correctamente en `toctoc_listings`
- Log de sincronización funcionando

---

### Fase 3: Enriquecimiento de Reportes
**Esfuerzo:** ⚡⚡⚡ (Medio)
**Impacto:** ⭐⭐⭐⭐⭐ (Muy Alto)

**Tareas:**
1. Modificar función `generateCommuneMarketReport()` para incluir datos TocToc
2. Crear nuevas secciones de reporte:
   - Análisis de oferta pública
   - Comparación de precios
   - Gaps de oferta por tipología
3. Agregar gráficos comparativos (datos propios vs TocToc)
4. Testing de reportes enriquecidos

**Archivos a modificar:**
- `backend/src/lib/reports/commune-market-report.ts`
- `frontend/src/components/reports/ReportRenderer.tsx` (nuevas secciones)

---

### Fase 4: Automatización
**Esfuerzo:** ⚡⚡ (Bajo)
**Impacto:** ⭐⭐⭐ (Medio)

**Tareas:**
1. Crear Supabase Edge Function para cron job
2. Configurar sincronización diaria (2 AM)
3. Implementar alertas de errores
4. Dashboard de monitoreo de sincronizaciones

**Archivos a crear:**
- `supabase/functions/toctoc-sync-cron/index.ts`
- `frontend/src/app/admin/sync-monitor/page.tsx`

---

### Fase 5: Matching y Validación
**Esfuerzo:** ⚡⚡⚡⚡ (Alto)
**Impacto:** ⭐⭐⭐⭐ (Alto)

**Tareas:**
1. Implementar algoritmo de matching entre proyectos internos y TocToc
2. UI para revisar y validar matches
3. Sistema de puntuación de confianza
4. Alertas de duplicados o inconsistencias

**Resultado esperado:**
- Tabla `project_toctoc_matches` poblada
- Dashboard de validación de matches
- Reportes con datos 100% confiables

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs de Integración

1. **Cobertura de Datos**
   - % de comunas sincronizadas
   - Listings sincronizados vs total disponible en TocToc

2. **Calidad de Sincronización**
   - Tasa de éxito de sync jobs (> 95%)
   - Tiempo promedio de sincronización
   - Errores por cada 1000 registros (< 1%)

3. **Valor en Reportes**
   - % de reportes que usan datos TocToc
   - Feedback de usuarios sobre insights adicionales
   - Tiempo de generación de reportes enriquecidos

4. **Operacional**
   - Uptime de API TocToc (monitorear)
   - Costo de llamadas API
   - Storage usado por datos TocToc

---

## ⚠️ CONSIDERACIONES Y RIESGOS

### Riesgos Técnicos

1. **Dependencia de API Externa**
   - **Riesgo:** TocToc API puede tener downtime o cambios
   - **Mitigación:** Cache local, fallback a datos propios, alertas

2. **Rate Limiting**
   - **Riesgo:** Límite de requests por minuto/día
   - **Mitigación:** Implementar retry exponencial, distribuir sync en el tiempo

3. **Calidad de Datos TocToc**
   - **Riesgo:** Datos incompletos, desactualizados o incorrectos
   - **Mitigación:** Validación robusta, campos opcionales, filtros de calidad

4. **Costo de Almacenamiento**
   - **Riesgo:** +100k listings pueden ocupar espacio significativo
   - **Mitigación:** Política de retención (eliminar listings antiguos), comprimir imágenes

### Riesgos de Negocio

1. **Términos de Uso de TocToc API**
   - **Acción:** Revisar TOS y límites de uso comercial

2. **Competencia con TocToc**
   - **Consideración:** No replicar funcionalidad core, solo enriquecer análisis

---

## 🔧 CONFIGURACIÓN DE ENTORNO

### Variables de Entorno

```bash
# .env.local

# TocToc API
TOCTOC_API_KEY=your_api_key_here
TOCTOC_API_URL=https://api.toctoc.com
TOCTOC_API_TIMEOUT=30000

# Configuración de sincronización
TOCTOC_SYNC_ENABLED=true
TOCTOC_SYNC_INTERVAL=daily
# Las comunas se obtienen automáticamente de la tabla projects
```

### Permisos Supabase

```sql
-- RLS para toctoc_listings (solo lectura para usuarios autenticados)
ALTER TABLE toctoc_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON toctoc_listings FOR SELECT
  TO authenticated
  USING (true);

-- Solo service_role puede insertar/actualizar
CREATE POLICY "Service role full access"
  ON toctoc_listings FOR ALL
  TO service_role
  USING (true);
```

---

## 🚀 INICIO RÁPIDO

```bash
# 1. Crear tablas
cd supabase
supabase migration new create_toctoc_integration
# Copiar SQL de la sección "Modelo de Datos"
supabase db push

# 2. Configurar variables de entorno
echo "TOCTOC_API_KEY=tu_api_key" >> .env.local
echo "TOCTOC_API_URL=https://api.toctoc.com" >> .env.local

# 3. Instalar dependencias (si necesario)
cd backend
npm install

# 4. Test de conectividad
npm run test:toctoc-connection

# 5. Sincronización manual de comuna piloto
curl -X POST http://localhost:3000/api/sync/toctoc \
  -H "Content-Type: application/json" \
  -d '{"commune": "ÑUÑOA", "operation": "venta"}'

# 6. Verificar datos sincronizados
psql $DATABASE_URL -c "SELECT COUNT(*) FROM toctoc_listings WHERE commune='ÑUÑOA';"
```

---

## 📚 RECURSOS

### Documentación TocToc
- API Docs: https://api.toctoc.com/docs/
- Portal: https://www.toctoc.com/

### Referencias Internas
- `PLAN_MEJORAS_OPTIMIZADO.md` - Plan general de MVP
- `docs/REAL_DATA_UPDATE.md` - Actualización de datos
- `docs/REPORTING_ENGINE_PLAN.md` - Motor de reportes

---

**Documento creado por:** Claude Code (Sonnet 4.5)
**Fecha:** 11 de Febrero 2026
**Versión:** 1.0 - Plan de Integración TocToc

**Fuentes:**
- [TocToc API Documentation](https://api.toctoc.com/docs/)
- [TocToc - Portal Inmobiliario Chile](https://www.toctoc.com/)
- [Los 10 Mejores Portales Inmobiliarios en Chile 2026](https://urbani.cl/10-mejores-portales-inmobiliarios-en-chile/)
