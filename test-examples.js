// 🧪 EJEMPLOS DE TESTING - Copiar y pegar en consola del navegador
// Asegúrate de estar logueado antes de ejecutar estos comandos

// ============================================
// 1. VERIFICAR AUTENTICACIÓN
// ============================================

console.log('🔐 Verificando autenticación...')

// Test: Chat endpoint (requiere auth)
fetch('/api/brain/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        question: "Hola, ¿estás funcionando?",
        conversation_history: []
    })
})
    .then(r => r.json())
    .then(data => {
        if (data.error) {
            console.error('❌ Auth falló:', data.error)
        } else {
            console.log('✅ Auth funcionando:', data.answer)
        }
    })

// ============================================
// 2. PROBAR RAG (Agregar documento + buscar)
// ============================================

console.log('🧠 Probando RAG...')

// Paso 1: Agregar documento al knowledge base (solo admin)
fetch('/api/brain/admin/knowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        content: `El mercado inmobiliario de Santiago ha experimentado un crecimiento sostenido durante 2025. 
    Las comunas del sector oriente (Las Condes, Vitacura, Lo Barnechea) lideran en precios promedio, 
    superando las 4.500 UF por unidad. El sector de Ñuñoa y Providencia muestra alta demanda con 
    precios entre 3.000 y 3.800 UF. La velocidad de venta promedio es de 2.5 unidades/mes, 
    indicando un mercado saludable.`,
        metadata: {
            topic: "Análisis Mercado Santiago 2025",
            source: "Informe Trimestral Q1",
            date: "2025-03-15",
            author: "Equipo Análisis NLACE"
        }
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Documento agregado:', data)

        // Paso 2: Hacer pregunta que debería usar RAG
        setTimeout(() => {
            console.log('🔍 Haciendo pregunta con RAG...')

            fetch('/api/brain/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    question: "¿Cómo está el mercado inmobiliario en Santiago?",
                    conversation_history: []
                })
            })
                .then(r => r.json())
                .then(data => {
                    console.log('✅ Respuesta con RAG:', data.answer)
                    console.log('📚 Sources:', data.sources)
                })
        }, 2000) // Esperar 2 segundos para que se genere el embedding
    })

// ============================================
// 3. PROBAR LAS 3 TOOLS NUEVAS
// ============================================

console.log('🛠️ Probando tools nuevas...')

// Tool 1: Compare Regions
fetch('/api/brain/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
        question: "Compara el mercado inmobiliario entre Santiago, Ñuñoa y Las Condes",
        conversation_history: []
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Compare Regions:', data.answer)
    })

// Tool 2: Get Top Sales
setTimeout(() => {
    fetch('/api/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            question: "¿Cuáles son los 10 proyectos que más rápido se están vendiendo?",
            conversation_history: []
        })
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Top Sales:', data.answer)
        })
}, 3000)

// Tool 3: Get Market Summary
setTimeout(() => {
    fetch('/api/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            question: "Dame un resumen ejecutivo completo del mercado inmobiliario",
            conversation_history: []
        })
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Market Summary:', data.answer)
        })
}, 6000)

// ============================================
// 4. EJECUTAR BACKFILLS (Solo Admin)
// ============================================

console.log('📊 Ejecutando backfills (solo admin)...')

// Backfill Tipologías
fetch('/api/admin/backfill-typologies', {
    method: 'POST',
    credentials: 'include'
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ Backfill Tipologías:', data)
    })
    .catch(err => {
        console.error('❌ Error en backfill tipologías:', err)
    })

// Backfill Métricas
setTimeout(() => {
    fetch('/api/admin/backfill-metrics', {
        method: 'POST',
        credentials: 'include'
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Backfill Métricas:', data)
        })
        .catch(err => {
            console.error('❌ Error en backfill métricas:', err)
        })
}, 2000)

// ============================================
// 5. VERIFICAR STATUS DE MÉTRICAS
// ============================================

setTimeout(() => {
    console.log('📈 Verificando status de métricas...')

    fetch('/api/admin/backfill-metrics', {
        method: 'GET',
        credentials: 'include'
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Status Métricas:', data)
            console.log(`   - Total records: ${data.total_records}`)
            console.log(`   - Latest snapshot: ${data.latest_snapshot}`)
            console.log(`   - Oldest snapshot: ${data.oldest_snapshot}`)
        })
}, 5000)

// ============================================
// 6. LISTAR MIS REPORTES
// ============================================

setTimeout(() => {
    console.log('📋 Listando mis reportes...')

    fetch('/api/brain/reports', {
        method: 'GET',
        credentials: 'include'
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Mis Reportes:', data)
            console.log(`   - Total: ${data.length} reportes`)
        })
}, 7000)

// ============================================
// 7. GENERAR REPORTE DE PRUEBA
// ============================================

setTimeout(() => {
    console.log('📝 Generando reporte de prueba...')

    fetch('/api/brain/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            title: "Reporte de Prueba - Santiago",
            report_type: "commune_analysis",
            parameters: {
                commune: "Santiago"
            }
        })
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Reporte Generado:', data)
            console.log(`   - ID: ${data.id}`)
            console.log(`   - Status: ${data.status}`)
        })
}, 9000)

// ============================================
// 8. VERIFICAR KNOWLEDGE BASE
// ============================================

setTimeout(() => {
    console.log('📚 Verificando knowledge base (solo admin)...')

    fetch('/api/brain/admin/knowledge', {
        method: 'GET',
        credentials: 'include'
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Knowledge Base:', data)
            console.log(`   - Total documentos: ${data.length}`)

            // Mostrar cuántos tienen embeddings
            const withEmbeddings = data.filter(d => d.embedding !== null).length
            console.log(`   - Con embeddings: ${withEmbeddings}/${data.length}`)
        })
}, 11000)

// ============================================
// 9. TEST COMPLETO DE CONVERSACIÓN
// ============================================

setTimeout(() => {
    console.log('💬 Test de conversación completa...')

    const conversation = []

    // Primera pregunta
    fetch('/api/brain/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            question: "¿Cuál es el precio promedio en Santiago?",
            conversation_history: conversation
        })
    })
        .then(r => r.json())
        .then(data => {
            console.log('✅ Respuesta 1:', data.answer)

            // Agregar a historial
            conversation.push({ role: 'user', content: "¿Cuál es el precio promedio en Santiago?" })
            conversation.push({ role: 'assistant', content: data.answer })

            // Segunda pregunta (con contexto)
            setTimeout(() => {
                fetch('/api/brain/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        question: "¿Y cómo se compara con Ñuñoa?",
                        conversation_history: conversation
                    })
                })
                    .then(r => r.json())
                    .then(data => {
                        console.log('✅ Respuesta 2 (con contexto):', data.answer)
                    })
            }, 2000)
        })
}, 13000)

// ============================================
// RESUMEN FINAL
// ============================================

setTimeout(() => {
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 TESTS COMPLETADOS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\nRevisa los resultados arriba para verificar que:')
    console.log('✅ Autenticación funciona')
    console.log('✅ RAG encuentra documentos relevantes')
    console.log('✅ Las 3 tools nuevas responden')
    console.log('✅ Backfills se ejecutaron correctamente')
    console.log('✅ Reportes se filtran por usuario')
    console.log('✅ Conversaciones mantienen contexto')
    console.log('\n')
}, 20000)
