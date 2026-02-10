# Plan de Implementación: Motor de Reportes Inmobiliarios con IA

Este documento define la estrategia para construir el "Core" del proyecto: un sistema generador de reportes que combina datos de mercado en tiempo real con análisis estratégico de IA.

## 1. Visión del Producto

El objetivo es pasar de un "Dashboard de Datos" a un "Consultor Automatizado". El usuario no quiere solo ver gráficos; quiere entender **qué significan** para su negocio.

### Tipos de Reportes Iniciales
1.  **Reporte de Mercado Comunal (Market Snapshot)**:
    *   *Objetivo:* Entender el desempeño de una ubicación (ej: "Ñuñoa").
    *   *Contenido:* Precios promedio, stock disponible, absorción (ventas/mes), tipologías más vendidas, mapa de calor.
    *   *Componente IA:* Análisis de tendencias, identificación de zonas saturadas vs. oportunidades.
2.  **Reporte de Evaluación de Proyecto (Benchmark)**:
    *   *Objetivo:* Analizar un proyecto específico frente a su competencia directa.
    *   *Contenido:* Comparativa de precios (UF/m²), velocidad de venta relativa, ranking en la comuna.
    *   *Componente IA:* FODA automático (Fortalezas, Oportunidades, Debilidades, Amenazas) basado en datos y normativas (RAG).

## 2. Arquitectura Técnica

### A. Base de Datos (Supabase)
Necesitamos funciones SQL avanzadas (`RPC`) para generar las matrices sin traer millones de filas al backend.

**Nueva Función SQL Requerida: `get_market_matrix`**
Parámetros:
- `commune`: 'Santiago'
- `segment_by`: 'price_uf' | 'surface_m2'
- `ranges`: Array de rangos `[0, 2000, 3000, 4000, 7000, 99999]`
- `period`: 'quarterly' | 'semiannual'

Retorno esperado (JSON):
```json
{
  "periods": ["1P 2023", "2P 2023"],
  "segments": ["0-2000", "2001-3000", ...],
  "matrix_offer": [[50, 20...], [55, 18...]], // Filas: Periodos, Cols: Segmentos
  "matrix_sales": [[5, 2...], [8, 1...]],
  "indicators": {
    "mao": [18.5, 16.2...], // Meses para agotar oferta
    "abs_rate": [0.05, 0.08...] // Tasa de absorción
  }
}
```

**Nuevo Tipo de Reporte: Benchmark de Proyectos (Tabla Detallada)**
Igual que la referencia visual, necesitamos una tabla comparativa con:
- `Proyecto`, `Inmobiliaria`, `Comuna`
- `Stock Total`, `Stock Disponible`, `% Avance Venta`
- `Velocidad Venta Mensual`, `Meses para Agotar Stock (MAO)`
- `Precio Promedio`, `Sup. Promedio`, `UF/m2`
- `Estado` (En Verde, Entrega Inmediata, etc.)

**Análisis por Tipología/Superficie (Gráficos Torta)**
- Distribución de Stock por Rango de Superficie (como proxy de Tipología 1D/2D/3D).
- Distribución de Ventas por Rango de Precio.

### B. Backend (Python/FastAPI)
El Agente IA (`brain/agent.py`) evolucionará para tener un modo "Reportero Avanzado".

*   **Motor de Cálculo (Pandas)**:
    - Procesar los datos crudos para replicar la lógica del Excel:
    - Cálculo de Stock Inicial, Entradas, Salidas (Ventas) y Stock Final por periodo.
    - Cálculo de MAO (Oferta / Venta Promedio Móvil).
    - Cálculo de % Absorción (Venta / Oferta Disponible).
    - Segmentación dinámica de proyectos por m2 para inferir tipologías (ej: <40m2 = 1D).

*   **Generador de Narrativa IA**:
    - El prompt del sistema recibirá estas matrices numéricas.
    - Instrucción: "Analiza la matriz de ventas del segmento 3000-4000 UF. ¿Hay tendencia al alza? ¿Se correlaciona con la baja en el segmento 2000-3000?".
    - La IA debe detectar "Cuellos de Botella" (mucho stock, poca venta) y "Oportunidades" (poca oferta, alta velocidad).

### C. Frontend (Next.js) - "El Excel Vivo"
*   **Visualización de Matrices**:
    - Tabla interactiva con Heatmap (colores según intensidad, igual que el Excel).
    - Gráficos de barras apiladas (`recharts`) sincronizados con la tabla.
*   **Editor de Tramos**:
    - Slider o inputs para que el usuario defina sus propios rangos de precio (igual que las columnas del Excel).
*   **Benchmark Interactivo**:
    - Tabla de proyectos con ordenamiento y filtros (similar al Excel de referencia).

## 3. Hoja de Ruta (Roadmap) - Fase 2 Ajustada

### Fase 1: Motor de Datos (Backend + SQL)
- [ ] Crear migración SQL para tabla `generated_reports`.
- [ ] Crear función RPC `get_market_matrix` y `get_project_benchmark`.
- [ ] Implementar lógica en Python (`pandas`) para segmentar dinámicamente.

### Fase 2: Interfaz de Generación
- [ ] Vista de configuración: "Selecciona Comuna", "Define Rangos de Precio", "Selecciona Periodos".
- [ ] Previsualización de tablas tipo Excel (Heatmaps).
- [ ] Tabla de Benchmark de Proyectos.

### Fase 3: Capa de Inteligencia
- [ ] Prompt engineering para que la IA interprete la "Matriz de Mercado" y el benchmark.
- [ ] Generación de texto: "El segmento 4000-5000 UF muestra agotamiento..."

### Fase 1: Estructura y Datos (Backend)
- [ ] Crear tabla `generated_reports`.
- [ ] Implementar endpoint basico `/reports/data/commune` que devuelva solo los kpis y series de tiempo (sin IA).
- [ ] Validar que los datos de Tinsa sean suficientes para los gráficos propuestos.

### Fase 2: Inteligencia (Agente)
- [ ] Crear Skill "Analista de Reportes" en el Agente.
- [ ] Prompt Engineering: Diseñar prompts específicos para leer tablas de datos y escribir párrafos de análisis de mercado ("Data-to-Text").
- [ ] Integrar RAG: Que el reporte cite documentos subidos si son relevantes para la comuna.

### Fase 3: Visualización (Frontend)
- [ ] Crear página `/dashboard/reports/new`.
- [ ] Diseñar layout de reporte (Portada, Grillas, Texto).
- [ ] Integrar gráficos de `recharts` con los datos del backend.

### Fase 4: Exportación y Guardado
- [ ] Botón "Guardar Reporte".
- [ ] Botón "Descargar PDF".

## 4. Estructura del JSON de Respuesta (Ejemplo)

```json
{
  "title": "Reporte de Mercado: Comuna de La Florida",
  "generated_at": "2024-02-10",
  "sections": [
    {
      "type": "summary",
      "title": "Resumen Ejecutivo",
      "content": "La Florida muestra una desaceleración en ventas del 5% respecto al mes anterior, aunque el precio UF/m2 se mantiene estable... (Generado por IA)"
    },
    {
      "type": "chart",
      "title": "Evolución de Ventas vs Stock",
      "data": { ... },
      "chart_type": "line_composed"
    },
    {
      "type": "analysis",
      "title": "Análisis de Competencia",
      "content": "Se identifican 3 nuevos proyectos en el eje Vicuña Mackenna que presionan el stock..."
    }
  ]
}
```
