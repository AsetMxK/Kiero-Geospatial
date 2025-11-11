import { useState, useEffect } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import MapMarkerIcon from './icons/MapMarkerIcon';

/**
 * Versi sederhana dari komponen `Pin`, khusus untuk digunakan dalam iframe yang disematkan.
 * Komponen ini menampilkan penanda peta dan jendela info dengan koordinat pin serta detail
 * wilayah administratif. Fitur seperti mengedit, menghapus, dan menyalin dihilangkan karena
 * tidak diperlukan dalam konteks iframe. Jendela info ditampilkan secara otomatis setelah jeda singkat.
 *
 * @param {object} props - Properti komponen.
 * @param {object} props.pin - Objek data pin.
 * @param {number} props.pin.lat - Latitude dari pin.
 * @param {number} props.pin.lng - Longitude dari pin.
 * @param {boolean} props.pin.isLoadingAdminInfo - Bendera yang menunjukkan jika info administratif sedang diambil.
 * @param {object} [props.pin.adminInfo] - Data wilayah administratif untuk lokasi pin.
 * @returns {JSX.Element} Komponen IframePin.
 */
const IframePin = ({ pin }) => {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [isInfoWindowVisible, setIsInfoWindowVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsInfoWindowVisible(true);
        }, 500);
        return () => clearTimeout(timer);
    }, [pin]);

    const animationClass = 'animate-drop-in';

    return (
        <>
            <AdvancedMarker
                ref={markerRef}
                position={{ lat: pin.lat, lng: pin.lng }}
            >
                <div className={animationClass}>
                    <MapMarkerIcon className="text-red-600 drop-shadow-lg" />
                </div>
            </AdvancedMarker>

            {isInfoWindowVisible && (
                <InfoWindow
                    anchor={marker}
                    disableAutoPan={true}
                >
                    <div className="p-4 pt-0 font-sans relative" style={{ minWidth: '240px' }}>
                        <div className="font-bold text-base mb-2 pr-4">
                            Informasi Pin
                        </div>
                        <div className="text-sm mb-3">
                            <p><strong>Lat:</strong> {pin.lat.toFixed(9)}</p>
                            <p><strong>Lng:</strong> {pin.lng.toFixed(9)}</p>
                        </div>

                        <div className="border-t pt-2 mt-2 text-xs text-gray-600">
                            {pin.isLoadingAdminInfo && (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>
                                    <span>Mencari info wilayah...</span>
                                </div>
                            )}

                            {!pin.isLoadingAdminInfo && pin.adminInfo && !pin.adminInfo.provinsi && (
                                <p className='italic text-gray-500'>Lokasi tidak berada dalam batas administrasi.</p>
                            )}

                            {pin.adminInfo && pin.adminInfo.provinsi && (() => {
                                const getLabel = (level, type) => {
                                    if (level === 'kab_kota') {
                                        if (type === '4') return 'Kabupaten';
                                        if (type === '5') return 'Kota';
                                        return 'Kab/Kota';
                                    }
                                    if (level === 'desa') {
                                        if (type === '1') return 'Desa';
                                        if (type === '2') return 'Kelurahan';
                                        return 'Desa/Kel';
                                    }
                                    return level.charAt(0).toUpperCase() + level.slice(1);
                                };

                                return (
                                    <ul className="space-y-1">
                                        {pin.adminInfo.provinsi && <li><strong>Provinsi:</strong> {pin.adminInfo.provinsi.nama}</li>}
                                        {pin.adminInfo.kab_kota && <li><strong>{getLabel('kab_kota', pin.adminInfo.kab_kota.tipe)}:</strong> {pin.adminInfo.kab_kota.nama}</li>}
                                        {pin.adminInfo.kecamatan && <li><strong>Kecamatan:</strong> {pin.adminInfo.kecamatan.nama}</li>}
                                        {pin.adminInfo.desa && <li><strong>{getLabel('desa', pin.adminInfo.desa.tipe)}:</strong> {pin.adminInfo.desa.nama}</li>}
                                    </ul>
                                );
                            })()}
                        </div>
                    </div>
                </InfoWindow>
            )}
        </>
    );
};

export default IframePin;
