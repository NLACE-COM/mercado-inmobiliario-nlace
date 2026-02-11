import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports using html2canvas & jsPDF.
 * 
 * SPECIAL FIX: Tailwind 4 and modern UI libraries use color functions like lab() and oklch()
 * which html2canvas cannot parse. This utility sanitizes the DOM clone before capture.
 */
export async function exportReportToPDF(elementId: string, title: string) {
    if (typeof window === 'undefined') return;

    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
        throw new Error(`Report element "${elementId}" not found in DOM.`);
    }

    // Store state
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
        // Wait for charts to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        const height = reportElement.scrollHeight;
        const width = reportElement.scrollWidth || 1200;

        // Quality vs Memory: Cap scale for very long documents
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
                // 1. Aggressive Style Sanitization for html2canvas compatibility
                // Remove modern CSS color functions that cause "parsing error" in html2canvas
                const styleTags = clonedDoc.querySelectorAll('style');
                styleTags.forEach(tag => {
                    // Replace oklch(), lab(), oklab() and color-mix() with safe fallbacks
                    // This is a regex-based "polyfill" to prevent html2canvas parser crashes
                    let css = tag.innerHTML;
                    css = css.replace(/oklch\([^)]+\)/g, '#3b82f6');
                    css = css.replace(/oklab\([^)]+\)/g, '#3b82f6');
                    css = css.replace(/lab\([^)]+\)/g, '#3b82f6');
                    css = css.replace(/color-mix\([^)]+\)/g, '#64748b');
                    tag.innerHTML = css;
                });

                // 2. Element-level cleanup
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    clonedElement.style.height = 'auto';
                    clonedElement.style.maxHeight = 'none';
                    clonedElement.style.overflow = 'visible';
                    clonedElement.style.display = 'block';
                    clonedElement.style.padding = '40px';

                    // Kill any problematic inline styles
                    const allInClone = clonedElement.querySelectorAll('*');
                    allInClone.forEach(el => {
                        const htmlEl = el as HTMLElement;
                        const styleAttr = htmlEl.getAttribute('style') || '';
                        if (styleAttr.includes('lab(') || styleAttr.includes('oklch(') || styleAttr.includes('color-mix(')) {
                            // Strip modern color functions from inline styles
                            htmlEl.setAttribute('style', styleAttr
                                .replace(/oklch\([^)]+\)/g, '#3b82f6')
                                .replace(/lab\([^)]+\)/g, '#3b82f6')
                            );
                        }
                    });

                    // 3. Hide UI actions
                    clonedDoc.querySelectorAll('.print\\:hidden, button, .action-bar').forEach(el => {
                        (el as HTMLElement).style.setProperty('display', 'none', 'important');
                    });

                    // 4. Stabilize Charts for capture
                    clonedDoc.querySelectorAll('.recharts-responsive-container, .tremor-base').forEach(chart => {
                        (chart as HTMLElement).style.width = '1000px';
                        (chart as HTMLElement).style.height = '400px';
                        (chart as HTMLElement).style.position = 'relative';
                        (chart as HTMLElement).style.visibility = 'visible';
                        (chart as HTMLElement).style.opacity = '1';
                    });
                }
            }
        });

        // Final PDF generation
        const imgWidth = 210; // A4 Width mm
        const pageHeight = 297; // A4 Height mm
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

    } catch (error) {
        console.error('[PDF Export] Failed:', error);
        window.scrollTo(0, originalScrollPos);
        throw error;
    }
}
