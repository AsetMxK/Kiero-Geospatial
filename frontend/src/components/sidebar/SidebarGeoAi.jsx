import React, { useRef, useEffect, useCallback } from 'react';
import AiResponseTable from '../AiResponseTable';
import AiMarkdownRenderer from '../AiMarkdownRenderer';
import { useGeoAi } from '../../hooks/useGeoAi';
import TrashIcon from '../icons/TrashIcon';
import Tooltip from '../Tooltip';
import { cleanRegionName } from '../../utils/mapUtils';

const SidebarGeoAi = ({ isMobile, onRegionAutoSelect }) => {
    const handleAiResponse = useCallback((data) => {
        if (data.region && onRegionAutoSelect) {
            const cleanedRegion = cleanRegionName(data.region);
            if (cleanedRegion) {
                onRegionAutoSelect(cleanedRegion);
            }
        }
    }, [onRegionAutoSelect]);

    const {
        aiInput,
        setAiInput,
        aiMessages,
        isAiLoading,
        handleAiSubmit,
        sessions,
        currentSessionId,
        createNewSession,
        switchSession,
        deleteSession
    } = useGeoAi({ onResponse: handleAiResponse });

    const [showHistory, setShowHistory] = React.useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (!showHistory && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiMessages, isAiLoading, showHistory]);

    // Format date helper
    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <>
            {/* Header - Centered Horizontal with Actions */}
            <div className={`p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white shrink-0`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Geo AI Assistant</h2>
                            <p className="text-xs text-white/80">
                                {showHistory ? "Riwayat Percakapan" : "Tanya tentang wilayah"}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                        <Tooltip content="Riwayat Chat">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-white text-blue-600' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </button>
                        </Tooltip>
                        <Tooltip content="Chat Baru">
                            <button
                                onClick={() => {
                                    if (aiMessages.length > 0) {
                                        createNewSession();
                                        setShowHistory(false);
                                    }
                                }}
                                disabled={aiMessages.length === 0}
                                className={`p-2 rounded-full transition-colors ${aiMessages.length === 0
                                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {showHistory ? (
                /* History List */
                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gray-50/50">
                    {sessions.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Belum ada riwayat percakapan.
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => {
                                    switchSession(session.id);
                                    setShowHistory(false);
                                }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${currentSessionId === session.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                    : 'bg-white border-gray-200 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-medium text-sm line-clamp-1 ${currentSessionId === session.id ? 'text-blue-700' : 'text-gray-800'
                                        }`}>
                                        {session.title || 'Percakapan Baru'}
                                    </h3>
                                    <Tooltip content="Hapus chat">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSession(session.id);
                                            }}
                                            className="text-gray-400 hover:text-red-500 p-1 -mt-1 -mr-1 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </Tooltip>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {formatDate(session.updatedAt)} • {session.messages.length} pesan
                                </p>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Chat Messages Area */
                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4 bg-gray-50/50">
                    {aiMessages.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-blue-600">
                                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-gray-700 font-semibold mb-2">Halo! Saya Geo AI</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                Tanya apa saja tentang data wilayah.
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center gap-2">
                                {['Cari wilayah', 'Statistik provinsi', 'Info lokasi'].map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setAiInput(suggestion)}
                                        className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        aiMessages.map((msg, idx) => {
                            // 1. Cek Status Error (Support struktur nested 'answer' maupun root)
                            const isErrorState =
                                msg.status === 'error' ||
                                msg?.answer?.status === 'error' ||
                                msg.isError;

                            // 2. Tentukan Pesan yang Ditampilkan
                            // PENTING: Jika error, kita PAKSA ambil pesan errornya, abaikan msg.content lama.
                            let displayContent = msg.content;

                            if (isErrorState) {
                                displayContent = msg?.answer?.message || msg.message || "Terjadi kesalahan pada data.";
                            }

                            return (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[95%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : isErrorState
                                                ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md' // Style Merah jika Error
                                                : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-md'
                                            }`}
                                    >
                                        {/* 3. Logic Render Konten */}
                                        {/* Tampilkan Tabel HANYA jika BUKAN error dan ada data */}
                                        {!isErrorState && msg.tableData && msg.tableData.length > 0 ? (
                                            <AiResponseTable
                                                analysis_summary={displayContent}
                                                data={msg.tableData}
                                            />
                                        ) : (
                                            // Jika Error atau tidak ada tabel, render dengan markdown renderer
                                            msg.role === 'user' ? (
                                                <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
                                            ) : (
                                                <AiMarkdownRenderer
                                                    content={displayContent}
                                                    className="text-sm"
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {isAiLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-xs text-gray-500">Geo AI sedang berpikir...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleAiSubmit} className="max-w-lg mx-auto">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5 pl-4 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <textarea
                            value={aiInput}
                            onChange={(e) => {
                                setAiInput(e.target.value);
                                // Auto-resize
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAiSubmit(e);
                                    // Reset height
                                    e.target.style.height = 'auto';
                                }
                            }}
                            placeholder="Tanyakan sesuatu tentang wilayah..."
                            className="flex-1 bg-transparent text-sm resize-none focus:outline-none py-2 custom-scrollbar placeholder-gray-500"
                            rows={1}
                            style={{ maxHeight: '80px', minHeight: '24px' }}
                            disabled={isAiLoading}
                        />
                        <Tooltip content="Kirim pertanyaan">
                            <button
                                type="submit"
                                disabled={!aiInput.trim() || isAiLoading}
                                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${aiInput.trim() && !isAiLoading
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                </svg>
                            </button>
                        </Tooltip>
                    </div>
                </form>
            </div>
        </>
    );
};

export default SidebarGeoAi;
