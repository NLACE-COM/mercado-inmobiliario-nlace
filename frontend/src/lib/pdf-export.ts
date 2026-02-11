import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports using html2canvas & jsPDF.
 * 
 * FINAL BOSS FIX: html2canvas has a legacy CSS parser that crashes on modern CSS functions 
 * like lab(), oklch(), and color-mix().
 * 
 * This version uses a "Sanitization by Exclusion" strategy:
 * 1. Clones the document.
 * 2. Aggressively removes ALL external stylesheets (link tags) and styles that might contain modern CSS.
 * 3. Injects a minimal, sanitized, high-compatibility CSS for the report components.
 * 4. Forces basic colors on all components to prevent parser crashes.
 */
export async function exportReportToPDF(elementId: string, title: string) {
    if (typeof window === 'undefined') return;

    const reportElement = document.getElementById(elementId);
    if (!reportElement) {
        throw new Error(`Report element "${elementId}" not found in DOM.`);
    }

    // Capture initial state
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
        // Wait for charts and animations to settle
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
            logging: true, // Enable logging to see where it hangs if it fails
            scrollY: -window.scrollY,
            windowWidth: width,
            windowHeight: height,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (!clonedElement) return;

                // --- THE NUCLEAR SANITIZATION ---

                // 1. Remove all external links and scripts to prevent the parser from even attempting to read complex CSS
                clonedDoc.querySelectorAll('link[rel="stylesheet"], script, iframe').forEach(el => el.remove());

                // 2. Sanitize all remaining style tags
                clonedDoc.querySelectorAll('style').forEach(style => {
                    let css = style.innerHTML;
                    // Replace ALL problematic functions with safe defaults via regex
                    // We use a broader regex to catch variations and nested functions
                    css = css.replace(/(lab|oklch|oklab|color-mix)\([^)]+\)/g, '#3b82f6');
                    style.innerHTML = css;
                });

                // 3. Inject a 'Report Compatibility' CSS to restore basic layout without the complex Tailwind/Tremor artifacts
                const compatStyle = clonedDoc.createElement('style');
                compatStyle.innerHTML = `
                    /* Modern CSS Reset for html2canvas */
                    * {
                        transition: none !important;
                        animation: none !important;
                        text-rendering: optimizeLegibility !important;
                        -webkit-font-smoothing: antialiased !important;
                        /* Kill all variables that might hold problematic colors */
                        --tw-ring-color: #3b82f6 !important;
                        --tw-ring-offset-color: #ffffff !important;
                        --tw-shadow: 0 0 #0000 !important;
                    }
                    /* Ensure containers are visible and styled simply */
                    #${elementId} {
                        background-color: white !important;
                        color: #1e293b !important;
                        display: block !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Simple styling for cards and charts in the PDF */
                    .tremor-base, .recharts-responsive-container {
                        width: 1000px !important;
                        height: 400px !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                    .recharts-pie-sector path {
                        stroke-width: 1 !important;
                    }
                `;
                clonedDoc.head.appendChild(compatStyle);

                // 4. Manual element-level cleanup for high-risk attributes
                clonedDoc.querySelectorAll('*').forEach(el => {
                    const htmlEl = el as HTMLElement;

                    // Check for inline styles
                    const inline = htmlEl.getAttribute('style') || '';
                    if (inline.includes('lab(') || inline.includes('oklch(') || inline.includes('color-mix(')) {
                        htmlEl.style.color = '#1e293b';
                        htmlEl.style.backgroundColor = '';
                        // Remove problematic inline properties
                        htmlEl.style.removeProperty('fill');
                        htmlEl.style.removeProperty('stroke');
                        htmlEl.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    }

                    // Hide UI-only elements
                    if (htmlEl.classList.contains('print:hidden') || htmlEl.tagName === 'BUTTON') {
                        htmlEl.style.display = 'none';
                    }
                });

                // 5. Special fix for SVG text (Recharts/Tremor)
                clonedDoc.querySelectorAll('svg text').forEach(text => {
                    (text as HTMLElement).style.fontFamily = 'Arial, sans-serif';
                    (text as HTMLElement).style.fontSize = '12px';
                    (text as HTMLElement).style.fill = '#64748b';
                });
            }
        });

        // Generate PDF pages
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
        // Better error message for the user
        const userError = new Error(
            error.message?.includes('lab')
                ? 'El navegador no pudo procesar los colores del gráfico para el PDF. Prueba recargando la página.'
                : error.message
        );
        throw userError;
    }
}
