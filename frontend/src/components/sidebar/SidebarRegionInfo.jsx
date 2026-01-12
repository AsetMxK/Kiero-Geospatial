import React, { useState, useRef } from 'react';
import TabButton from '../TabButton';
import Statistics from '../Statistics';
import Tooltip from '../Tooltip';
import { stringToHslColor } from '../../utils/mapUtils';

// Local Icons
const ShareIcon = () => (
    <svg width="24" height="24" viewBox="-1 0 26 26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g transform="translate(-312.000000, -726.000000)" fill="currentColor">
                <path d="M331,750 C329.343,750 328,748.657 328,747 C328,745.343 329.343,744 331,744 C332.657,744 334,745.343 334,747 C334,748.657 332.657,750 331,750 L331,750 Z M317,742 C315.343,742 314,740.657 314,739 C314,737.344 315.343,736 317,736 C318.657,736 320,737.344 320,739 C320,740.657 318.657,742 317,742 L317,742 Z M331,728 C332.657,728 334,729.343 334,731 C334,732.657 332.657,734 331,734 C329.343,734 328,732.657 328,731 C328,729.343 329.343,728 331,728 L331,728 Z M331,742 C329.23,742 327.685,742.925 326.796,744.312 L321.441,741.252 C321.787,740.572 322,739.814 322,739 C322,738.497 321.903,738.021 321.765,737.563 L327.336,734.38 C328.249,735.37 329.547,736 331,736 C333.762,736 336,733.762 336,731 C336,728.238 333.762,726 331,726 C328.238,726 326,728.238 326,731 C326,731.503 326.097,731.979 326.235,732.438 L320.664,735.62 C319.751,734.631 318.453,734 317,734 C314.238,734 312,736.238 312,739 C312,741.762 314.238,744 317,744 C318.14,744 319.179,743.604 320.02,742.962 L320,743 L326.055,746.46 C326.035,746.64 326,746.814 326,747 C326,749.762 328.238,752 331,752 C333.762,752 336,749.762 336,747 C336,744.238 333.762,742 331,742 L331,742 Z"></path>
            </g>
        </g>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SidebarRegionInfo = ({
    isMobile,
    regionData,
    activeRegionInfoTab,
    setActiveRegionInfoTab,
    dateRange
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [copyError, setCopyError] = useState(false);
    const copyTimeoutRef = useRef(null);

    const headerColor = regionData?.properties?.nama ? stringToHslColor(regionData.properties.nama) : 'white';

    const getRegionCodeForStats = () => {
        if (!regionData) return null;
        const { properties, level } = regionData;
        switch (level) {
            case 'provinsi': return properties.kode_prov;
            case 'kabkota': return properties.kode_kab;
            case 'kecamatan': return properties.kode_kec;
            case 'desa': return `${properties.kode_kec}-${properties.nama}`;
            default: return null;
        }
    };

    const getTipeAdmin = (tipe_adm) => ({ '1': 'Desa', '2': 'Kelurahan', '4': 'Kabupaten', '5': 'Kota' }[String(tipe_adm)] || 'Lainnya');
    const formatArea = (area) => !area || isNaN(Number(area)) ? 'N/A' : `${Number(area).toFixed(2)} Ha`;

    const resetCopyStatus = () => {
        setIsCopied(false);
        setCopyError(false);
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
            copyTimeoutRef.current = null;
        }
    };

    const handleShare = () => {
        resetCopyStatus();
        const url = window.location.href;
        try {
            const tempInput = document.createElement('textarea');
            tempInput.value = url;
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            setIsCopied(true);
            copyTimeoutRef.current = setTimeout(resetCopyStatus, 2000);
        } catch {
            setCopyError(true);
            copyTimeoutRef.current = setTimeout(resetCopyStatus, 2000);
        }
    };

    if (!regionData) return null;

    const { properties, level } = regionData;
    let title, subTitle;
    const rows = [];

    switch (level) {
        case 'negara': title = properties.name; subTitle = 'Negara'; break;
        case 'provinsi':
            title = properties.nama; subTitle = 'Provinsi';
            rows.push({ label: 'Kode Provinsi', value: properties.kode_prov });
            rows.push({ label: 'Jumlah Kab/Kota', value: properties.jumlahKabKota });
            break;
        case 'kabkota':
            title = properties.nama; subTitle = getTipeAdmin(properties.tipe_adm);
            rows.push({ label: 'Provinsi', value: properties.provinsi });
            rows.push({ label: 'Kode Kab/Kota', value: properties.kode_kab });
            rows.push({ label: 'Jumlah Kecamatan', value: properties.jumlahKecamatan });
            rows.push({ label: 'Luas', value: formatArea(properties.luas) });
            break;
        case 'kecamatan':
            title = properties.nama; subTitle = 'Kecamatan';
            rows.push({ label: 'Kab/Kota', value: properties.kabkota });
            rows.push({ label: 'Provinsi', value: properties.provinsi });
            rows.push({ label: 'Kode Kecamatan', value: properties.kode_kec });
            rows.push({ label: 'Jumlah Desa', value: properties.jumlahDesa });
            break;
        case 'desa':
            title = properties.nama; subTitle = getTipeAdmin(properties.tipe_adm);
            rows.push({ label: 'Kecamatan', value: properties.kecamatan });
            rows.push({ label: 'Kab/Kota', value: properties.kabkota });
            rows.push({ label: 'Provinsi', value: properties.provinsi });
            rows.push({ label: 'Luas', value: formatArea(properties.luas) });
            break;
    }

    return (
        <>
            <div style={{ backgroundColor: headerColor }} className="p-4 text-white relative">
                <div className={isMobile ? "mt-2" : "mt-4 pt-36"}>
                    <h3 className="text-2xl font-bold truncate">{title}</h3>
                    <p className="text-lg opacity-90">{subTitle}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white">
                <div className="flex">
                    <TabButton text="Statistik Ticket" isActive={activeRegionInfoTab === 'stats'} onClick={() => setActiveRegionInfoTab('stats')} />
                    <TabButton text="Informasi Region" isActive={activeRegionInfoTab === 'info'} onClick={() => setActiveRegionInfoTab('info')} />
                </div>
            </div>

            <div className="bg-white p-4 overflow-y-auto custom-scrollbar flex-grow">
                {activeRegionInfoTab === 'stats' && (
                    <Statistics regionCode={getRegionCodeForStats()} dateRange={dateRange} />
                )}
                {activeRegionInfoTab === 'info' && (
                    <ul className="divide-y divide-gray-200">
                        {rows.map(row => (
                            <li key={row.label} className="py-2 flex justify-between items-center text-sm">
                                <span className="text-gray-600">{row.label}</span>
                                <strong className="text-gray-800 text-right">{row.value ?? 'N/A'}</strong>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="p-2 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end gap-1">
                    <Tooltip content="Salin URL Peta">
                        <button
                            onClick={handleShare}
                            className={`p-2 rounded-md focus:outline-none active:bg-gray-300 transition-all duration-200 ${isCopied
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : copyError
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                            aria-label="Bagikan"
                        >
                            {isCopied ? <CheckIcon /> : copyError ? <ErrorIcon /> : <ShareIcon />}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </>
    );
};

export default SidebarRegionInfo;
