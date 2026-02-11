import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports using html2canvas & jsPDF.
 * 
 * THE ULTIMATE FIX: "Style Baking"
 * Tailwind 4 and some modern UI libs use oklch(), lab() and color-mix()
 * which crash the html2canvas legacy CSS parser.
 * 
 * Instead of trying to regex-replace CSS, we "bake" the computed styles
 * (which the browser already converted to RGB) directly into the elements
 * as inline styles, and then strip all stylesheets.
 */
export async function exportReportToPDF(elementId: string, title: string) {
    if (typeof window === 'undefined') return;

    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
        throw new Error(`Report element "${elementId}" not found in DOM.`);
    }

    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
        // Wait for rendering & animations
        await new Promise(resolve => setTimeout(resolve, 1000));

        const height = reportElement.scrollHeight;
        const width = reportElement.scrollWidth || 1200;

        let safeScale = 2;
        if (height > 5000) safeScale = 1.5;
        if (height > 10000) safeScale = 1;

        console.log(`[PDF Export] Starting capture: ${width}x${height} at scale ${safeScale}`);

        const canvas = await html2canvas(reportElement, {
            scale: safeScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            scrollY: -window.scrollY,
            windowWidth: width,
            windowHeight: height,
            onclone: (clonedDoc) => {
                const clones = clonedDoc.querySelectorAll('*');
                const originals = reportElement.querySelectorAll('*');

                // 1. "Style Baking" - Convert all computed colors to inline RGB
                // Browser's getComputedStyle always returns RGB/RGBA for oklch/lab colors
                for (let i = 0; i < clones.length; i++) {
                    const clone = clones[i] as HTMLElement;
                    const original = originals[i] as HTMLElement;
                    if (!original || !clone.style) continue;

                    try {
                        const computed = window.getComputedStyle(original);

                        // Bake essential styles that might use modern color functions
                        clone.style.color = computed.color;
                        clone.style.backgroundColor = computed.backgroundColor;
                        clone.style.borderColor = computed.borderColor;
                        clone.style.fill = computed.fill;
                        clone.style.stroke = computed.stroke;

                        // If it's a chart or card, ensure it's fully opaque and visible
                        if (clone.classList.contains('tremor-base') || clone.classList.contains('recharts-responsive-container')) {
                            clone.style.width = '1000px';
                            clone.style.height = '400px';
                            clone.style.display = 'block';
                            clone.style.visibility = 'visible';
                            clone.style.opacity = '1';
                        }
                    } catch (e) {
                        // Skip if element is detached or restricted
                    }
                }

                // 2. The Nuclear Option: Remove all stylesheets, links, and scripts
                // Since we "baked" the styles, we don't need the stylesheets anymore.
                // This prevents html2canvas from ever seeing the problematic "lab()" code.
                clonedDoc.querySelectorAll('style, link[rel="stylesheet"], script').forEach(el => {
                    // Safety: Keep our manual baked styles if any, but html2canvas normally 
                    // handles inline styles fine without any stylesheets present.
                    el.remove();
                });

                // 3. Manual override for UI elements
                clonedDoc.querySelectorAll('.print\\:hidden, button').forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                });

                // 4. Force white background on the container
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    clonedElement.style.backgroundColor = '#ffffff';
                    clonedElement.style.padding = '40px';
                }
            }
        });

        // Generate PDF
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const imgData = canvas.toDataURL('image/jpeg', 0.85);

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
        throw new Error('Error técnico al capturar los colores del reporte. Por favor, intenta de nuevo o usa Ctrl+P para guardar como PDF.');
    }
}
