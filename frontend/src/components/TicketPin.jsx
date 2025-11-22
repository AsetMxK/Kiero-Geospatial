import { useState } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import MapMarkerIcon from './icons/MapMarkerIcon';
import { getStatusColorHsl } from '../utils/statusColors';
import Tooltip from './Tooltip';

/**
 * Komponen sederhana yang menampilkan status pemuatan di dalam InfoWindow.
 * @returns {JSX.Element}
 */
const InfoWindowLoading = () => (
    <div className="p-4 font-sans flex items-center justify-center gap-2" style={{ minWidth: '200px' }}>
        <div className="w-3 h-3 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>
        <p className="text-sm text-gray-600">Memuat data tiket...</p>
    </div>
);

/**
 * Komponen penanda peta yang merepresentasikan sebuah tiket.
 * Warnanya berubah berdasarkan status tiket. Saat aktif (dipilih),
 * komponen ini menampilkan `InfoWindow` dengan detail tiket yang diambil.
 *
 * @param {object} props - Properti komponen.
 * @param {number} props.lat - Latitude dari tiket.
 * @param {number} props.lng - Longitude dari tiket.
 * @param {string} props.status - Status tiket (misalnya, 'open', 'closed').
 * @param {boolean} props.isActive - Apakah pin tiket ini sedang aktif.
 * @param {Function} props.onSelect - Fungsi callback yang dipanggil saat pin diklik.
 * @param {object|null} props.details - Objek yang berisi detail tiket untuk ditampilkan di InfoWindow.
 * @param {boolean} props.isLoadingDetails - Bendera yang menunjukkan jika detail sedang dimuat.
 * @param {Error|null} props.errorDetails - Objek error jika terjadi kesalahan saat memuat detail.
 * @returns {JSX.Element} Komponen TicketPin.
 */
const TicketPin = ({
    lat,
    lng,
    status,
    isActive,
    onSelect,
    details,
    isLoadingDetails,
    errorDetails
}) => {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [isCopySuccess, setIsCopySuccess] = useState(false);

    const ticketDetails = details?.data;
    const pinColorHsl = getStatusColorHsl(status, isActive);

    const handleCopy = () => {
        if (!ticketDetails) return;

        const textToCopy = [
            `Ticket Number: ${ticketDetails.ticket_number}`,
            `Category: ${ticketDetails.category}`,
            `Status: ${ticketDetails.status}`,
            `Source: ${ticketDetails.channel_source || '-'}`,
            `Phone: ${ticketDetails.account_id || '-'}`,
            `Complaint: ${ticketDetails.complaint_detail || '-'}`
        ].join('\n');

        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopySuccess(true);
            setTimeout(() => setIsCopySuccess(false), 2000);
        });
    };

    return (
        <>
            <AdvancedMarker
                ref={markerRef}
                position={{ lat, lng }}
                onClick={onSelect}
            >
                <MapMarkerIcon
                    className={`drop-shadow transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-lg' : 'hover:scale-105'}`}
                    style={{ color: pinColorHsl }}
                />
            </AdvancedMarker>
            {isActive && (
                <InfoWindow
                    anchor={marker}
                    onCloseClick={onSelect}
                    disableAutoPan={true}
                >
                    <div className="p-0 font-sans relative w-[260px]">
                        {/* Loading State */}
                        {isLoadingDetails && <InfoWindowLoading />}

                        {/* Error State */}
                        {errorDetails && (
                            <div className="p-4 text-center">
                                <p className="text-xs text-red-500">
                                    {typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Gagal memuat detail'}
                                </p>
                            </div>
                        )}

                        {/* Content State */}
                        {!isLoadingDetails && !errorDetails && ticketDetails && (
                            <>
                                {/* Header */}
                                <div className="flex items-start justify-between p-3 pb-2">
                                    <div className="flex-1 pr-6">
                                        <h3 className="font-semibold text-gray-900 text-sm leading-tight" title="Nomor Tiket">
                                            {ticketDetails.ticket_number}
                                        </h3>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                            <span className="font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                                {ticketDetails.category}
                                            </span>
                                        </div>
                                    </div>
                                    <Tooltip content="Tutup">
                                        <button
                                            onClick={onSelect}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors absolute right-2 top-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                            </svg>
                                        </button>
                                    </Tooltip>
                                </div>

                                {/* Body */}
                                <div className="px-3 pb-3 space-y-3">
                                    {/* Status & Source Card */}
                                    <div className="bg-gray-50 rounded-md p-2 text-xs border border-gray-100 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Status:</span>
                                            <span
                                                className="font-medium px-1.5 py-0.5 rounded border"
                                                style={{
                                                    color: getStatusColorHsl(ticketDetails.status, true),
                                                    borderColor: getStatusColorHsl(ticketDetails.status, false),
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                {ticketDetails.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Source:</span>
                                            <span className="font-medium text-gray-700">{ticketDetails.channel_source || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Details List */}
                                    <div className="space-y-2 text-xs text-gray-600">
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Phone Number</span>
                                            <div className="font-medium text-gray-800">{ticketDetails.account_id || '-'}</div>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase tracking-wide text-gray-400 font-medium mb-0.5">Complaint</span>
                                            <div className="leading-relaxed text-gray-700 line-clamp-3" title={ticketDetails.complaint_detail}>
                                                {ticketDetails.complaint_detail || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-1">
                                        <button
                                            onClick={handleCopy}
                                            disabled={isCopySuccess}
                                            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${isCopySuccess
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            {isCopySuccess ? (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Tersalin
                                                </>
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                        <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                                        <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                                                    </svg>
                                                    Salin Detail
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </InfoWindow>
            )}
        </>
    );
};

export default TicketPin;
