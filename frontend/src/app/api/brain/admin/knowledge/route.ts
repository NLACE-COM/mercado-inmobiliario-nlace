import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { ingestText } from '@/lib/vector-store'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_CHARS_PER_CHUNK = 6000
const SUPPORTED_TEXT_EXTENSIONS = ['txt', 'md', 'json', 'csv', 'tsv']
const UNSUPPORTED_BINARY_EXTENSIONS = ['doc', 'docx', 'xls', 'xlsx', 'pdf']

class AppError extends Error {
    status: number

    constructor(message: string, status = 500) {
        super(message)
        this.name = 'AppError'
        this.status = status
    }
}

function getExtension(fileName: string): string {
    const parts = fileName.toLowerCase().split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
}

function chunkText(content: string, maxChars = MAX_CHARS_PER_CHUNK): string[] {
    const normalized = content.replace(/\r\n/g, '\n').trim()
    if (!normalized) return []
    if (normalized.length <= maxChars) return [normalized]

    const chunks: string[] = []
    let cursor = 0

    while (cursor < normalized.length) {
        let end = Math.min(cursor + maxChars, normalized.length)

        // Try to split on a paragraph boundary first.
        if (end < normalized.length) {
            const paragraphBreak = normalized.lastIndexOf('\n\n', end)
            if (paragraphBreak > cursor + 1500) {
                end = paragraphBreak
            }
        }

        const chunk = normalized.slice(cursor, end).trim()
        if (chunk) chunks.push(chunk)
        cursor = end
    }

    return chunks
}

function parseMetadata(rawMetadata: FormDataEntryValue | null): Record<string, any> {
    if (!rawMetadata || typeof rawMetadata !== 'string') return {}

    try {
        return JSON.parse(rawMetadata)
    } catch {
        throw new AppError('Metadata inválida: debe ser JSON válido.', 400)
    }
}

function normalizeUploadError(error: unknown): AppError {
    if (error instanceof AppError) return error

    const message = error instanceof Error ? error.message : 'Error interno al procesar el archivo.'

    if (message.toLowerCase().includes('context length')) {
        return new AppError('El contenido es demasiado largo para procesar. Reduce el tamaño del archivo.', 400)
    }

    if (message.toLowerCase().includes('invalid api key')) {
        return new AppError('Configuración de OpenAI inválida en el servidor.', 503)
    }

    return new AppError(message, 500)
}

/**
 * GET /api/brain/admin/knowledge
 * Fetch all knowledge base items (admin only)
 */
export async function GET(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        console.log('[Knowledge GET] Starting...')
        const supabase = getSupabaseAdmin()
        console.log('[Knowledge GET] Supabase client created')

        const { data: items, error } = await supabase
            .from('knowledge_docs')
            .select('id, content, metadata, created_at')
            .limit(100)

        console.log('[Knowledge GET] Query result:', {
            itemsCount: items?.length,
            hasError: !!error,
            errorMessage: error?.message
        })

        if (error) {
            console.error('[Knowledge GET] Error fetching knowledge:', error)
            return NextResponse.json([])
        }

        console.log('[Knowledge GET] Returning items:', items?.length)
        return NextResponse.json(items || [])
    } catch (error: any) {
        console.error('[Knowledge GET] Exception:', error.message)
        return NextResponse.json([])
    }
}

/**
 * POST /api/brain/admin/knowledge
 * Add a new knowledge item (text or file) - admin only
 */
export async function POST(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const contentType = request.headers.get('content-type') || ''

        // Handle multipart/form-data (file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const file = formData.get('file') as File
            const metadata = parseMetadata(formData.get('metadata'))

            if (!file) {
                return NextResponse.json(
                    { error: 'No file provided' },
                    { status: 400 }
                )
            }

            if (file.size === 0) {
                return NextResponse.json(
                    { error: 'El archivo está vacío.' },
                    { status: 400 }
                )
            }

            if (file.size > MAX_FILE_SIZE_BYTES) {
                return NextResponse.json(
                    { error: 'El archivo excede el máximo permitido de 5MB.' },
                    { status: 400 }
                )
            }

            const extension = getExtension(file.name)
            if (UNSUPPORTED_BINARY_EXTENSIONS.includes(extension)) {
                return NextResponse.json(
                    { error: 'Formato no soportado en este entorno. Convierte el archivo a .txt o .csv para subirlo.' },
                    { status: 400 }
                )
            }

            if (!SUPPORTED_TEXT_EXTENSIONS.includes(extension)) {
                return NextResponse.json(
                    { error: 'Formato no soportado. Usa .txt, .md, .json, .csv o .tsv.' },
                    { status: 400 }
                )
            }

            // Read file content (text formats only)
            const content = await file.text()

            if (!content.trim()) {
                return NextResponse.json(
                    { error: 'No se pudo extraer contenido del archivo.' },
                    { status: 400 }
                )
            }

            const chunks = chunkText(content)
            if (chunks.length === 0) {
                return NextResponse.json(
                    { error: 'No se detectó texto útil en el archivo.' },
                    { status: 400 }
                )
            }

            // Add filename to metadata
            metadata.filename = file.name
            metadata.type = file.type
            metadata.size = file.size
            metadata.chunk_total = chunks.length

            // Ingest chunks into vector store
            for (let index = 0; index < chunks.length; index++) {
                await ingestText(chunks[index], {
                    ...metadata,
                    chunk_index: index + 1,
                })
            }

            return NextResponse.json({
                success: true,
                message: 'File uploaded successfully',
                chunks: chunks.length
            })
        }

        // Handle JSON (text content)
        const body = await request.json()
        const { content, metadata = {} } = body

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            )
        }

        const chunks = chunkText(content)
        if (chunks.length === 0) {
            return NextResponse.json(
                { error: 'No se detectó texto útil para indexar.' },
                { status: 400 }
            )
        }

        for (let index = 0; index < chunks.length; index++) {
            await ingestText(chunks[index], {
                ...metadata,
                chunk_index: index + 1,
                chunk_total: chunks.length,
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Knowledge item added successfully',
            chunks: chunks.length
        })
    } catch (error: any) {
        const normalized = normalizeUploadError(error)
        console.error('Error in POST /api/brain/admin/knowledge:', normalized)
        return NextResponse.json(
            { error: normalized.message || 'Failed to add knowledge item' },
            { status: normalized.status || 500 }
        )
    }
}

/**
 * DELETE /api/brain/admin/knowledge
 * Delete a knowledge item (admin only)
 */
export async function DELETE(request: NextRequest) {
    // Require admin authentication
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('knowledge_docs')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting knowledge:', error)
            return NextResponse.json(
                { error: 'Failed to delete knowledge item' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Knowledge item deleted successfully'
        })
    } catch (error: any) {
        console.error('Error in DELETE /api/brain/admin/knowledge:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to delete knowledge item' },
            { status: 500 }
        )
    }
}
