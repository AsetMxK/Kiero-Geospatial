import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import SearchBar from '../components/SearchBar';
import { findRegionByPoint } from '../utils/geoApiService';
import { usePrefixSearch } from '../hooks/usePrefixSearch';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorModal from '../components/ErrorModal';
import TemporaryPin from '../components/IframePin';

/**
 * Komponen "headless" yang digunakan untuk mendapatkan instance peta dari konteks
 * `@vis.gl/react-google-maps` dan meneruskannya ke komponen induk.
 * @param {object} props - Properti komponen.
 * @param {Function} props.setMapInstance - Callback untuk mengatur instance peta di state induk.
 * @returns {null} Komponen ini tidak me-render apa pun.
 */
const MapInstanceController = ({ setMapInstance }) => {
    const map = useMap();
    useEffect(() => {
        if (map) setMapInstance(map);
    }, [map, setMapInstance]);
    return null;
};

/**
 * Komponen halaman peta mandiri yang dirancang khusus untuk disematkan dalam iframe.
 * * !!! CATATAN !!!
 * Berbeda dengan 'IframeMapPage.jsx', halaman ini *tidak* melakukan alur
 * otentikasi 'authenticateWithAssertion'. Halaman ini mengasumsikan bahwa ia
 * disematkan dalam aplikasi "milik sendiri" (first-party) dan
 * alur otentikasi klien utama (melalui apiClient) sudah aktif.
 *
 * Halaman ini masih mendengarkan pesan 'init' dari parent, tetapi hanya sebagai
 * sinyal "handshake" untuk memulai, bukan untuk menerima token.
 *
 * @param {object} props - Properti komponen.
 * @param {string} [props.width='100vw'] - Lebar kontainer peta.
 * @param {string} [props.height='100vh'] - Tinggi kontainer peta.
 * @param {string} [props.className=''] - Nama kelas CSS tambahan untuk kontainer.
 * @returns {JSX.Element} Komponen halaman peta iframe.
 */
