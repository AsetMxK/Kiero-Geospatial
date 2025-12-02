import { useState, useEffect } from 'react';
import ErrorModal from './ErrorModal';

/**
 * Komponen global untuk menangani error dari Axios (terutama 5xx).
 * Mendengarkan event 'AXIOS_ERROR' yang dikirim dari apiClient.js.
 */
const GlobalErrorHandler = () => {
    const [error, setError] = useState(null);

    useEffect(() => {
        const handleAxiosError = (event) => {
            setError(event.detail);
        };

        window.addEventListener('AXIOS_ERROR', handleAxiosError);
        return () => window.removeEventListener('AXIOS_ERROR', handleAxiosError);
    }, []);

    if (!error) return null;

    return (
        <ErrorModal
            message={error}
            onClose={() => setError(null)}
        />
    );
};

export default GlobalErrorHandler;
