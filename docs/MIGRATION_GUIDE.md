# 🔄 Guía de Migración: BigQuery → Supabase

Esta guía te ayudará a migrar los datos de TINSA desde Google BigQuery a tu base de datos Supabase.

## 📋 Requisitos Previos

1. **Acceso a Google Cloud Console**
   - Proyecto: `my-project-wap-486916`
   - Dataset: `BBDDTINSATables`
   - Tabla: `BBDDTINSA_PYTO_CENTROcsv_1770655119181`

2. **Credenciales de Google Cloud**
   - Service Account con permisos de BigQuery

## 🚀 Pasos de Configuración

### 1. Instalar Dependencias

```bash
cd backend
.venv/bin/pip install -r requirements-bigquery.txt
```

Esto instalará:
- `google-cloud-bigquery` - Cliente de BigQuery
- `pandas` - Procesamiento de datos
- `db-dtypes` - Tipos de datos de BigQuery

### 2. Configurar Credenciales de Google Cloud

#### Opción A: Descargar desde Google Cloud Console (Recomendado)

1. Ve a: https://console.cloud.google.com/iam-admin/serviceaccounts?project=my-project-wap-486916

2. Crea o selecciona una Service Account

3. Genera una clave JSON:
   - Click en ⋮ (menú) → "Manage keys"
   - "Add Key" → "Create new key" → JSON
   - Descarga el archivo

4. Guarda el archivo como:
   ```
   backend/credentials/gcp-key.json
   ```

#### Opción B: Usar gcloud CLI

```bash
gcloud auth application-default login
```

### 3. Verificar Configuración

```bash
cd backend
.venv/bin/python -m app.etl.bigquery_to_supabase --preview
```

Este comando:
- ✅ Verifica las credenciales
- ✅ Muestra el esquema de la tabla
- ✅ Muestra 20 registros de ejemplo
- ✅ Lista todas las columnas disponibles

## 🔍 Exploración de Datos

### Ver Esquema de la Tabla

```bash
.venv/bin/python -m app.etl.bigquery_to_supabase --preview
```

Esto mostrará:
- Nombres de todas las columnas
- Tipos de datos
- Total de filas en BigQuery

### Previsualizar Datos (Dry Run)

```bash
.venv/bin/python -m app.etl.bigquery_to_supabase
```

Modo dry-run (por defecto):
- ✅ Extrae datos de BigQuery
- ✅ Transforma según el mapeo
- ❌ NO inserta en Supabase
- ✅ Muestra estadísticas

## 🎯 Mapeo de Campos

**IMPORTANTE**: Antes de ejecutar la migración, debes ajustar el mapeo de campos en:
`backend/app/etl/bigquery_to_supabase.py`

### Función a Personalizar: `map_tinsa_to_supabase()`

```python
def map_tinsa_to_supabase(df: pd.DataFrame) -> list:
    # Ajusta estos campos según los nombres reales en BigQuery
    for _, row in df.iterrows():
        project = {
            "name": row.get("NOMBRE_CAMPO_REAL", "Sin nombre"),
            "developer": row.get("INMOBILIARIA_CAMPO_REAL", None),
            "commune": row.get("COMUNA_CAMPO_REAL", None),
            # ... más campos
        }
```

### Campos Disponibles en Supabase

Según tu esquema (`20260209000000_initial_schema.sql`):

**Campos Obligatorios:**
- `name` - Nombre del proyecto
- `commune` - Comuna
- `region` - Región

**Campos Opcionales:**
- `developer` - Inmobiliaria
- `address` - Dirección
- `latitude`, `longitude` - Coordenadas
- `total_units`, `sold_units`, `available_units` - Unidades
- `avg_price_uf`, `avg_price_m2_uf` - Precios
- `sales_speed_monthly` - Velocidad de ventas
- `months_to_sell_out` - MAO
- `project_status` - Estado
- `property_type` - Tipo de propiedad
- `category` - Categoría
- `delivery_date` - Fecha de entrega

## 🔄 Ejecutar Migración

### Paso 1: Previsualizar (Dry Run)

```bash
.venv/bin/python -m app.etl.bigquery_to_supabase
```

Revisa:
- ✅ Cantidad de registros
- ✅ Mapeo de campos
- ✅ Datos transformados

### Paso 2: Ejecutar Migración Real

```bash
.venv/bin/python -m app.etl.bigquery_to_supabase --migrate
```

Esto:
- ✅ Extrae TODOS los datos de BigQuery
- ✅ Transforma según el mapeo
- ✅ Inserta en Supabase en batches de 100
- ✅ Usa `upsert` para evitar duplicados (por `name` + `commune`)

## 📊 Monitoreo

Durante la migración verás:

```
🚀 Iniciando migración BigQuery → Supabase

📋 Esquema de la tabla BigQuery:
  - nombre_proyecto: STRING
  - comuna: STRING
  - precio_uf: FLOAT
  ...

✅ Total de filas: 1,234

🔄 Iniciando migración de 1,234 registros...
✅ Datos extraídos: 1,234 registros
✅ Datos transformados: 1,234 proyectos
  ✅ Insertados 100/1,234 proyectos...
  ✅ Insertados 200/1,234 proyectos...
  ...
🎉 Migración completada: 1,234 proyectos insertados
```

## ⚠️ Consideraciones

### Duplicados
- El script usa `upsert` con clave única: `(name, commune)`
- Si un proyecto ya existe, se actualizará
- Si es nuevo, se insertará

### Errores Comunes

1. **"GOOGLE_APPLICATION_CREDENTIALS no está configurado"**
   - Solución: Descarga y configura el archivo JSON de credenciales

2. **"Archivo de credenciales no encontrado"**
   - Solución: Verifica que `backend/credentials/gcp-key.json` existe

3. **"Permission denied"**
   - Solución: La Service Account necesita rol `BigQuery Data Viewer`

4. **"Column not found"**
   - Solución: Ajusta el mapeo en `map_tinsa_to_supabase()` con los nombres reales

## 🔧 Personalización Avanzada

### Cambiar Tamaño de Batch

En `bigquery_to_supabase.py`:

```python
BATCH_SIZE = 100  # Cambiar a 50, 200, etc.
```

### Filtrar Datos

Modifica la query en `migrate_data()`:

```python
query = f"""
SELECT * 
FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
WHERE comuna IN ('Las Condes', 'Providencia')
AND precio_uf > 5000
"""
```

### Transformaciones Personalizadas

En `map_tinsa_to_supabase()`:

```python
# Ejemplo: Normalizar nombres de comunas
commune = row.get("comuna", "").strip().title()

# Ejemplo: Calcular campos derivados
available = total - sold

# Ejemplo: Convertir fechas
delivery_date = pd.to_datetime(row.get("fecha_entrega")).date()
```

## 📝 Siguiente Paso

Una vez completada la migración, verifica los datos:

```bash
# En Supabase SQL Editor
SELECT COUNT(*) FROM projects;
SELECT * FROM projects LIMIT 10;
```

O visita el dashboard:
- http://localhost:3000/dashboard/projects
- http://localhost:3000/dashboard/map

## 🆘 Soporte

Si encuentras problemas:
1. Ejecuta con `--preview` para ver los datos sin migrar
2. Revisa los nombres de columnas en BigQuery
3. Ajusta el mapeo en `map_tinsa_to_supabase()`
4. Ejecuta en dry-run antes de la migración real
