import { useState, useCallback, useEffect, useRef } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import Tooltip from './Tooltip';
import MapMarkerIcon from './icons/MapMarkerIcon';

/**
 * Komponen terisolasi untuk mengedit judul.
 * Mengelola state inputnya sendiri untuk mencegah re-render pada parent.
 */
const PinTitleEditor = ({ initialTitle, onSave }) => {
    const [titleInput, setTitleInput] = useState(initialTitle);

    const handleSaveClick = () => {
        onSave(titleInput);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        }
    };

    return (
        <>
            <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border px-2 py-1 rounded w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
            />
            <Tooltip content="Simpan">
                <button onClick={handleSaveClick} className="p-1 text-green-600 hover:text-green-800">✔</button>
            </Tooltip>
        </>
    );
};

/**
 * Komponen yang merepresentasikan pin yang dibuat pengguna di peta.
 * Komponen ini mencakup penanda peta (`AdvancedMarker`) dan jendela info (`InfoWindow`)
 * yang menampilkan detail pin dan menyediakan tindakan seperti mengedit judul, menyalin info, dan menghapus.
 * Komponen ini juga mengelola state internal untuk mode edit, status penyalinan, dan animasi.
 *
 * @param {object} props - Properti komponen.
 * @param {object} props.pin - Objek data pin yang berisi `id`, `lat`, `lng`, `title`, dan `adminInfo`.
 * @param {Function} props.onDelete - Fungsi callback untuk menghapus pin, dipanggil dengan `pin.id`.
 * @param {Function} props.onUpdateTitle - Fungsi callback untuk memperbarui judul pin, dipanggil dengan `pin.id` dan judul baru.
 * @param {boolean} props.isActive - Apakah pin ini sedang aktif (dipilih).
 * @param {Function} props.onSelect - Fungsi callback untuk menangani pemilihan/pembatalan pilihan pin.
 * @param {boolean} props.isNewlyCreated - Bendera untuk menunjukkan apakah pin ini baru saja dibuat, untuk memicu animasi masuk.
 * @returns {JSX.Element} Komponen Pin.
 */
const Pin = ({ pin, onDelete, onUpdateTitle, isActive, onSelect, isNewlyCreated }) => {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [isEditing, setIsEditing] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isInfoWindowVisible, setIsInfoWindowVisible] = useState(false);

    const [runPulse, setRunPulse] = useState(false);
    const prevIsActive = useRef(isActive);

    useEffect(() => {
        if (isActive && !prevIsActive.current && !isNewlyCreated) {
            setRunPulse(true);
            const timer = setTimeout(() => setRunPulse(false), 400);
            return () => clearTimeout(timer);
        }
        prevIsActive.current = isActive;
    }, [isActive, isNewlyCreated]);

    useEffect(() => {
        if (isActive) {
            if (isNewlyCreated) {
                const timer = setTimeout(() => {
                    setIsInfoWindowVisible(true);
                }, 500);
                return () => clearTimeout(timer);
            } else {
                setIsInfoWindowVisible(true);
            }
        } else {
            setIsInfoWindowVisible(false);
        }
    }, [isActive, isNewlyCreated]);


    useEffect(() => {
        if (!isActive) {
            setIsEditing(false);
            setIsCopied(false);
        }
    }, [isActive]);

    const animationClass = isNewlyCreated
        ? 'animate-drop-in'
        : runPulse
            ? 'animate-pulse'
            : '';

    const handleDelete = useCallback(() => onDelete(pin.id), [pin.id, onDelete]);

    const handleCopy = useCallback(() => {
        const params = new URLSearchParams();
        params.set('share_lat', pin.lat.toString());
        params.set('share_lng', pin.lng.toString());
        params.set('share_title', pin.title);
        const shareUrl = `${window.location.origin}/?${params.toString()}`;

        const textParts = [pin.title];

        if (pin.adminInfo.provinsi) {
            const adminParts = [
                pin.adminInfo.provinsi.nama,
                pin.adminInfo.kab_kota.nama,
                pin.adminInfo.kecamatan.nama,
                pin.adminInfo.desa.nama,
            ].filter(Boolean);

            if (adminParts.length > 0) {
                textParts.push(`Wilayah: ${adminParts.join(', ')}`);
            }
        }

        textParts.push(
            `Latitude: ${pin.lat.toFixed(9)}`,
            `Longitude: ${pin.lng.toFixed(9)}`,
            '',
            `Tautan Berbagi: ${shareUrl}`
        );

        const textToCopy = textParts.join('\n');

        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }, [pin]);

    const handleSaveTitle = useCallback((newTitle) => {
        onUpdateTitle(pin.id, newTitle);
        setIsEditing(false);
    }, [pin.id, onUpdateTitle]);

    return (
        <>
            <AdvancedMarker
                ref={markerRef}
                position={{ lat: pin.lat, lng: pin.lng }}
                onClick={onSelect}
            >
                <div className={animationClass}>
                    <MapMarkerIcon className={isActive ? "text-red-600 drop-shadow-lg" : "text-red-500 drop-shadow"} />
                </div>
            </AdvancedMarker>
            {isInfoWindowVisible && (
                <InfoWindow
                    anchor={marker}
                    onCloseClick={onSelect}
                    disableAutoPan={true}
                >
                    <div className="p-4 pt-0 font-sans relative" style={{ minWidth: '240px' }}>
                        <div className="absolute top-0 right-2">
                            <Tooltip content="Tutup">
                                <button
                                    onClick={onSelect}
                                    className="text-gray-400 hover:text-gray-800 focus:outline-none"
                                    style={{ fontSize: '1.5rem', lineHeight: 1 }}
                                >
                                    &times;
                                </button>
                            </Tooltip>
                        </div>

                        <div className="flex items-center gap-2 mb-2 pt-3 pr-4">
                            {isEditing ? (
                                <PinTitleEditor
                                    initialTitle={pin.title}
                                    onSave={handleSaveTitle}
                                />
                            ) : (
                                <>
                                    <div className="font-bold text-base" title={pin.title}>
                                        {pin.title.length > 25
                                            ? `${pin.title.slice(0, 25)}...`
                                            : pin.title}
                                    </div>
                                    <Tooltip content="Ubah judul">
                                        <button onClick={() => setIsEditing(true)} className="p-1 text-gray-500 hover:text-gray-800">✏️</button>
                                    </Tooltip>
                                </>
                            )}
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
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleCopy}
                                className={`text-xs text-white px-3 py-1.5 rounded transition-colors ${isCopied
                                    ? 'bg-green-500 cursor-default'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                disabled={isCopied}
                            >
                                {isCopied ? 'Tersalin!' : 'Salin'}
                            </button>
                            <button onClick={handleDelete} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600">Hapus</button>
                        </div>
                    </div>
                </InfoWindow>
            )}
        </>
    );
};

export default Pin;