const IframeMapPageClientAuth = ({ width = '100vw', height = '100vh', className = '' }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const [mapInstance, setMapInstance] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(true); // Tetap gunakan ini untuk menunggu 'init'
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activePin, setActivePin] = useState(null);
    const [panToTarget, setPanToTarget] = useState(null);
    const [phoneNumberToSearch, setPhoneNumberToSearch] = useState(null);
    const [error, setError] = useState(null);

    const { data: prefixData, loading: prefixLoading, error: prefixError } = usePrefixSearch(phoneNumberToSearch);

    // Effect to draw GeoJSON 
    useEffect(() => {
        if (!mapInstance) return;
        mapInstance.data.forEach(feature => mapInstance.data.remove(feature));

        if (geoJsonData?.features?.length) {
            const features = mapInstance.data.addGeoJson(geoJsonData);
            mapInstance.data.setStyle({ fillColor: '#14B8A6', fillOpacity: 0.3, strokeColor: '#14B8A6', strokeWeight: 2, clickable: true });
            const bounds = new window.google.maps.LatLngBounds();
            features.forEach(f => f.getGeometry()?.forEachLatLng(latLng => bounds.extend(latLng)));
            if (!bounds.isEmpty()) mapInstance.fitBounds(bounds, 50);
        }
    }, [mapInstance, geoJsonData]);

    // Handler for map data layer click to create a pin 
    const handleGeoJsonClick = useCallback(async (e) => {
        const latLng = e.latLng;
        if (!latLng) return;

        try {
            const adminInfo = await findRegionByPoint(latLng.lat(), latLng.lng());
            const pinData = {
                lat: latLng.lat(),
                lng: latLng.lng(),
                adminInfo: adminInfo
            };
            setActivePin(pinData);

            setPanToTarget({ lat: pinData.lat, lng: pinData.lng, zoom: 15 });

            window.parent.postMessage({
                source: 'mapIframeApp',
                type: 'pinCreated',
                payload: pinData
            }, '*');

        } catch (error) {
            console.error("Failed to get admin info for pin:", error);
        }
    }, []);

    // Effect to add/remove the click listener on the data layer 
    useEffect(() => {
        if (!mapInstance) return;

        const clickListener = mapInstance.data.addListener('click', handleGeoJsonClick);

        return () => {
            clickListener.remove();
        };
    }, [mapInstance, handleGeoJsonClick]);

    // Logika PanTo 
    const panToWithOffset = useCallback((target, zoom) => {
        if (!mapInstance) return;
        const totalOffset = 0;
        const projection = mapInstance.getProjection();
        if (!projection) {
            setTimeout(() => panToWithOffset(target, zoom), 100);
            return;
        }
        const targetPoint = projection.fromLatLngToPoint(new window.google.maps.LatLng(target.lat, target.lng));
        const targetZoom = zoom || mapInstance.getZoom();
        const scale = Math.pow(2, targetZoom);
        const newCenterPoint = new window.google.maps.Point(
            targetPoint.x - (totalOffset / scale),
            targetPoint.y
        );
        const newCenterLatLng = projection.fromPointToLatLng(newCenterPoint);

        mapInstance.panTo(newCenterLatLng);

        if (zoom && mapInstance.getZoom() < zoom) {
            mapInstance.setZoom(zoom);
        }
    }, [mapInstance]);

    useEffect(() => {
        if (panToTarget && mapInstance) {
            panToWithOffset(panToTarget, panToTarget.zoom);
            setPanToTarget(null); // Reset target setelah pan
        }
    }, [panToTarget, mapInstance, panToWithOffset]);

    // Effect to handle all messages from parent
    useEffect(() => {

        window.parent.postMessage({
            source: 'mapIframeApp',
            type: 'iframeReady'
        }, '*');


        const handleMessage = async (event) => {
            const { action, payload } = event.data;

            if (action === 'init') {
                setIsAuthenticated(true);
                window.parent.postMessage({ source: 'mapIframeApp', type: 'initialized' }, '*');
                setIsAuthenticating(false);

            } else if (action === 'searchPrefix') {
                setGeoJsonData(null);
                setActivePin(null);
                setPhoneNumberToSearch(payload.phoneNumber);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        setIsLoading(prefixLoading);
    }, [prefixLoading]);

    useEffect(() => {
        if (prefixData) {
            if (prefixData.coverage?.geoJson) {
                setGeoJsonData(prefixData.coverage.geoJson);
            }
            window.parent.postMessage({
                source: 'mapIframeApp',
                type: 'regionDataLoaded',
                payload: { matchedPrefix: prefixData.matchedPrefix, regions: prefixData.coverage.regions }
            }, '*');
            setPhoneNumberToSearch(null); // Reset pencarian
        }
    }, [prefixData]);

    useEffect(() => {
        if (prefixError) {
            console.error('Error searching prefix:', prefixError);
            window.parent.postMessage({ source: 'mapIframeApp', type: 'error', payload: { message: prefixError.message } }, '*');
            setPhoneNumberToSearch(null); // Reset pencarian
        }
    }, [prefixError]);

    const handlePlaceSelect = async (place) => {
        if (!place?.geometry?.location) return setError("Hasil pencarian tidak valid.");
        setIsLoading(true);
        setActivePin(null);
        try {
            const { lat, lng } = place.geometry.location;
            const adminInfo = await findRegionByPoint(lat(), lng());
            if (!adminInfo?.geoJson) throw new Error("Tidak dapat menemukan data wilayah.");
            setGeoJsonData({
                type: 'FeatureCollection', features: [{
                    type: 'Feature',
                    geometry: adminInfo.geoJson,
                    properties: { name: adminInfo.desa?.nama || adminInfo.kecamatan?.nama || adminInfo.kab_kota?.nama }
                }]
            });
        } catch (error) {
            console.error("Gagal memproses hasil pencarian:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!apiKey) {
        return <div className="w-screen h-screen flex items-center justify-center">API Key for Google Maps not found.</div>;
    }

    return (
        <APIProvider apiKey={apiKey} libraries={['places', 'geometry']} language="id">
            <main
                style={{ width, height }}
                className={`relative bg-gray-100 ${className}`}
            >
                {error && <ErrorModal message={error} onClose={() => setError(null)} />}
                
                {isAuthenticating && <LoadingOverlay text="Menunggu koneksi..." />} 
                
                <div className={`absolute top-4 left-4 z-10 w-96 ${!isAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>
                    <SearchBar onPlaceSelect={handlePlaceSelect} />
                </div>
                {isLoading && <LoadingOverlay text="Searching..." />}
                <Map
                    defaultCenter={{ lat: -2.548926, lng: 118.0148634 }}
                    defaultZoom={5}
                    mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "e9f5b765b262e391"}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    className="h-full w-full"
                >
                    <MapInstanceController setMapInstance={setMapInstance} />
                    {activePin && (
                        <TemporaryPin
                            key={`${activePin.lat}-${activePin.lng}`}
                            pin={activePin}
                        />
                    )}
                </Map>
            </main>
        </APIProvider>
    );
};

export default IframeMapPageClientAuth;