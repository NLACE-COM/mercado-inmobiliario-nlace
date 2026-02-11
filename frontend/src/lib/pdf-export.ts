import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports.
 * 
 * THE ULTIMATE "SAFE MODE" FIX:
 * If html2canvas's CSS parser continues to fail due to modern CSS (lab, oklch),
 * we use a strategy that minimizes the work the parser has to do.
 */
export async function exportReportToPDF(elementId: string, title: string) {
    if (typeof window === 'undefined') return;

    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
        throw new Error(`Report element "${elementId}" not found.`);
    }

    const originalScrollPos = window.scrollY;

    try {
        // 1. Prepare for capture
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const height = reportElement.scrollHeight;
        const width = reportElement.scrollWidth || 1200;

        // Use a more conservative scale to prevent memory issues
        const safeScale = height > 5000 ? 1 : 1.5;

        console.log(`[PDF Export] Capturing in Safe Mode: ${width}x${height}`);

        const canvas = await html2canvas(reportElement, {
            scale: safeScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            // Optimization: Remove foreignObject usage which is often where lab() fails
            foreignObjectRendering: false,
            onclone: (clonedDoc) => {
                const clones = clonedDoc.querySelectorAll('*');
                const originals = reportElement.querySelectorAll('*');

                // 2. CRITICAL: Pre-sanitize any element that has a 'lab' or 'oklch' color
                // We do this by checking computed styles and forcing RGB
                for (let i = 0; i < clones.length; i++) {
                    const clone = clones[i] as HTMLElement;
                    const original = originals[i] as HTMLElement;
                    if (!original) continue;

                    try {
                        const style = window.getComputedStyle(original);

                        // We ONLY force bake the most problematic properties
                        // This avoids the "too much work" problem while fixing the crash
                        if (style.color.includes('lab') || style.color.includes('oklch')) {
                            clone.style.color = '#1e293b';
                        }
                        if (style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklch')) {
                            clone.style.backgroundColor = '#ffffff';
                        }

                        // Fix for charts
                        if (clone.classList.contains('tremor-base') || clone.classList.contains('recharts-responsive-container')) {
                            clone.style.width = '1000px';
                            clone.style.height = '400px';
                        }
                    } catch (e) { }

                    // Hide UI
                    if (clone.classList.contains('print:hidden') || clone.tagName === 'BUTTON') {
                        clone.style.display = 'none';
                    }
                }

                // 3. NUCLEAR: Remove all style tags that contain problematic strings
                // This is faster than style baking everything and prevents the parser crash
                clonedDoc.querySelectorAll('style').forEach(styleTag => {
                    const content = styleTag.innerHTML;
                    if (content.includes('lab(') || content.includes('oklch(')) {
                        // Instead of removing, we try to "clean" it simply
                        styleTag.innerHTML = content.replace(/(lab|oklch|oklab|color-mix)\([^)]+\)/g, '#3b82f6');
                    }
                });
            }
        });

        // 3. Generate PDF
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const imgData = canvas.toDataURL('image/jpeg', 0.8); // Slightly higher compression

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`nlace-reporte-${safeTitle}-${dateStr}.pdf`);

        window.scrollTo(0, originalScrollPos);

    } catch (error: any) {
        console.error('[PDF Export] Failed:', error);
        window.scrollTo(0, originalScrollPos);
        throw new Error('Lo sentimos, el reporte es demasiado complejo para el generador actual. Como alternativa, puedes usar "Imprimir" (Ctrl+P) y seleccionar "Guardar como PDF".');
    }
}
