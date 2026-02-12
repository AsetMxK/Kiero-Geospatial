import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { askGeoAi } from '../utils/aiService';
import useGeoAiStore from '../stores/useGeoAiStore';

/**
 * Custom hook to manage Geo AI chat state and interactions using TanStack Query & Zustand.
 * Provides robust persistence, history management, and cross-tab synchronization.
 * 
 * @returns {object} Hook state and handlers
 */
export const useGeoAi = ({ onResponse } = {}) => {
    // Local state for input (UI state only)
    const [aiInput, setAiInput] = useState('');

    // Access Zustand store
    const {
        sessions,
        currentSessionId,
        addMessage,
        createNewSession,
        switchSession,
        deleteSession
    } = useGeoAiStore();

    // Derive current messages
    const currentSession = currentSessionId ? sessions[currentSessionId] : null;
    const aiMessages = currentSession ? currentSession.messages : [];

    // Ensure there is always a session active on mount if none exists (Double safety, though store handles hydration)
    useEffect(() => {
        // This effect can handle edge cases where hydration might leave us without a current session
        if (!currentSessionId && Object.keys(sessions).length === 0) {
            // Let the store logic handle this usually, but we can force it if needed.
            // Relying on store hydration callback for now.
        }
    }, [currentSessionId, sessions]);


    // TanStack Query mutation for robust API interaction
    const mutation = useMutation({
        mutationFn: ({ question, sessionId }) => askGeoAi(question, sessionId),
        onSuccess: (data) => {
            // Format response untuk disimpan di state
            const aiResponse = {
                role: 'assistant',
                content: data.answer?.analysis_summary || data.answer || "Berikut hasil analisis data yang ditemukan.",
                tableData: data.answer?.data || [],
                status: data.answer?.status,
                message: data.answer?.message
            };
            addMessage(aiResponse);

            // Trigger callback if provided (e.g. for map auto-selection)
            if (onResponse) {
                onResponse(data);
            }
        },
        onError: (error) => {
            console.error("Geo AI Error:", error);
            const errorMessage = {
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
                isError: true
            };
            addMessage(errorMessage);
        }
    });

    const handleAiSubmit = useCallback((e) => {
        if (e) e.preventDefault();

        const trimmedInput = aiInput.trim();
        if (!trimmedInput || mutation.isPending) return;

        // Optimistically add user message to Global Store
        const userMessage = { role: 'user', content: trimmedInput };
        const activeSessionId = addMessage(userMessage);

        // Clear input immediately
        setAiInput('');

        // Trigger the mutation
        mutation.mutate({ question: userMessage.content, sessionId: activeSessionId });

    }, [aiInput, mutation, addMessage]);

    return {
        // Chat State
        aiInput,
        setAiInput,
        aiMessages,
        isAiLoading: mutation.isPending, // v5 syntax
        aiError: mutation.error,

        // Actions
        handleAiSubmit,
        resetAi: mutation.reset,

        // Session / History Management
        currentSessionId,
        sessions: Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt), // Return as array sorted by recent
        createNewSession,
        switchSession,
        deleteSession
    };
};
