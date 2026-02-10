import React from 'react';

// Simple Markdown Renderer for Bold, Lists, Headers
// Optimized for AI Chat responses
export default function MarkdownRenderer({ content, className = '' }: { content: string, className?: string }) {
    if (!content) return null;

    // Split by paragraphs (double newline)
    const paragraphs = content.split('\n\n');

    return (
        <div className={`space-y-3 ${className}`}>
            {paragraphs.map((paragraph, idx) => {
                const trimmed = paragraph.trim();

                // Handle Headers (###)
                if (trimmed.startsWith('### ')) {
                    return <h3 key={idx} className="text-sm font-bold mt-2 mb-1"><FormattedText text={trimmed.replace(/^### /, '')} /></h3>
                }

                // Handle Lists (- or *)
                // We check if the paragraph contains list items separated by newlines
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const items = trimmed.split('\n').filter(l => l.trim().length > 0);
                    return (
                        <ul key={idx} className="list-disc pl-4 space-y-1 my-1">
                            {items.map((item, i) => (
                                <li key={i} className="pl-1">
                                    <FormattedText text={item.replace(/^[-*] /, '')} />
                                </li>
                            ))}
                        </ul>
                    );
                }

                // Regular paragraph
                return (
                    <p key={idx} className="leading-relaxed whitespace-pre-wrap">
                        <FormattedText text={paragraph} />
                    </p>
                )
            })}
        </div>
    );
}

// Helper to render bold text
function FormattedText({ text }: { text: string }) {
    if (!text) return null;

    // Split by double asterisks for bold
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Remove asterisks and style
                    return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
}
