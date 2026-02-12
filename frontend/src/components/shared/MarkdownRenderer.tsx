import React from 'react';

// Simple Markdown Renderer for Bold, Lists, Headers
// Optimized for AI Chat responses
export default function MarkdownRenderer({ content, className = '' }: { content: string, className?: string }) {
    if (!content) return null;

    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    let listItems: string[] = [];

    const flushList = (keyPrefix: string) => {
        if (listItems.length === 0) return;
        blocks.push(
            <ul key={`${keyPrefix}-list`} className="list-disc pl-5 space-y-1 my-2">
                {listItems.map((item, i) => (
                    <li key={`${keyPrefix}-${i}`} className="pl-1">
                        <FormattedText text={item} />
                    </li>
                ))}
            </ul>
        );
        listItems = [];
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {(() => {
                lines.forEach((line, idx) => {
                    const trimmed = line.trim();

                    if (!trimmed) {
                        flushList(`empty-${idx}`);
                        return;
                    }

                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        listItems.push(trimmed.replace(/^[-*]\s*/, ''));
                        return;
                    }

                    flushList(`line-${idx}`);

                    if (trimmed.startsWith('# ')) {
                        blocks.push(
                            <h1 key={`h1-${idx}`} className="text-xl font-bold mt-4 mb-2 text-slate-900 border-b pb-1">
                                <FormattedText text={trimmed.replace(/^# /, '')} />
                            </h1>
                        );
                        return;
                    }
                    if (trimmed.startsWith('## ')) {
                        blocks.push(
                            <h2 key={`h2-${idx}`} className="text-lg font-bold mt-3 mb-1.5 text-slate-800">
                                <FormattedText text={trimmed.replace(/^## /, '')} />
                            </h2>
                        );
                        return;
                    }
                    if (trimmed.startsWith('### ')) {
                        blocks.push(
                            <h3 key={`h3-${idx}`} className="text-md font-bold mt-2 mb-1 text-slate-800">
                                <FormattedText text={trimmed.replace(/^### /, '')} />
                            </h3>
                        );
                        return;
                    }

                    blocks.push(
                        <p key={`p-${idx}`} className="text-slate-700 leading-relaxed mb-1">
                            <FormattedText text={trimmed} />
                        </p>
                    );
                });

                flushList('final');
                return blocks;
            })()}
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
