import React, { useMemo } from 'react';
import AiResponseTable from './AiResponseTable';

/**
 * Robust Markdown Renderer for AI Responses
 * Supports: Headers, Bold, Tables, Lists (nested with •), Horizontal rules
 *
 * @param {object} props
 * @param {string} props.content - Raw markdown string from AI
 * @param {string} props.className - Additional CSS classes
 */
const AiMarkdownRenderer = ({ content, className = '' }) => {
    /**
     * Parse inline formatting (bold, links, code)
     * @param {string} text - Text to parse
     * @returns {React.ReactNode[]}
     */
    const parseInline = (text) => {
        if (!text) return null;

        const boldRegex = /\*\*(.+?)\*\*/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let key = 0;

        while ((match = boldRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            parts.push(
                <strong key={`bold-${key++}`} className="font-semibold text-gray-900">
                    {match[1]}
                </strong>
            );
            lastIndex = boldRegex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }

        return parts.length > 0 ? parts : text;
    };

    /**
     * Parse a markdown table block
     * @param {string[]} lines - Array of table lines
     * @returns {React.ReactNode}
     */
    const parseTable = (lines, startKey) => {
        if (lines.length < 2) return null;

        const headerLine = lines[0];
        const headers = headerLine
            .split('|')
            .map((h) => h.trim().replace(/\*/g, ''))
            .filter((h) => h && !h.match(/^:?-+:?$/));

        const separatorIndex = lines.findIndex((line) => /^\|?\s*:?-+:?\s*\|/.test(line));
        const dataLines = lines.slice(separatorIndex + 1);

        const rows = dataLines
            .filter((line) => line.includes('|'))
            .map((line) =>
                line
                    .split('|')
                    .map((cell) => cell.trim().replace(/\*/g, ''))
                    .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || arr.length <= 2)
            );

        // Convert rows to an array of objects for AiResponseTable
        const tableData = rows.map((row) => {
            const obj = {};
            headers.forEach((header, idx) => {
                const rawKey = header.replace(/\s+/g, '_').toLowerCase() || `kolom_${idx}`;
                obj[rawKey] = row[idx] || '';
            });
            return obj;
        });

        if (tableData.length === 0) return null;

        return (
            <div key={`table-wrapper-${startKey}`} className="my-4">
                <AiResponseTable data={tableData} />
            </div>
        );
    };

    /**
     * Parse list items with support for nested bullets using •
     * @param {string[]} lines - Array of list item lines
     * @returns {React.ReactNode}
     */
    const parseList = (lines, startKey) => {
        const items = [];
        let currentItem = null;
        let subItems = [];

        lines.forEach((line) => {
            // Top-level bullet: starts with * or - (not indented)
            const topBulletMatch = line.match(/^[\*\-]\s+(.+)$/);
            // Sub-bullet: indented with spaces/tabs and uses •, +, -, or *
            const subBulletMatch = line.match(/^\s+[•\+\-\*]\s*(.+)$/);

            if (topBulletMatch) {
                // Save previous item if exists
                if (currentItem !== null) {
                    items.push({ content: currentItem, subItems: [...subItems] });
                    subItems = [];
                }
                currentItem = topBulletMatch[1];
            } else if (subBulletMatch && currentItem !== null) {
                subItems.push(subBulletMatch[1]);
            }
        });

        // Push last item
        if (currentItem !== null) {
            items.push({ content: currentItem, subItems: [...subItems] });
        }

        return (
            <ul key={`list-${startKey}`} className="my-2 space-y-2">
                {items.map((item, idx) => (
                    <li key={idx} className="flex flex-col">
                        <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{parseInline(item.content)}</span>
                        </div>
                        {item.subItems.length > 0 && (
                            <ul className="ml-5 mt-1.5 space-y-1 pl-3">
                                {item.subItems.map((subItem, subIdx) => (
                                    <li key={subIdx} className="flex items-start gap-2">
                                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                                        <span className="text-gray-600 text-sm">{parseInline(subItem)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    /**
     * Main parsing function
     * Converts markdown string to React elements
     */
    const parsedContent = useMemo(() => {
        if (!content) return null;

        const lines = content.split('\n');
        const elements = [];
        let key = 0;
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Skip empty lines
            if (!trimmedLine) {
                i++;
                continue;
            }

            // Horizontal rule ---
            if (/^-{3,}$/.test(trimmedLine)) {
                elements.push(<hr key={`hr-${key++}`} className="my-4 border-t border-gray-200" />);
                i++;
                continue;
            }

            // Header with emoji: **📊 Title** or **💡 Title**
            // Uses Unicode property escapes for robust emoji detection
            const emojiHeaderMatch = trimmedLine.match(/^\*\*(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*(.+?)\*\*$/u);
            if (emojiHeaderMatch) {
                elements.push(
                    <div key={`emoji-header-${key++}`} className="flex items-center gap-2 mt-4 mb-3">
                        <span className="text-xl">{emojiHeaderMatch[1]}</span>
                        <h3 className="text-base font-bold text-gray-900">{emojiHeaderMatch[2]}</h3>
                    </div>
                );
                i++;
                continue;
            }

            // Date header pattern **[YYYY-MM-DD]**
            const dateHeaderMatch = trimmedLine.match(/^\*\*\[(\d{4}-\d{2}-\d{2})\]\*\*$/);
            if (dateHeaderMatch) {
                elements.push(
                    <div
                        key={`date-header-${key++}`}
                        className="flex items-center gap-2 mt-4 mb-2 bg-gradient-to-r from-blue-50 to-transparent px-3 py-2 rounded-lg border-l-4 border-blue-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-blue-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                        </svg>
                        <span className="text-sm font-semibold text-blue-700">{dateHeaderMatch[1]}</span>
                    </div>
                );
                i++;
                continue;
            }

            // Regular headers # ## ###
            const headerMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const HeaderTag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
                const headerClasses = {
                    1: 'text-lg font-bold text-gray-900 mt-4 mb-2',
                    2: 'text-base font-semibold text-gray-800 mt-3 mb-2',
                    3: 'text-sm font-semibold text-gray-700 mt-2 mb-1',
                };

                elements.push(
                    <HeaderTag key={`header-${key++}`} className={headerClasses[level]}>
                        {parseInline(headerMatch[2])}
                    </HeaderTag>
                );
                i++;
                continue;
            }

            // Table detection (line starts with | or has |)
            if (trimmedLine.startsWith('|') || (trimmedLine.includes('|') && lines[i + 1]?.includes('---'))) {
                const tableLines = [];
                while (i < lines.length && (lines[i].includes('|') || lines[i].trim().match(/^:?-+:?$/))) {
                    if (lines[i].trim()) {
                        tableLines.push(lines[i]);
                    }
                    i++;
                }
                if (tableLines.length > 0) {
                    elements.push(parseTable(tableLines, key++));
                }
                continue;
            }

            // List detection: starts with * or - (not indented)
            if (/^[\*\-]\s+/.test(line)) {
                const listLines = [];
                // Collect all lines that are part of this list (top-level and sub-bullets)
                while (i < lines.length) {
                    const currentLine = lines[i];
                    const isTopBullet = /^[\*\-]\s+/.test(currentLine);
                    const isSubBullet = /^\s+[•\+\-\*]\s*/.test(currentLine);
                    const isEmpty = currentLine.trim() === '';

                    if (isTopBullet || isSubBullet) {
                        listLines.push(currentLine);
                        i++;
                    } else if (isEmpty) {
                        // Empty line might separate list items, check next line
                        if (i + 1 < lines.length && /^[\*\-]\s+/.test(lines[i + 1])) {
                            i++;
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                if (listLines.length > 0) {
                    elements.push(parseList(listLines, key++));
                }
                continue;
            }

            // Regular paragraph
            elements.push(
                <p key={`para-${key++}`} className="text-sm text-gray-700 leading-relaxed my-1">
                    {parseInline(trimmedLine)}
                </p>
            );
            i++;
        }

        return elements;
    }, [content]);

    return <div className={`ai-markdown-content prose prose-sm max-w-none ${className}`}>{parsedContent}</div>;
};

export default React.memo(AiMarkdownRenderer);
