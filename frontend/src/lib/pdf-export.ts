import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports using html2canvas & jsPDF
 * Improved version with better stability for long reports and charts
 */
export async function exportReportToPDF(elementId: string, title: string) {
    if (typeof window === 'undefined') return;

    // 1. Scroll to top to ensure correct capture offsets
    window.scrollTo(0, 0);

    const reportElement = document.getElementById(elementId)
    if (!reportElement) {
        console.error('Report element not found:', elementId)
        return
    }

    try {
        // 2. Short delay for any animations to finish
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Capture canvas
        const canvas = await html2canvas(reportElement, {
            scale: 1.5, // Balanced quality/performance
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            // Use static width to avoid layout shifts during capture
            windowWidth: 1200,
            onclone: (clonedDoc) => {
                // Remove buttons or elements we don't want in the PDF
                const hiddenElements = clonedDoc.querySelectorAll('.print\\:hidden');
                hiddenElements.forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                });

                // Ensure all tremor charts are visible
                const charts = clonedDoc.querySelectorAll('.tremor-base');
                charts.forEach(chart => {
                    (chart as HTMLElement).style.opacity = '1';
                });
            }
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.9)
        const pdf = new jsPDF('p', 'mm', 'a4')

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width

        const pageHeight = pdf.internal.pageSize.getHeight()
        let heightLeft = pdfHeight
        let position = 0

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST')
        heightLeft -= pageHeight

        // Add subsequent pages if the content is longer than one A4
        while (heightLeft > 0) {
            position = heightLeft - pdfHeight
            // We need to move the "view window" of the image
            pdf.addPage()
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST')
            heightLeft -= pageHeight
        }

        const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const fileName = `nlace-reporte-${cleanTitle}-${new Date().toISOString().split('T')[0]}.pdf`

        pdf.save(fileName)
    } catch (error) {
        console.error('Error generating PDF:', error)
        // Re-throw to be handled by the UI (e.g. show a toast)
        throw error
    }
}
