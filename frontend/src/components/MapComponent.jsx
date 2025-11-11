import { useEffect, useRef, useState } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import { useBoundaryData } from '../hooks/useBoundaryData';
import { stringToHslColor } from '../utils/mapUtils';
import MapLabel from './MapLabel';
import Pin from './Pin';
import TicketPin from './TicketPin';
import ClusterPin from './ClusterPin';
import { ACTION_SIDEBAR_WIDTH, REGION_INFO_SIDEBAR_WIDTH } from '../constants/layout';

/**
 * Komponen rendering peta utama untuk aplikasi.
 * Bertanggung jawab untuk menampilkan Google Map, me-render batas GeoJSON,
 * menangani interaksi pengguna (klik, hover), dan menampilkan berbagai penanda peta
 * seperti pin, tiket, dan kluster. Menerima sejumlah besar properti untuk mengelola
 * state-nya yang kompleks, yang dikendalikan oleh komponen induk `MapPage`.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.isRegionSidebarOpen - Bendera yang menunjukkan jika sidebar info wilayah terbuka, digunakan untuk menghitung padding peta.
 * @param {boolean} props.isTouchDevice - Bendera yang menunjukkan jika pengguna menggunakan perangkat layar sentuh.
 * @param {object} props.selection - Objek yang merepresentasikan wilayah administratif yang saat ini dipilih.
 * @param {boolean} props.isNavigating - Bendera untuk menonaktifkan interaksi sementara selama pergerakan peta terprogram.
 * @param {Function} [props.onInfoChange] - Callback untuk meneruskan informasi tentang wilayah yang ditampilkan saat ini ke induk.
 * @param {Function} [props.onSelectionChange] - Callback untuk memperbarui wilayah yang dipilih.
 * @param {string} props.mapViewMode - Mode tampilan peta saat ini ('drill-down' atau 'region-only').
 * @param {Function} [props.onSubRegionClick] - Callback untuk saat sub-wilayah diklik dalam mode 'drill-down'.
 * @param {Function} [props.onRegionClick] - Callback untuk saat wilayah utama diklik dalam mode 'region-only'.
 * @param {boolean} props.isPinningMode - Bendera yang menunjukkan jika pengguna sedang dalam proses menambahkan pin baru.
 * @param {Function} [props.onAddPin] - Callback untuk menambahkan pin baru ke peta.
 * @param {Array<object>} [props.pins] - Array objek pin buatan pengguna untuk ditampilkan.
 * @param {Function} [props.onDeletePin] - Callback untuk menghapus pin.
 * @param {Function} [props.onUpdatePinTitle] - Callback untuk memperbarui judul pin.
 * @param {string|null} props.activePinId - ID pin yang saat ini aktif (dipilih).
 * @param {Function} [props.onActivePinChange] - Callback untuk mengubah pin aktif.
 * @param {string|null} props.newlyCreatedPinId - ID pin yang baru saja dibuat, digunakan untuk memicu animasi.
 * @param {Function} [props.onMapClick] - Callback umum untuk setiap klik pada kanvas peta atau fitur GeoJSON.
 * @param {Function} [props.onMapLoad] - Callback yang meneruskan instance `google.maps.Map` ke induk setelah tersedia.
 * @param {boolean} props.isBoundaryTransparent - Bendera untuk mengontrol opasitas batas GeoJSON.
 * @param {Array<object>} [props.tickets] - Array objek tiket atau kluster untuk ditampilkan di peta.
 * @param {string|null} props.activeTicketId - ID tiket yang saat ini aktif (dipilih).
 * @param {Function} [props.onActiveTicketChange] - Callback untuk mengubah tiket aktif.
 * @param {object|null} props.activeTicketDetails - Informasi detail untuk tiket aktif.
 * @param {boolean} props.isTicketDetailLoading - Bendera yang menunjukkan jika detail tiket aktif sedang dimuat.
 * @param {Error|null} props.ticketDetailError - Objek error jika pengambilan detail tiket gagal.
 * @returns {JSX.Element} Komponen MapComponent.
 */
