# 🗺️ Guía de Geocoding

## Resumen

El sistema de geocoding completa automáticamente las coordenadas geográficas de proyectos que solo tienen dirección/comuna.

## Características

- ✅ **Multi-proveedor**: Nominatim (gratuito) + Google Maps (fallback)
- ✅ **Cache local**: Evita requests repetidos
- ✅ **Rate limiting**: Respeta límites de APIs
- ✅ **Batch updates**: Actualiza BD en lotes de 50
- ✅ **Tasa de éxito**: ~80% con Nominatim

## Uso

### 1. Ver Proyectos Sin Coordenadas

```bash
cd backend
.venv/bin/python -m app.etl.geocode_projects --preview
```

Muestra:
- Total de proyectos sin coordenadas
- Muestra de 10 proyectos con sus direcciones

### 2. Probar Geocoding (Dry-Run)

```bash
.venv/bin/python -m app.etl.geocode_projects --dry-run --limit 10
```

Prueba geocoding en 10 proyectos sin actualizar la BD.

### 3. Geocoding Real (Batch Pequeño)

```bash
.venv/bin/python -m app.etl.geocode_projects --limit 100
```

Geocodifica y actualiza 100 proyectos en la BD.

**Tiempo estimado**: ~2-3 minutos (1.5s por proyecto)

### 4. Geocoding Completo

```bash
# Para todos los proyectos sin coordenadas
.venv/bin/python -m app.etl.geocode_projects --limit 1000
```

**Tiempo estimado**: ~25-30 minutos para 1,000 proyectos

## Estadísticas

Durante la ejecución verás:

```
🗺️  Geocoding de Proyectos sin Coordenadas
================================================================================

📊 Buscando proyectos sin coordenadas...
✅ Encontrados: 100 proyectos sin coordenadas

🔄 Iniciando geocoding...

  ✅ [1/100] EDIFICIO BOULEVARD DEL MAR → (-20.2140, -70.1522)
  ❌ [2/100] PROYECTO SIN DIRECCION - Sin dirección
  ✅ [3/100] CONDOMINIO PUERTO SERENA → (-29.9059, -71.2570)
  ...
  💾 Actualizados 50 proyectos en BD
  ...

================================================================================
📊 RESUMEN
================================================================================
✅ Geocodificados: 85
❌ Fallidos: 15

📊 Estadísticas de Geocoding:
  ✅ Cache hits: 10
  ✅ Nominatim: 75
  ❌ Fallos: 15
  📈 Tasa de éxito: 85.0%
```

## Cache

El sistema mantiene un cache local en:
```
backend/data/geocoding_cache.json
```

Beneficios:
- ✅ Requests instantáneos para direcciones ya geocodificadas
- ✅ Reduce carga en APIs externas
- ✅ Persiste entre ejecuciones

## Google Maps (Opcional)

Para mejorar la tasa de éxito, puedes agregar una API key de Google Maps:

1. **Obtener API Key**:
   - https://console.cloud.google.com/apis/credentials
   - Habilitar "Geocoding API"

2. **Configurar en `.env`**:
   ```bash
   GOOGLE_MAPS_API_KEY=tu_api_key_aqui
   ```

3. **Ejecutar**:
   El sistema usará automáticamente Google Maps como fallback cuando Nominatim falle.

## Limitaciones

### Nominatim (OpenStreetMap)
- ✅ Gratuito
- ✅ Sin API key
- ⚠️  Límite: 1 request/segundo
- ⚠️  Tasa de éxito: ~70-80%

### Google Maps
- ⚠️  Requiere API key
- ⚠️  $5 USD por 1,000 requests (después de crédito gratuito)
- ✅ Tasa de éxito: ~95%

## Troubleshooting

### "No encontrado" para muchos proyectos

**Causa**: Direcciones incompletas o mal formateadas en el CSV original.

**Solución**:
1. Verificar datos en Supabase
2. Completar direcciones manualmente para proyectos importantes
3. Usar Google Maps como fallback

### "Rate limit exceeded"

**Causa**: Demasiados requests muy rápido.

**Solución**: El script ya incluye delays automáticos. Si persiste, aumentar `DELAY_BETWEEN_REQUESTS` en el código.

### Cache corrupto

**Solución**:
```bash
rm backend/data/geocoding_cache.json
```

## Verificar Resultados

### En Supabase Dashboard

```sql
-- Total con coordenadas
SELECT COUNT(*) 
FROM projects 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Por región
SELECT region, COUNT(*) as total,
       SUM(CASE WHEN latitude IS NOT NULL THEN 1 ELSE 0 END) as con_coords
FROM projects
GROUP BY region
ORDER BY total DESC;
```

### En el Dashboard Web

1. Ir a: http://localhost:3000/dashboard/map
2. Ver proyectos en el mapa
3. Los proyectos sin coordenadas no aparecerán

## Mejoras Futuras

1. **Geocoding Inverso**: Obtener direcciones desde coordenadas
2. **Validación de Coordenadas**: Verificar que estén en Chile
3. **Geocoding Batch**: Procesar múltiples direcciones en paralelo
4. **UI de Corrección**: Interfaz para corregir coordenadas manualmente
