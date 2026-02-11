#!/bin/bash

# Script de verificación de implementación
# Verifica que todos los archivos críticos existen y están correctos

echo "🔍 Verificando implementación de las 3 prioridades críticas..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
PASSED=0
FAILED=0

# Función de verificación
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $2 - FALTA: $1"
        ((FAILED++))
    fi
}

echo "📋 FASE 1: Seguridad - Auth en API Routes"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "frontend/src/lib/api-auth.ts" "Helper de autenticación"
check_file "frontend/src/app/api/brain/chat/route.ts" "Chat endpoint con auth"
check_file "frontend/src/app/api/brain/reports/generate/route.ts" "Generate reports con auth"
check_file "frontend/src/app/api/brain/reports/route.ts" "List reports con auth"
check_file "frontend/src/app/api/brain/reports/[id]/route.ts" "Get report con auth"
check_file "frontend/src/app/api/brain/reports/communes/route.ts" "Communes con auth"
check_file "frontend/src/app/api/brain/admin/knowledge/route.ts" "Knowledge admin auth"
check_file "frontend/src/app/api/brain/admin/prompts/route.ts" "Prompts admin auth"

echo ""
echo "📋 FASE 2: RAG + 3 Tools Perdidas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "frontend/src/lib/vector-store.ts" "Vector store con embeddings"
check_file "frontend/src/lib/brain-agent.ts" "Brain agent con RAG + 5 tools"

# Verificar que vector-store tiene embeddings
if grep -q "text-embedding-3-small" frontend/src/lib/vector-store.ts; then
    echo -e "${GREEN}✓${NC} Vector store usa embeddings reales"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Vector store NO tiene embeddings reales"
    ((FAILED++))
fi

# Verificar que brain-agent tiene las 3 tools nuevas
if grep -q "compare_regions" frontend/src/lib/brain-agent.ts; then
    echo -e "${GREEN}✓${NC} Tool compare_regions implementada"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Tool compare_regions FALTA"
    ((FAILED++))
fi

if grep -q "get_top_sales" frontend/src/lib/brain-agent.ts; then
    echo -e "${GREEN}✓${NC} Tool get_top_sales implementada"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Tool get_top_sales FALTA"
    ((FAILED++))
fi

if grep -q "get_market_summary" frontend/src/lib/brain-agent.ts; then
    echo -e "${GREEN}✓${NC} Tool get_market_summary implementada"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Tool get_market_summary FALTA"
    ((FAILED++))
fi

# Verificar que RAG está integrado
if grep -q "searchKnowledge" frontend/src/lib/brain-agent.ts; then
    echo -e "${GREEN}✓${NC} RAG integrado en brain-agent"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} RAG NO integrado"
    ((FAILED++))
fi

echo ""
echo "📋 FASE 3: Datos - Tipologías y Métricas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "frontend/src/app/api/admin/backfill-typologies/route.ts" "Backfill tipologías"
check_file "frontend/src/app/api/admin/backfill-metrics/route.ts" "Backfill métricas"
check_file "frontend/src/app/api/admin/import-tinsa/route.ts" "Import TINSA CSV"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Pasadas:${NC} $PASSED"
echo -e "${RED}✗ Fallidas:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡Todas las verificaciones pasaron!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Ejecutar: npm run dev"
    echo "2. Loguearte como admin"
    echo "3. Ejecutar backfills desde Postman:"
    echo "   POST http://localhost:3000/api/admin/backfill-typologies"
    echo "   POST http://localhost:3000/api/admin/backfill-metrics"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Algunas verificaciones fallaron${NC}"
    echo "Revisa los archivos faltantes arriba"
    echo ""
    exit 1
fi
