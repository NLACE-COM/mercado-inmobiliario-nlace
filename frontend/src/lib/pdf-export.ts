import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export async function exportReportToPDF(elementId: string, title: string) {
    if (typeof window === 'undefined') return;

    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
        alert('No se encontró el contenido del reporte.');
        return;
    }

    // Checking if the element is visible
    if (reportElement.clientHeight === 0 || reportElement.clientWidth === 0) {
        alert('El reporte no es visible para ser capturado.');
        return;
    }

    const originalScrollPos = window.scrollY;

    try {
        console.log(`[PDF Export] Starting capture for #${elementId}`);
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(reportElement, {
            scale: 1.5, // Reduced scale for stability
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: true, // Enable logging to see issues
            onclone: (clonedDoc) => {
                const clones = clonedDoc.querySelectorAll('*');
                // Simple color sanitization
                clones.forEach((node: any) => {
                    if (node.style) {
                        try {
                            const computed = window.getComputedStyle(node);
                            if (computed.color && (computed.color.includes('oklch') || computed.color.includes('lab'))) {
                                node.style.color = '#333333';
                            }
                        } catch (e) { }
                    }
                });
            }
        });

        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas capture failed (empty canvas).');
        }

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Force download
        const dateStr = new Date().toISOString().split('T')[0];
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `nlace_${safeTitle}_${dateStr}.pdf`;

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(pdfUrl);
        }, 100);

        console.log('[PDF Export] Download triggered');
        window.scrollTo(0, originalScrollPos);

    } catch (error: any) {
        console.error('[PDF Export] Failed, falling back to print:', error);
        window.scrollTo(0, originalScrollPos);

        // Notify user and fallback to print
        if (confirm('La generación automática de PDF falló debido a la complejidad del diseño. ¿Desea usar la opción de "Imprimir como PDF" del navegador? (Recomendado)')) {
            printFallback(elementId);
        }
    }
}

function printFallback(elementId: string) {
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #${elementId}, #${elementId} * { visibility: visible; }
            #${elementId} { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; background: white; }
            .no-print { display: none !important; }
        }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 2000);
}
