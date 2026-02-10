#!/bin/bash

# Script para ejecutar geocoding en múltiples batches
# Uso: ./geocode_all.sh [total_proyectos]

BATCH_SIZE=200
TOTAL=${1:-1000}  # Default: 1000 proyectos

echo "🗺️  Geocoding Masivo"
echo "===================="
echo "Total a procesar: $TOTAL proyectos"
echo "Tamaño de batch: $BATCH_SIZE"
echo ""

# Calculate number of batches
BATCHES=$(( ($TOTAL + $BATCH_SIZE - 1) / $BATCH_SIZE ))

echo "Ejecutando $BATCHES batches..."
echo ""

for i in $(seq 1 $BATCHES); do
    echo "📦 Batch $i/$BATCHES"
    echo "-------------------"
    
    .venv/bin/python -m app.etl.geocode_projects --limit $BATCH_SIZE
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo "❌ Error en batch $i"
        exit 1
    fi
    
    echo ""
    echo "✅ Batch $i completado"
    echo ""
    
    # Small delay between batches
    if [ $i -lt $BATCHES ]; then
        echo "⏳ Esperando 5 segundos antes del siguiente batch..."
        sleep 5
    fi
done

echo ""
echo "🎉 Geocoding masivo completado!"
echo ""

# Show final stats
echo "📊 Verificando resultados..."
.venv/bin/python -c "
from app.db import get_supabase_client

supabase = get_supabase_client()

total = supabase.table('projects').select('id', count='exact').execute()
with_coords = supabase.table('projects').select('id').not_('latitude', 'is', None).not_('longitude', 'is', None).execute()

print(f'✅ Total proyectos: {total.count:,}')
print(f'✅ Con coordenadas: {len(with_coords.data):,} ({len(with_coords.data)/total.count*100:.1f}%)')
print(f'⚠️  Sin coordenadas: {total.count - len(with_coords.data):,}')
"
