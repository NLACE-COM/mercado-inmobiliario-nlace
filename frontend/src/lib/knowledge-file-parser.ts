import { Buffer } from 'node:buffer'

const TEXT_EXTENSIONS = new Set(['txt', 'md', 'json', 'csv', 'tsv'])
const EXTRACTABLE_EXTENSIONS = new Set([
    'txt',
    'md',
    'json',
    'csv',
    'tsv',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
])

export class FileParserError extends Error {
    status: number

    constructor(message: string, status = 400) {
        super(message)
        this.name = 'FileParserError'
        this.status = status
    }
}

export function getFileExtension(fileName: string): string {
    const parts = fileName.toLowerCase().split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
}

export function isSupportedKnowledgeExtension(extension: string): boolean {
    return EXTRACTABLE_EXTENSIONS.has(extension)
}

function decodeHtmlEntities(value: string): string {
    return value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
}

function extractLegacyText(buffer: Buffer): string {
    const ascii = buffer.toString('latin1')
    const matches = ascii.match(/[A-Za-zÀ-ÿ0-9][\x20-\x7EÀ-ÿ]{5,}/g) ?? []
    return matches
        .map((segment) => segment.replace(/\s+/g, ' ').trim())
        .filter((segment) => segment.length > 20)
        .slice(0, 5000)
        .join('\n')
}

async function extractPdfText(buffer: Buffer): Promise<string> {
    const pdfParseModule = await import('pdf-parse')
    const PDFParse = (pdfParseModule as any).PDFParse ?? (pdfParseModule as any).default?.PDFParse
    if (!PDFParse) {
        throw new FileParserError('No se pudo inicializar el parser de PDF.')
    }

    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    try {
        const result = await parser.getText()
        return result.text || ''
    } finally {
        await parser.destroy()
    }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
    const mammothModule = await import('mammoth')
    const mammoth = (mammothModule as any).default ?? mammothModule
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
}

async function extractSpreadsheetText(buffer: Buffer): Promise<string> {
    const xlsxModule = await import('xlsx')
    const XLSX = (xlsxModule as any).default ?? xlsxModule
    const workbook = XLSX.read(buffer, { type: 'buffer' }) as {
        SheetNames: string[]
        Sheets: Record<string, any>
    }

    const parts = workbook.SheetNames.map((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName]
        const csv = XLSX.utils.sheet_to_csv(sheet)
        return `## Hoja: ${sheetName}\n${csv}`.trim()
    })
    return parts.join('\n\n').trim()
}

async function extractPptxText(buffer: Buffer): Promise<string> {
    const jszipModule = await import('jszip')
    const JSZip = (jszipModule as any).default ?? jszipModule
    const zip = await JSZip.loadAsync(buffer)
    const slidePaths = Object.keys(zip.files)
        .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
        .sort((a, b) => {
            const aNum = Number(a.match(/\d+/)?.[0] || 0)
            const bNum = Number(b.match(/\d+/)?.[0] || 0)
            return aNum - bNum
        })

    const slides: string[] = []
    for (const path of slidePaths) {
        const xml = await zip.file(path)?.async('string')
        if (!xml) continue

        const fragments = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g))
            .map((match) => decodeHtmlEntities(match[1] || '').trim())
            .filter(Boolean)

        if (fragments.length > 0) {
            slides.push(fragments.join('\n'))
        }
    }

    return slides.join('\n\n').trim()
}

export async function extractTextFromKnowledgeFile(file: File): Promise<{ content: string; fileType: string }> {
    const extension = getFileExtension(file.name)
    if (!isSupportedKnowledgeExtension(extension)) {
        throw new FileParserError('Formato no soportado. Usa TXT, CSV, PDF, DOCX, XLSX o PPTX.')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (TEXT_EXTENSIONS.has(extension)) {
        return {
            content: buffer.toString('utf-8'),
            fileType: extension,
        }
    }

    if (extension === 'pdf') {
        return {
            content: await extractPdfText(buffer),
            fileType: 'pdf',
        }
    }

    if (extension === 'docx') {
        return {
            content: await extractDocxText(buffer),
            fileType: 'docx',
        }
    }

    if (extension === 'xls' || extension === 'xlsx') {
        return {
            content: await extractSpreadsheetText(buffer),
            fileType: 'excel',
        }
    }

    if (extension === 'pptx') {
        return {
            content: await extractPptxText(buffer),
            fileType: 'pptx',
        }
    }

    if (extension === 'doc' || extension === 'ppt') {
        const content = extractLegacyText(buffer)
        if (!content.trim()) {
            throw new FileParserError(`No se pudo extraer texto de .${extension}. Convierte el archivo a .docx o .pptx.`)
        }
        return {
            content,
            fileType: extension,
        }
    }

    throw new FileParserError('Formato no soportado.')
}
