# 📥 Guía Rápida: Exportar desde BigQuery UI

## 🎯 Pasos para Exportar la Tabla

### 1. En la Interfaz de BigQuery que tienes abierta:

**Opción A: Exportar Directamente (Recomendado para tablas pequeñas < 1GB)**

1. Haz click en la tabla `BBDDTINSA_PYTO_CENTROcsv_1770655119181`
2. Click en el botón **"EXPORTAR"** (arriba a la derecha)
3. Selecciona **"Exportar a CSV"**
4. Elige:
   - **Formato**: CSV
   - **Compresión**: Ninguna (o GZIP si es muy grande)
   - **Ubicación**: Descarga local
5. Click en **"Exportar"**
6. Espera a que se descargue

**Opción B: Query y Exportar (Para más control)**

1. Click en **"CONSULTAR"** (botón azul)
2. En el editor SQL, escribe:
   ```sql
   SELECT * FROM `my-project-wap-486916.BBDDTINSATables.BBDDTINSA_PYTO_CENTROcsv_1770655119181`
   ```
3. Click en **"EJECUTAR"**
4. Cuando termine, click en **"GUARDAR RESULTADOS"**
5. Selecciona **"CSV (local)"**
6. Descarga el archivo

### 2. Guardar el Archivo

Una vez descargado:

```bash
# Mueve el archivo descargado a:
mv ~/Downloads/BBDDTINSA_PYTO_CENTROcsv_*.csv \
   ~/REPOS/mercado-Inmobiliario/backend/data/tinsa_export.csv
```

O manualmente:
1. Abre Finder
2. Ve a `Descargas`
3. Encuentra el archivo CSV descargado
4. Cópialo a: `REPOS/mercado-Inmobiliario/backend/data/tinsa_export.csv`

### 3. Verificar el Archivo

```bash
cd ~/REPOS/mercado-Inmobiliario/backend

# Ver las primeras líneas
head -5 data/tinsa_export.csv

# Contar filas
wc -l data/tinsa_export.csv
```

### 4. Previsualizar los Datos

```bash
.venv/bin/python -m app.etl.csv_to_supabase --preview
```

Esto mostrará:
- ✅ Todas las columnas del CSV
- ✅ Primeras 20 filas
- ✅ Total de registros

### 5. Ajustar el Mapeo

Edita el archivo: `backend/app/etl/csv_to_supabase.py`

En la función `map_tinsa_to_supabase()`, reemplaza los nombres de ejemplo con los nombres reales que viste en el preview:

```python
# Ejemplo: Si tu CSV tiene una columna llamada "Nombre_Proyecto"
"name": str(row.get("Nombre_Proyecto", f"Proyecto {idx}")),

# Si tiene "Comuna"
"commune": str(row.get("Comuna", None)),

# Si tiene "Precio_UF"
"avg_price_uf": float(row.get("Precio_UF", None)),
```

### 6. Ejecutar Dry-Run

```bash
.venv/bin/python -m app.etl.csv_to_supabase
```

Verifica que el mapeo sea correcto.

### 7. Migración Real

```bash
.venv/bin/python -m app.etl.csv_to_supabase --migrate
```

---

## 🚨 Si la Tabla es Muy Grande (> 1GB)

BigQuery no permite descargas directas de tablas muy grandes. En ese caso:

### Opción 1: Exportar a Google Cloud Storage

1. En BigQuery, click en **"EXPORTAR"**
2. Selecciona **"Exportar a GCS"**
3. Formato: CSV
4. URI: `gs://tu-bucket/tinsa_export_*.csv`
5. Luego descarga desde Cloud Storage Console

### Opción 2: Exportar por Partes

```sql
-- Exportar por comunas
SELECT * FROM `my-project-wap-486916.BBDDTINSATables.BBDDTINSA_PYTO_CENTROcsv_1770655119181`
WHERE comuna = 'Las Condes'
```

Ejecuta varias queries y exporta cada una.

---

## 📊 Verificar Datos Importados

Una vez completada la migración:

```bash
# Conectar a Supabase y verificar
psql "postgresql://postgres:[password]@db.dbnkdfedcsxtwtzrrfld.supabase.co:5432/postgres"

# O usar el SQL Editor en Supabase Dashboard
SELECT COUNT(*) FROM projects;
SELECT * FROM projects LIMIT 10;
```

O visita:
- http://localhost:3000/dashboard/projects
- http://localhost:3000/dashboard/map

---

## 🆘 Problemas Comunes

### "No se puede exportar: tabla muy grande"
→ Usa exportación a GCS o exporta por partes

### "Error de encoding al leer CSV"
→ El script prueba automáticamente UTF-8, Latin-1, ISO-8859-1

### "Columna no encontrada"
→ Revisa el preview y ajusta los nombres en `map_tinsa_to_supabase()`

### "Duplicate key error"
→ Normal, el script usa `upsert` y actualiza duplicados