const MapComponent = ({
    isRegionSidebarOpen,
    isTouchDevice,
    selection,
    isNavigating,
    onInfoChange = () => {},
    onSelectionChange = () => {},
    mapViewMode,
    onSubRegionClick = () => {},
    onRegionClick = () => {},
    isPinningMode,
    onAddPin = () => {},
    pins = [],
    onDeletePin = () => {},
    onUpdatePinTitle = () => {},
    activePinId,
    onActivePinChange = () => {},
    newlyCreatedPinId,
    onMapClick = () => {},
    onMapLoad = () => {},
    isBoundaryTransparent,
    tickets = [],
    activeTicketId,
    onActiveTicketChange = () => {},
    activeTicketDetails,
    isTicketDetailLoading,
    ticketDetailError
}) => {
    const map = useMap();
    const [labels, setLabels] = useState([]);

    useEffect(() => {
        if (map && onMapLoad) {
            onMapLoad(map);
        }
    }, [map, onMapLoad]);

    const { data: provinsiData } = useBoundaryData({ level: 'provinsi' });
    const { data: kabkotaData } = useBoundaryData({ level: 'kabkota', provinceCode: selection.provinceCode });
    const { data: kecamatanData } = useBoundaryData({ level: 'kecamatan', provinceCode: selection.provinceCode, kabkotaCode: selection.kabkotaCode });
    const { data: desaData } = useBoundaryData({ level: 'desa', provinceCode: selection.provinceCode, kabkotaCode: selection.kabkotaCode, kecamatanCode: selection.kecamatanCode });
    const hoveredFeatureRef = useRef(null);


    useEffect(() => {
        if (!map || isNavigating) return;
        const gestureHandling = isTouchDevice ? 'cooperative' : 'greedy';
        map.setOptions({ gestureHandling });
    }, [map, isTouchDevice, isNavigating]);


    useEffect(() => {
        if (!map || !provinsiData.length) return;

        map.data.forEach(feature => map.data.remove(feature));
        const newLabels = [];
        const masterBounds = new google.maps.LatLngBounds();

        const renderFeature = (featureData, styleOptions, labelProperty) => {
            const finalStyle = { ...styleOptions, clickable: !isPinningMode };
            const addedFeatures = map.data.addGeoJson(featureData, { idPropertyName: 'id' });
            if (addedFeatures && addedFeatures.length > 0) {
                const feature = addedFeatures[0];
                feature.setProperty('originalStyle', styleOptions);
                map.data.overrideStyle(feature, finalStyle);

                const bounds = new google.maps.LatLngBounds();
                const geometry = feature.getGeometry();
                if (geometry) {
                    geometry.forEachLatLng(latLng => bounds.extend(latLng));
                    masterBounds.union(bounds);

                    if (labelProperty && featureData.properties?.[labelProperty]) {
                        const uniqueKey = String(featureData.properties.id || `${labelProperty}-${Math.random()}`);
                        newLabels.push({
                            id: uniqueKey,
                            position: bounds.getCenter(),
                            text: String(featureData.properties[labelProperty]),
                            color: String(styleOptions.strokeColor || styleOptions.fillColor || '#1f2937')
                        });
                    }
                }
            }
        };

        let mainFeature = null;
        let subFeatures = [];
        let mainFeatureLevel = null;

        if (selection.desaName && selection.kecamatanCode) {
            mainFeature = desaData.find(f => f.properties.kode_kec === selection.kecamatanCode && f.properties.nama === selection.desaName);
            mainFeatureLevel = 'desa';
        } else if (selection.kecamatanCode) {
            mainFeature = kecamatanData.find(f => f.properties.kode_kec === selection.kecamatanCode);
            mainFeatureLevel = 'kecamatan';
            subFeatures = desaData.filter(f => f.properties.kode_kec === selection.kecamatanCode);
        } else if (selection.kabkotaCode) {
            mainFeature = kabkotaData.find(f => f.properties.kode_kab === selection.kabkotaCode);
            mainFeatureLevel = 'kabkota';
            subFeatures = kecamatanData.filter(f => f.properties.kode_kab === selection.kabkotaCode);
        } else if (selection.provinceCode) {
            mainFeature = provinsiData.find(f => f.properties.kode_prov === selection.provinceCode);
            mainFeatureLevel = 'provinsi';
            subFeatures = kabkotaData.filter(f => f.properties.kode_prov === selection.provinceCode);
        } else {
            subFeatures = provinsiData;
            mainFeatureLevel = 'negara';
        }

        if (mapViewMode === 'region-only' && mainFeature) {
            renderFeature(mainFeature, { strokeColor: '#14B8A6', fillColor: '#14B8A6', fillOpacity: 0.2, strokeWeight: 2.5, zIndex: 1 }, 'nama');
        } else {
            subFeatures.forEach(sub => {
                const color = stringToHslColor(sub.properties.nama);
                const style = mainFeatureLevel === 'negara'
                    ? { fillColor: color, fillOpacity: 0.6, strokeWeight: 0, zIndex: 1 }
                    : { strokeColor: color, fillColor: color, fillOpacity: 0.25, strokeWeight: 1.5, zIndex: 2 };
                renderFeature(sub, style, 'nama');
            });
        }

        if (mainFeature) {
            onInfoChange({ properties: mainFeature.properties, level: mainFeatureLevel });
        } else {
            onInfoChange({ properties: { name: 'Indonesia', jumlahProvinsi: provinsiData.length }, level: 'negara' });
        }

        if (!masterBounds.isEmpty()) {
            const padding = {
                left: ACTION_SIDEBAR_WIDTH + (isRegionSidebarOpen ? REGION_INFO_SIDEBAR_WIDTH : 0) + 20,
                right: 20,
                top: 20,
                bottom: 20
            };
            map.fitBounds(masterBounds, padding);
        }
        setLabels(newLabels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, selection, provinsiData, kabkotaData, kecamatanData, desaData, onInfoChange]);


    useEffect(() => {
        if (!map) return;
        map.setOptions({ draggableCursor: isPinningMode ? 'crosshair' : null });
        map.data.forEach((feature) => {
            const originalStyle = feature.getProperty('originalStyle');
            if (originalStyle) {
                const isInteractive = !isPinningMode && !isBoundaryTransparent;
                const newOpacity = isBoundaryTransparent ? 0.1 : originalStyle.fillOpacity;
                map.data.overrideStyle(feature, { ...originalStyle, clickable: isInteractive, fillOpacity: newOpacity, });
            }
        });
    }, [map, isPinningMode, isBoundaryTransparent]);


    useEffect(() => {
        if (!map) return;
        const mouseoverListener = map.data.addListener('mouseover', (e) => {
            if (mapViewMode === 'region-only' || hoveredFeatureRef.current) return;
            const originalStyle = e.feature.getProperty('originalStyle');
            map.data.overrideStyle(e.feature, { ...originalStyle, fillOpacity: 0.8, zIndex: 100 });
            hoveredFeatureRef.current = e.feature;
        });
        const mouseoutListener = map.data.addListener('mouseout', () => {
            if (hoveredFeatureRef.current) {
                map.data.overrideStyle(hoveredFeatureRef.current, hoveredFeatureRef.current.getProperty('originalStyle'));
                hoveredFeatureRef.current = null;
            }
        });
        const clickListener = map.data.addListener('click', (e) => {
            onMapClick?.();
            if (isPinningMode) return;
            if (mapViewMode === 'region-only') { onRegionClick(e); return; }
            if (mapViewMode === 'drill-down') {
                const props = {};
                e.feature.forEachProperty((value, property) => { props[property] = value; });
                onSubRegionClick(props, e.latLng);
            }
        });
        const mapClickListener = map.addListener('click', (e) => {
            onMapClick?.();
            if (isPinningMode) { onAddPin(e); }
        });
        return () => {
            google.maps.event.removeListener(mouseoverListener);
            google.maps.event.removeListener(mouseoutListener);
            google.maps.event.removeListener(clickListener);
            google.maps.event.removeListener(mapClickListener);
        };
    }, [map, selection, onSelectionChange, isPinningMode, onAddPin, onMapClick, mapViewMode, onSubRegionClick, onRegionClick]);


    return (
        <>
            <Map
                defaultCenter={{ lat: -2.548926, lng: 118.0148634 }}
                defaultZoom={5}
                mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "e9f5b765b262e391"}
                mapTypeControl={false}
                streetViewControl={false}
                fullscreenControl={false}
                zoomControl={false}
                className="h-full w-full"
            />
            {labels.map(label => (
                <MapLabel key={label.id} position={label.position} text={label.text} color={label.color} />
            ))}
            {pins.map(pin => {
                const isActive = pin.id === activePinId;
                const handleSelect = () => onActivePinChange(isActive ? null : pin.id);
                return (
                    <Pin
                        key={pin.id}
                        pin={pin}
                        onDelete={onDeletePin}
                        onUpdateTitle={onUpdatePinTitle}
                        isActive={isActive}
                        onSelect={handleSelect}
                        isNewlyCreated={pin.id === newlyCreatedPinId}
                    />
                );
            })}

            {mapViewMode === 'region-only' && tickets.map(item => {
                // Jika tipe adalah 'cluster', render komponen ClusterPin
                if (item.type === 'cluster') {
                    return (
                        <ClusterPin
                            key={`cluster-${item.lat}-${item.lng}`}
                            count={item.count}
                            lat={item.lat}
                            lng={item.lng}
                        />
                    );
                }
                // Jika tipe adalah 'point', render komponen TicketPin yang sudah ada
                if (item.type === 'point') {
                    if (!item.coordinates) return null;
                    const isActive = item.id === activeTicketId;
                    const handleSelect = () => onActiveTicketChange(isActive ? null : item.id);
                    return (
                        <TicketPin
                            key={item.id}
                            lat={item.coordinates.lat}
                            lng={item.coordinates.lng}
                            status={item.status}
                            isActive={isActive}
                            onSelect={handleSelect}
                            details={isActive ? activeTicketDetails : null}
                            isLoadingDetails={isActive && isTicketDetailLoading}
                            errorDetails={isActive ? ticketDetailError : null}
                        />
                    );
                }
                return null;
            })}
        </>
    );
};
export default MapComponent;
