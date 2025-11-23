import { useState, useCallback, useEffect, useRef } from 'react';
import { AdvancedMarker, InfoWindow, useAdvancedMarkerRef, useMapsLibrary } from '@vis.gl/react-google-maps';
import Tooltip from './Tooltip';
import MapMarkerIcon from './icons/MapMarkerIcon';
import TrashIcon from './icons/TrashIcon';

/**
 * Komponen terisolasi untuk mengedit judul.
 * Mengelola state inputnya sendiri untuk mencegah re-render pada parent.
 */
const PinTitleEditor = ({ initialTitle, onSave }) => {
    const [titleInput, setTitleInput] = useState(initialTitle);

    const handleSaveClick = () => {
        const trimmedTitle = titleInput.trim();
        onSave(trimmedTitle === '' ? 'Point of Interest' : trimmedTitle);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSaveClick();
        }
    };

    return (
        <div className="flex items-center gap-2 w-full">
            <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border px-2 py-1 rounded w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
            />
            <Tooltip content="Simpan">
                <button
                    onClick={handleSaveClick}
                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 hover:text-green-700 transition-colors flex-shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </Tooltip>
        </div>
    );
};

/**
 * Komponen yang merepresentasikan pin yang dibuat pengguna di peta.
 * Komponen ini mencakup penanda peta (`AdvancedMarker`) dan jendela info (`InfoWindow`)
 * yang menampilkan detail pin dan menyediakan tindakan seperti mengedit judul, menyalin info, dan menghapus.
 * Komponen ini juga mengelola state internal untuk mode edit, status penyalinan, dan animasi.
 *
 * @param { object } props - Properti komponen.
 * @param { object } props.pin - Objek data pin yang berisi`id`, `lat`, `lng`, `title`, dan`adminInfo`.
 * @param { Function } props.onDelete - Fungsi callback untuk menghapus pin, dipanggil dengan`pin.id`.
 * @param { Function } props.onUpdateTitle - Fungsi callback untuk memperbarui judul pin, dipanggil dengan `pin.id` dan judul baru.
 * @param { Function } props.onUpdatePin - Fungsi callback untuk memperbarui properti pin lainnya (misal: address).
 * @param { boolean } props.isActive - Apakah pin ini sedang aktif(dipilih).
 * @param { Function } props.onSelect - Fungsi callback untuk menangani pemilihan / pembatalan pilihan pin.
 * @param { boolean } props.isNewlyCreated - Bendera untuk menunjukkan apakah pin ini baru saja dibuat, untuk memicu animasi masuk.
 * @param { string } [props.actionType = 'copy'] - 'copy' untuk menyalin info, 'select' untuk mengirim postMessage.
 */
