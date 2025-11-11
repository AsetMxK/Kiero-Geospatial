import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import MapMarkerIcon from './icons/MapMarkerIcon';
import { getStatusColorHsl } from '../utils/statusColors';

/**
 * Komponen sederhana yang menampilkan status pemuatan di dalam InfoWindow.
 * @returns {JSX.Element}
 */
const InfoWindowLoading = () => (
    <div className="p-4 font-sans" style={{ minWidth: '200px' }}>
        <p className="text-center text-gray-600">Memuat data tiket...</p>
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

    const ticketDetails = details?.data;
    const pinColorHsl = getStatusColorHsl(status, isActive);
    const infoWindowStatusColorHsl = ticketDetails ? getStatusColorHsl(ticketDetails.status, false) : pinColorHsl;

    return (
        <>
            <AdvancedMarker
                ref={markerRef}
                position={{ lat, lng }}
                onClick={onSelect}
            >
                <MapMarkerIcon 
                    className={`drop-shadow ${isActive ? 'scale-110 drop-shadow-lg' : ''}`}
                    style={{ color: pinColorHsl }}
                />
            </AdvancedMarker>
            {isActive && (
                <InfoWindow
                    anchor={marker}
                    onCloseClick={onSelect}
                    disableAutoPan={true}
                >
                    {isLoadingDetails && <InfoWindowLoading />}
                    {errorDetails && 
                        <div className="p-2 text-red-500">
                            Gagal memuat detail: {typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Kesalahan tidak diketahui'}
                        </div>
                    }
                    {!isLoadingDetails && !errorDetails && details && (
                    <div className="p-2 pt-0 font-sans" style={{ minWidth: '220px' }}>
                        <h3 className="font-bold text-base mb-1">{ticketDetails.ticket_number}</h3>
                        <p className="text-sm text-gray-600 mb-2">{ticketDetails.category}</p>

                        <div className="text-sm space-y-1">
                            <p><strong>Status:</strong> <span style={{ color: infoWindowStatusColorHsl, fontWeight: 'bold' }}>{ticketDetails.status}</span></p>
                            <p><strong>Address:</strong> {ticketDetails.address || 'N/A'}</p>
                            <p><strong>Complaint:</strong> {ticketDetails.complaint_detail || 'N/A'}</p>
                        </div>
                    </div>
                    )}
                </InfoWindow>
            )}
        </>
    );
};

export default TicketPin;
