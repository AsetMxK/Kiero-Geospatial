import React from 'react';

/**
 * Komponen tabel untuk menampilkan respons data dari AI.
 * Menampilkan ringkasan analisis dan tabel data terkait.
 * 
 * @param {object} props
 * @param {string} props.analysis_summary - Ringkasan analisis dari AI
 * @param {Array} props.data - Array objek data complaint/tiket
 */
const AiResponseTable = ({ analysis_summary, data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{analysis_summary}</p>
            </div>
        );
    }

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
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Analysis Summary */}
            {analysis_summary && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-sm text-blue-900 leading-relaxed">
                        {analysis_summary}
                    </p>
                </div>
            )}

            {/* Data Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((key) => (
                                <th key={key} scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">
                                    {formatHeader(key)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50 transition-colors">
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
            <div className="text-xs text-gray-400 text-right">
                Menampilkan {data.length} data
            </div>
        </div>
    );
};

export default AiResponseTable;
