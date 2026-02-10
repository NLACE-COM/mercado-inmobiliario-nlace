# Instrucciones para configurar credenciales de Google Cloud

Para conectar con BigQuery, necesitas descargar las credenciales de tu proyecto de Google Cloud.

## Pasos:

1. **Ir a Google Cloud Console**
   - https://console.cloud.google.com/

2. **Navegar a IAM & Admin > Service Accounts**
   - https://console.cloud.google.com/iam-admin/serviceaccounts?project=my-project-wap-486916

3. **Crear o seleccionar una Service Account**
   - Si no existe, crear una nueva con rol "BigQuery Data Viewer" o "BigQuery Admin"

4. **Generar clave JSON**
   - Click en los 3 puntos (⋮) → "Manage keys"
   - "Add Key" → "Create new key" → JSON
   - Descargar el archivo JSON

5. **Guardar el archivo**
   - Renombrar a: `gcp-key.json`
   - Mover a: `backend/credentials/gcp-key.json`

6. **Verificar configuración**
   ```bash
   cd backend
   .venv/bin/python -m app.etl.bigquery_to_supabase --preview
   ```

## Permisos necesarios:

La Service Account debe tener al menos:
- `roles/bigquery.dataViewer` - Para leer datos
- `roles/bigquery.jobUser` - Para ejecutar queries

## Seguridad:

⚠️ **IMPORTANTE**: El archivo `gcp-key.json` contiene credenciales sensibles.
- Ya está en `.gitignore`
- NO lo subas a GitHub
- NO lo compartas públicamente
