import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

/**
 * Zustand store for Geo AI Chat data persistence.
 * Features:
 * - Multi-session management (Chat History)
 * - Auto-cleanup of data older than 7 days
 * - LocalStorage persistence
 */
const useGeoAiStore = create(
    persist(
        (set, get) => ({
            sessions: {}, // Map of sessionId -> session object
            currentSessionId: null,

            // --- Actions ---

            /**
             * Initialize a new chat session state.
             * Does NOT create a persistence entry yet. Just clears the current context.
             */
            createNewSession: () => {
                set({ currentSessionId: null });
            },

            /**
             * Switch current active chat session.
             */
            switchSession: (sessionId) => {
                const { sessions } = get();
                if (sessions[sessionId]) {
                    set({ currentSessionId: sessionId });
                }
            },

            /**
             * Add a message to the CURRENT session.
             * If no session is active (currentSessionId is null), creates one now.
             */
            addMessage: (message) => {
                let { currentSessionId, sessions } = get();

                // Lazy Creation: If no active session, create one now
                if (!currentSessionId) {
                    const newId = uuidv4();
                    const newSession = {
                        id: newId,
                        title: 'New Chat',
                        messages: [],
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    };

                    // Update local variables to use this new session
                    currentSessionId = newId;
                    sessions = { ...sessions, [newId]: newSession };

                    // Update state immediately so we can add the message
                    set({
                        sessions,
                        currentSessionId
                    });
                }

                if (!sessions[currentSessionId]) return currentSessionId;

                const session = sessions[currentSessionId];
                const newMessages = [...session.messages, message];

                // Auto-title logic: use first user message as title
                let newTitle = session.title;
                if (session.title === 'New Chat' && message.role === 'user') {
                    newTitle = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
                }

                set((state) => ({
                    sessions: {
                        ...state.sessions,
                        [currentSessionId]: {
                            ...session,
                            messages: newMessages,
                            title: newTitle,
                            updatedAt: Date.now(),
                        },
                    },
                }));

                return currentSessionId;
            },

            /**
             * Delete a specific session.
             * If deleting current session, switches to the most recent one or creates a new one.
             */
            deleteSession: (sessionId) => {
                set((state) => {
                    const newSessions = { ...state.sessions };
                    delete newSessions[sessionId];

                    // Determine new current ID if we deleted the active one
                    let newCurrentId = state.currentSessionId;
                    if (state.currentSessionId === sessionId) {
                        const remainingSessions = Object.values(newSessions).sort((a, b) => b.updatedAt - a.updatedAt);
                        newCurrentId = remainingSessions.length > 0 ? remainingSessions[0].id : null;
                    }

                    return {
                        sessions: newSessions,
                        currentSessionId: newCurrentId,
                    };
                });
            },

            /**
             * Clear all history (manual action)
             */
            clearAllSessions: () => {
                set({ sessions: {}, currentSessionId: null });
            },

            /**
             * Prune sessions older than 7 days.
             * Should be called on initialization.
             */
            pruneOldSessions: () => {
                const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
                const now = Date.now();

                set((state) => {
                    const newSessions = {};
                    let hasChanges = false;

                    Object.values(state.sessions).forEach((session) => {
                        if (now - session.updatedAt < sevenDaysMs) {
                            newSessions[session.id] = session;
                        } else {
                            hasChanges = true;
                        }
                    });

                    if (!hasChanges) return {}; // No state update needed

                    // If current session was pruned, reset it
                    let newCurrentId = state.currentSessionId;
                    if (newCurrentId && !newSessions[newCurrentId]) {
                        newCurrentId = null;
                    }

                    return {
                        sessions: newSessions,
                        currentSessionId: newCurrentId,
                    };
                });
            },
        }),
        {
            name: 'geo-ai-storage', // key in localStorage
            storage: createJSONStorage(() => localStorage),
            version: 1,
            onRehydrateStorage: () => (state) => {
                // Run prune logic immediately after hydration
                if (state) {
                    state.pruneOldSessions();

                    // Note: We no longer auto-create a session if empty.
                    // We just let currentSessionId be null, waiting for user input.
                }
            },
        }
    )
);

export default useGeoAiStore;
