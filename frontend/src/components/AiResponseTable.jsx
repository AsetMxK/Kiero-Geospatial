import React from 'react';
import AiMarkdownRenderer from './AiMarkdownRenderer';

/**
 * Komponen untuk menampilkan respons data dari AI.
 * Mendukung:
 * 1. Data tabel dengan kolom dinamis
 * 2. Ringkasan analisis dengan format markdown
 * 3. Kombinasi keduanya
 *
 * @param {object} props
 * @param {string} props.analysis_summary - Ringkasan analisis dari AI (markdown format)
 * @param {Array} props.data - Array objek data complaint/tiket
 */
const AiResponseTable = ({ analysis_summary, data }) => {
    const hasTableData = data && data.length > 0;

    // Helper untuk membersihkan string (menghapus kurung kurawal ganda {{...}})
    const cleanStr = (str) => {
        if (str === null || str === undefined) return '';
        return String(str).replace(/\{\{|}}/g, '');
    };

    // Formatter untuk header kolom (snake_case to Title Case/Uppercase)
    const formatHeader = (key) => {
        return key.replace(/_/g, ' ').toUpperCase();
    };

    // Get dynamic headers from the first data item
    const columns = hasTableData ? Object.keys(data[0]) : [];

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Analysis Summary - Now with Markdown Rendering */}
            {analysis_summary && (
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100/80 rounded-xl p-4 shadow-sm">
                    <AiMarkdownRenderer
                        content={analysis_summary}
                        className="text-gray-800"
                    />
                </div>
            )}

            {/* Data Table - Only render if there's table data */}
            {hasTableData && (
                <>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    {columns.map((key) => (
                                        <th key={key} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                                            {formatHeader(key)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((item, index) => (
                                    <tr key={index} className="bg-white hover:bg-blue-50/30 transition-colors">
                                        {columns.map((key) => {
                                            let content = cleanStr(item[key]);

                                            // Special handling for 'Complaint' field to remove pipes if present
                                            if (key.toLowerCase() === 'complaint' && content.includes('|')) {
                                                content = content.split('|')[1] || content;
                                            }

                                            return (
                                                <td key={key} className="px-4 py-3 whitespace-nowrap">
                                                    {/* Truncate long text especially for description/complaint */}
                                                    <div className="max-w-[200px] truncate" title={content}>
                                                        {content || '-'}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-xs text-gray-400 text-right flex items-center justify-end gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
                        </svg>
                        <span>Menampilkan {data.length} data</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default React.memo(AiResponseTable);
