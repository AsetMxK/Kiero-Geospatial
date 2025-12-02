import React, { useState, useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import LayerIcon from './icons/LayerIcon';

const MapLayerControl = ({ mapLayer, onMapLayerChange, isStreetViewVisible, onStreetViewVisibilityChange, style }) => {
    const map = useMap();
    const [isHovered, setIsHovered] = useState(false);
    const [mapPreviewUrl, setMapPreviewUrl] = useState('');

    // Update preview image when map moves
    useEffect(() => {
        if (!map) return;

        const updatePreview = () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            if (center && zoom) {
                const lat = center.lat();
                const lng = center.lng();
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                // Use the CURRENT map layer for the preview as requested ("representasi dari map yang terlihat sekarang")
                const type = mapLayer === 'default' ? 'roadmap' : 'satellite';
                // Add style to hide labels (clean map)
                const style = '&style=feature:all|element:labels|visibility:off';
                const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=1000x1000&maptype=${type}${style}&key=${apiKey}`;
                setMapPreviewUrl(url);
            }
        };

        // Initial update
        updatePreview();

        // Listen for map moves (debounce could be added if needed, but 'idle' is good)
        const listener = map.addListener('idle', updatePreview);

        return () => {
            if (listener) listener.remove();
        };
    }, [map, mapLayer]);

    const handleToggleMap = () => {
        onMapLayerChange(mapLayer === 'default' ? 'satellite' : 'default');
    };

    const handleToggleStreetView = (e) => {
        e.stopPropagation();
        onStreetViewVisibilityChange(!isStreetViewVisible);
    };

    return (
        <div
            className="absolute bottom-4 z-10 pointer-events-auto flex items-end gap-2"
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main Toggle Button */}
            <button
                onClick={handleToggleMap}
                className={`
                    relative w-20 h-20 rounded-xl shadow-md border-2 border-white overflow-hidden transition-all duration-300
                    hover:shadow-lg focus:outline-none ring-0 group
                `}
                title={mapLayer === 'default' ? "Ganti ke Satelit" : "Ganti ke Peta"}
            >
                {/* Background Preview (Shows current active map type) */}
                <div className="absolute inset-0 transition-opacity duration-300">
                    {mapPreviewUrl && (
                        <img
                            src={mapPreviewUrl}
                            alt="Map Preview"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10">
                    {/* Normal State: Icon + "Lapisan" at bottom */}
                    <div className={`absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="p-0.5">
                            {/* Reduced icon size to w-2.5 h-2.5 */}
                            <LayerIcon className={`w-4 h-4 ${mapLayer === 'satellite' ? 'text-white' : 'text-gray-900'}`} />
                        </div>
                        {/* Text color logic: Map -> Black, Satellite -> White */}
                        <span className={`text-[10px] font-medium ${mapLayer === 'default' ? 'text-gray-900 drop-shadow-sm' : 'text-white drop-shadow-md'}`}>
                            Lapisan
                        </span>
                    </div>

                    {/* Hover State: Active Map Name */}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <span className={`text-xs font-semibold ${mapLayer === 'default' ? 'text-gray-900' : 'text-white'} drop-shadow-md`}>
                            {mapLayer === 'default' ? 'Peta' : 'Satelit'}
                        </span>
                    </div>
                </div>
            </button>

            {/* Side Panel (Appears on Hover) */}
            <div
                className={`
                    bg-white rounded-lg shadow-xl p-2 border border-gray-100
                    transition-all duration-300 origin-bottom-left
                    ${isHovered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 pointer-events-none'}
                `}
            >
                <div className="flex flex-col gap-1 min-w-[120px]">
                    <span className="text-xs font-semibold text-gray-500 px-2 mb-1">Detail Peta</span>
                    <button
                        onClick={handleToggleStreetView}
                        className={`
                            flex items-center gap-3 p-2 rounded-md text-sm font-medium transition-colors w-full text-left
                            ${isStreetViewVisible ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        <span className="text-lg">🚶</span>
                        Street View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapLayerControl;
