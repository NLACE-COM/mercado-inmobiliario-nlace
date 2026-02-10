# ⚡️ Guía de Optimización de Rendimiento

Hemos detectado que el backend puede volverse lento al manejar los 3,511 proyectos reales, especialmente en búsquedas y agregaciones.

## ✅ Optimizaciones Implementadas (Backend)

1.  **Caché en Memoria**: Se ha implementado un sistema de caché (`SimpleCache`) para las consultas más pesadas del Analista IA:
    *   `get_market_summary`: Cacheado por 10 minutos.
    *   `get_project_stats`: Cacheado por 10 minutos por combinación de filtros.
    *   `compare_regions`: Cacheado por 10 minutos.
    *   `get_top_projects_by_sales`: Cacheado por 5 minutos.

2.  **Proyección de Datos**: Las consultas ahora solo traen las columnas estrictamente necesarias (ej. `region, total_units, sold_units`) en lugar de todo el objeto (`select *`), reduciendo el uso de ancho de banda y memoria.

---

## 🚀 Acción Requerida: Crear Índices en Base de Datos

Para que las búsquedas sean instantáneas, **es necesario aplicar los índices en Supabase**. Como no tenemos acceso directo para ejecutar DDL, debes hacerlo manualmente en el Dashboard de Supabase.

### Pasos para Aplicar Índices:

1.  Ve al **Dashboard de Supabase** -> Proyecto -> **SQL Editor**.
2.  Crea una nueva consulta ("New Query").
3.  Copia y pega el contenido del siguiente archivo:
    *   Ubicación: `supabase/migrations/20260210120000_optimize_performance.sql`
4.  Ejecuta la consulta ("Run").

### Contenido SQL a Ejecutar:

```sql
-- Índices para columnas de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_projects_commune ON projects(commune);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects(developer);
CREATE INDEX IF NOT EXISTS idx_projects_property_type ON projects(property_type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(project_status);

-- Índices compuestos para filtros comunes
CREATE INDEX IF NOT EXISTS idx_projects_region_commune ON projects(region, commune);
CREATE INDEX IF NOT EXISTS idx_projects_coords ON projects(latitude, longitude);

-- Índices para ordenamiento
CREATE INDEX IF NOT EXISTS idx_projects_sales_speed ON projects(sales_speed_monthly DESC);
CREATE INDEX IF NOT EXISTS idx_projects_units_sold ON projects(sold_units DESC);
CREATE INDEX IF NOT EXISTS idx_projects_price ON projects(avg_price_uf);

-- Extensión para búsqueda de texto (opcional, mejora búsquedas parciales)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops);
```

### Impacto Esperado
*   **Búsquedas:** < 100ms (vs 1-2s actualmente)
*   **Ordenamientos:** Instantáneos
*   **Filtros Geográficos:** Optimización masiva para el mapa.

---

## 📊 Monitoreo

Si el sistema sigue lento después de aplicar los índices:
1.  Revisar logs de Supabase para "Slow Queries".
2.  Considerar usar **Materialized Views** para los resúmenes de mercado si los datos no cambian minuto a minuto.
