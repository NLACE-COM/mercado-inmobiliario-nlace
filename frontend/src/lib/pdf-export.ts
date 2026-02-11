import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Client-side PDF export for reports using html2canvas & jsPDF
 * High-performance version with specialized handling for long reports and charts.
 * Features: Auto-scaling, memory management, and SVG precision fixing.
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
        // Wait for rendering & animations
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Memory Management: Calculate optimal scale based on element height
        // Chrome has a canvas limit (approx 16,384px height). 
        // We stay safe by capping total pixels.
        const height = reportElement.scrollHeight;
        const width = reportElement.scrollWidth || 1200;

        let safeScale = 2; // Default high quality
        if (height * safeScale > 15000) {
            safeScale = 1.5;
        }
        if (height * safeScale > 15000) {
            safeScale = 1;
        }

        console.log(`[PDF Export] Starting capture: ${width}x${height} at scale ${safeScale}`);

        const canvas = await html2canvas(reportElement, {
            scale: safeScale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            // Capture full scrollable area
            scrollY: -window.scrollY,
            windowWidth: width,
            windowHeight: height,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById(elementId);
                if (clonedElement) {
                    // Force the clone to show all content without scrolls
                    clonedElement.style.height = 'auto';
                    clonedElement.style.maxHeight = 'none';
                    clonedElement.style.overflow = 'visible';
                    clonedElement.style.display = 'block';
                    clonedElement.style.padding = '40px'; // Professional margins

                    // Hide UI-only elements
                    clonedDoc.querySelectorAll('.print\\:hidden, button, .action-bar').forEach(el => {
                        (el as HTMLElement).style.setProperty('display', 'none', 'important');
                    });

                    // --- COLOR COMPATIBILITY FIX ---
                    // Fix for 'lab()' and 'oklch()' color functions not supported by html2canvas
                    const styleTag = clonedDoc.createElement('style');
                    styleTag.innerHTML = `
                        * {
                            /* Attempt to override any variables that might use modern color spaces */
                            --tw-ring-color: rgba(59, 130, 246, 0.5) !important;
                            --tw-ring-offset-color: white !important;
                        }
                        /* Tremor / Recharts dynamic classes sometimes hit this */
                        [class*="lab("], [style*="lab("], [style*="oklch("] {
                            color: #1e293b !important;
                            background-color: #ffffff !important;
                            fill: #3b82f6 !important;
                        }
                    `;
                    clonedDoc.head.appendChild(styleTag);

                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach(el => {
                        const htmlEl = el as HTMLElement;
                        // Some libraries put lab() directly in inline styles via JS
                        const inlineStyle = htmlEl.getAttribute('style') || '';
                        if (inlineStyle.includes('lab(') || inlineStyle.includes('oklch(') || inlineStyle.includes('color-mix(')) {
                            // Strip the problematic property or replace it
                            htmlEl.style.color = '#1e293b';
                            htmlEl.style.backgroundColor = 'transparent';
                            if (htmlEl.tagName.toLowerCase() === 'path' || htmlEl.tagName.toLowerCase() === 'rect') {
                                htmlEl.style.fill = '#3b82f6';
                            }
                        }
                    });

                    // Fix for Recharts/Tremor SVGs that sometimes don't show up
                    clonedDoc.querySelectorAll('.recharts-responsive-container, .tremor-base').forEach(chart => {
                        (chart as HTMLElement).style.width = '1000px';
                        (chart as HTMLElement).style.height = '400px';
                        (chart as HTMLElement).style.position = 'relative';
                    });

                    clonedDoc.querySelectorAll('svg').forEach(svg => {
                        svg.setAttribute('shape-rendering', 'geometricPrecision');
                        // Ensure text is visible and sized correctly in charts
                        svg.querySelectorAll('text').forEach(t => {
                            t.style.fontFamily = 'sans-serif';
                            t.style.fontSize = '12px';
                        });
                    });
                }
            }
        });

        // Generate PDF
        const imgWidth = 210; // A4 Width in mm
        const pageHeight = 297; // A4 Height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const pdf = new jsPDF('p', 'mm', 'a4', true);

        // JPEG compression level (0.85 is a good balance for data charts)
        const imgData = canvas.toDataURL('image/jpeg', 0.85);

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        // Handle multi-page content
        while (heightLeft > 0) {
            pdf.addPage();
            position = heightLeft - imgHeight;
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
            heightLeft -= pageHeight;
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        pdf.save(`nlace-reporte-${safeTitle}-${dateStr}.pdf`);

        // Success - clean up
        window.scrollTo(0, originalScrollPos);

    } catch (error) {
        console.error('[PDF Export] Failed:', error);
        window.scrollTo(0, originalScrollPos);
        throw error;
    }
}