const Pin = ({ pin, onDelete, onUpdateTitle, onUpdatePin, isActive, onSelect, isNewlyCreated, actionType = 'copy' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isActionSuccess, setIsActionSuccess] = useState(false);
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [animationClass, setAnimationClass] = useState('');
    const [isInfoWindowVisible, setIsInfoWindowVisible] = useState(false);
    const [address, setAddress] = useState(pin.address || null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const geocodingLib = useMapsLibrary('geocoding');
    const hasSentCreatedMessage = useRef(false);

    // Efek untuk animasi masuk saat pin baru dibuat
    useEffect(() => {
        if (isNewlyCreated) {
            setAnimationClass('animate-bounce-in');
            const timer = setTimeout(() => setAnimationClass(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [isNewlyCreated]);

    // Efek untuk menampilkan InfoWindow saat pin aktif
    useEffect(() => {
        if (isActive) {
            setIsInfoWindowVisible(true);
        } else {
            setIsInfoWindowVisible(false);
            setIsEditing(false); // Reset mode edit saat ditutup
        }
    }, [isActive]);

    // Efek untuk mengambil alamat saat pin aktif
    useEffect(() => {
        if (!geocodingLib || !isActive || address) return;

        setIsLoadingAddress(true);
        const geocoder = new geocodingLib.Geocoder();
        geocoder.geocode({ location: { lat: pin.lat, lng: pin.lng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const preferredResult = results.find(r =>
                    r.types.includes('street_address') ||
                    r.types.includes('route') ||
                    r.types.includes('premise')
                ) || results[0];

                const newAddress = preferredResult.formatted_address;
                setAddress(newAddress);
                if (onUpdatePin) {
                    onUpdatePin(pin.id, { address: newAddress });
                }
            } else {
                setAddress('Alamat tidak ditemukan');
            }
            setIsLoadingAddress(false);
        });
    }, [geocodingLib, isActive, pin.lat, pin.lng, address, onUpdatePin, pin.id]);

    // Efek untuk mengirim pesan pinCreated (hanya sekali per pin instance)
    useEffect(() => {
        // Pastikan address sudah ada DAN adminInfo sudah selesai dimuat (isLoadingAdminInfo === false)
        if (isNewlyCreated && address && pin.isLoadingAdminInfo === false && !hasSentCreatedMessage.current) {
            const pinWithAddress = { ...pin, address };
            window.parent.postMessage({
                source: 'mapIframeApp',
                type: 'pinCreated',
                payload: pinWithAddress
            }, '*');
            hasSentCreatedMessage.current = true;
        }
    }, [isNewlyCreated, address, pin, pin.isLoadingAdminInfo]);


    const handleDelete = useCallback(() => onDelete(pin.id), [pin.id, onDelete]);

    const handlePrimaryAction = useCallback(() => {
        if (actionType === "select") {
            if (address) {
                pin.address = address;
            }

            window.parent.postMessage({
                source: 'mapIframeApp',
                type: 'pinSelected', // Menggunakan tipe spesifik agar parent bisa membedakan
                payload: pin
            }, '*');

            setIsActionSuccess(true);
            setTimeout(() => setIsActionSuccess(false), 2000);

        } else {
            const params = new URLSearchParams();
            params.set('share_lat', pin.lat.toString());
            params.set('share_lng', pin.lng.toString());
            params.set('share_title', pin.title);
            const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

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

            if (address) {
                textParts.push(`Alamat: ${address}`);
            }

            textParts.push(
                `Latitude: ${pin.lat.toFixed(9)}`,
                `Longitude: ${pin.lng.toFixed(9)}`,
                '',
                `Tautan Berbagi: ${shareUrl}`
            );

            const textToCopy = textParts.join('\n');

            navigator.clipboard.writeText(textToCopy).then(() => {
                setIsActionSuccess(true);
                setTimeout(() => setIsActionSuccess(false), 2000);
            });
        }
    }, [pin, actionType, address]);

    const handleSaveTitle = useCallback((newTitle) => {
        onUpdateTitle(pin.id, newTitle);
        setIsEditing(false);
    }, [pin.id, onUpdateTitle]);

    const getButtonText = () => {
        if (actionType === 'select') {
            return isActionSuccess ? 'Terpilih!' : 'Pilih';
        }
        return isActionSuccess ? 'Tersalin!' : 'Salin';
    };

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
                    <div className="p-0 font-sans relative w-[260px]">
                        {/* Header with Title and Close Button */}
                        <div className="flex items-start justify-between p-3 pb-2">
                            <div className="flex-1 pr-6">
                                {isEditing ? (
                                    <PinTitleEditor
                                        initialTitle={pin.title}
                                        onSave={handleSaveTitle}
                                    />
                                ) : (
                                    <div className="group relative">
                                        <h3 className="font-semibold text-gray-900 text-sm leading-tight pr-5" title={pin.title}>
                                            {pin.title}
                                        </h3>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-gray-400 hover:text-blue-600"
                                            title="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                                                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                                {/* Compact Coordinates */}
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-60">
                                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.006.003.002.001.003.001a.75.75 0 00.01-.003zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span>{pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</span>
                                </div>
                            </div>
                            <Tooltip content="Tutup">
                                <button
                                    onClick={onSelect}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                </button>
                            </Tooltip>
                        </div>

                        {/* Content Body */}
                        <div className="px-3 pb-3 space-y-3">

                            {/* Admin Info - Compact Card Style */}
                            {pin.isLoadingAdminInfo ? (
                                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                                    <div className="w-3 h-3 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>
                                    <span>Memuat info wilayah...</span>
                                </div>
                            ) : pin.adminInfo && pin.adminInfo.provinsi ? (
                                <div className="bg-gray-50 rounded-md p-2 text-xs border border-gray-100">
                                    {(() => {
                                        const desa = pin.adminInfo.desa;
                                        const kec = pin.adminInfo.kecamatan;
                                        const kab = pin.adminInfo.kab_kota;
                                        const prov = pin.adminInfo.provinsi;

                                        const desaType = desa?.tipe === '1' ? 'Desa' : 'Kel.';
                                        const kabType = kab?.tipe === '4' ? 'Kab.' : 'Kota';

                                        return (
                                            <div className="flex flex-col gap-0.5">
                                                {desa && kec && (
                                                    <div className="font-medium text-gray-800">
                                                        {desaType} {desa.nama}, Kec. {kec.nama}
                                                    </div>
                                                )}
                                                {kab && prov && (
                                                    <div className="text-gray-500">
                                                        {kabType} {kab.nama}, {prov.nama}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="text-xs italic text-gray-400 py-1">
                                    Di luar batas administrasi
                                </div>
                            )}

                            {/* Address Section */}
                            {isLoadingAddress ? (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="w-3 h-3 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>
                                    <span>Mencari alamat...</span>
                                </div>
                            ) : address && (
                                <div className="flex gap-2 items-start text-xs text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0">
                                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.006.003.002.001.003.001a.75.75 0 00.01-.003zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="break-words leading-relaxed">{address}</span>
                                </div>
                            )}

                            {/* Actions Footer */}
                            <div className="flex gap-2 pt-2 mt-1">
                                <button
                                    onClick={handlePrimaryAction}
                                    disabled={isActionSuccess}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${isActionSuccess
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-blue-600 text-white border border-transparent hover:bg-blue-700 shadow-sm hover:shadow'
                                        }`}
                                >
                                    {isActionSuccess ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            {actionType === 'select' ? 'Terpilih' : 'Tersalin'}
                                        </>
                                    ) : (
                                        <>
                                            {actionType === 'select' ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                    <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                                                    <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                                                </svg>
                                            )}
                                            {actionType === 'select' ? 'Pilih' : 'Salin'}
                                        </>
                                    )}
                                </button>
                                <Tooltip content="Hapus Pin">
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center justify-center px-3 py-1.5 rounded text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div >
                </InfoWindow >
            )}
        </>
    );
};

export default Pin;