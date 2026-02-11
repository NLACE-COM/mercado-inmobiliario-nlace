import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports using html2canvas & jsPDF
 */
export async function exportReportToPDF(elementId: string, title: string) {
    const reportElement = document.getElementById(elementId)
    if (!reportElement) {
        console.error('Report element not found:', elementId)
        return
    }

    try {
        // Toggle some styles for PDF capture if needed
        reportElement.classList.add('pdf-capture')

        const canvas = await html2canvas(reportElement, {
            scale: 2, // Higher quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 1200 // Ensure consistent layout
        })

        reportElement.classList.remove('pdf-capture')

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')

        const pdfWidth = 210 // A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        const pageHeight = 297 // A4 height in mm
        let heightLeft = pdfHeight
        let position = 0

        // Page 1
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pageHeight

        // Other pages if needed
        while (heightLeft > 0) {
            position = heightLeft - pdfHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
            heightLeft -= pageHeight
        }

        const fileName = `Reporte-${title.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(fileName)
    } catch (error) {
        console.error('Error generating PDF:', error)
        throw error
    }
}
