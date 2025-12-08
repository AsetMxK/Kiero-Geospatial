import { useState, useRef } from 'react';
import CustomSelectDropdown from './CustomSelectDropdown';
import Statistics from './Statistics';
import SidebarToggleButton from './SidebarToggleButton';
import Tooltip from './Tooltip';
import TrashIcon from './icons/TrashIcon';
import GoToIcon from './icons/GoToIcon';
import { useBoundaryData } from '../hooks/useBoundaryData';
import { stringToHslColor } from '../utils/mapUtils';
import { REGION_INFO_SIDEBAR_WIDTH } from '../constants/layout';

/**
 * Komponen ikon "Bagikan".
 * @returns {JSX.Element} Elemen SVG untuk ikon bagikan.
 */
const ShareIcon = () => (
    <svg width="24" height="24" viewBox="-1 0 26 26" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g transform="translate(-312.000000, -726.000000)" fill="currentColor">
                <path d="M331,750 C329.343,750 328,748.657 328,747 C328,745.343 329.343,744 331,744 C332.657,744 334,745.343 334,747 C334,748.657 332.657,750 331,750 L331,750 Z M317,742 C315.343,742 314,740.657 314,739 C314,737.344 315.343,736 317,736 C318.657,736 320,737.344 320,739 C320,740.657 318.657,742 317,742 L317,742 Z M331,728 C332.657,728 334,729.343 334,731 C334,732.657 332.657,734 331,734 C329.343,734 328,732.657 328,731 C328,729.343 329.343,728 331,728 L331,728 Z M331,742 C329.23,742 327.685,742.925 326.796,744.312 L321.441,741.252 C321.787,740.572 322,739.814 322,739 C322,738.497 321.903,738.021 321.765,737.563 L327.336,734.38 C328.249,735.37 329.547,736 331,736 C333.762,736 336,733.762 336,731 C336,728.238 333.762,726 331,726 C328.238,726 326,728.238 326,731 C326,731.503 326.097,731.979 326.235,732.438 L320.664,735.62 C319.751,734.631 318.453,734 317,734 C314.238,734 312,736.238 312,739 C312,741.762 314.238,744 317,744 C318.14,744 319.179,743.604 320.02,742.962 L320,743 L326.055,746.46 C326.035,746.64 326,746.814 326,747 C326,749.762 328.238,752 331,752 C333.762,752 336,749.762 336,747 C336,744.238 333.762,742 331,742 L331,742 Z"></path>
            </g>
        </g>
    </svg>
);

/**
 * Komponen tombol tab sederhana yang digunakan di dalam sidebar.
 *
 * @param {object} props - Properti komponen.
 * @param {string} props.text - Teks yang akan ditampilkan pada tombol.
 * @param {boolean} props.isActive - Apakah tab ini sedang aktif.
 * @param {Function} props.onClick - Fungsi callback yang akan dipanggil saat tombol diklik.
 * @returns {JSX.Element} Komponen tombol tab.
 */
const TabButton = ({ text, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`
            relative px-4 py-3 text-sm font-medium transition-all duration-200
            ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}
        `}
    >
        {text}
        {isActive && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full animate-in fade-in zoom-in-x duration-200" />
        )}
    </button>
);

/**
 * Komponen sidebar terpadu yang dapat menampilkan beberapa tampilan konten yang berbeda
 * (`admin`, `regionInfo`, `history`) tergantung pada prop `activeView`.
 * Komponen ini mengelola state internal untuk setiap tampilan dan menangani logika rendering.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.isOpen - Apakah sidebar harus ditampilkan (dikontrol oleh `ActionSidebar`).
 * @param {boolean} props.isHidden - Apakah sidebar disembunyikan (dikontrol oleh `SidebarToggleButton`).
 * @param {Function} props.onToggleVisibility - Fungsi callback untuk mengubah visibilitas (sembunyi/tampil).
 * @param {'admin'|'regionInfo'|'history'|null} props.activeView - Tampilan konten yang akan di-render di dalam sidebar.
 * @param {object} props.currentSelection - Objek seleksi wilayah saat ini untuk tampilan 'admin'.
 * @param {Function} props.onSelectionChange - Fungsi callback untuk perubahan seleksi wilayah dari tampilan 'admin'.
 * @param {object} props.regionData - Data untuk wilayah yang ditampilkan di tampilan 'regionInfo'.
 * @param {object} props.dateRange - Rentang tanggal saat ini, diteruskan ke tampilan 'regionInfo'.
 * @param {Array<object>} props.pins - Array objek pin yang disimpan untuk ditampilkan di tampilan 'history'.
 * @param {Function} props.onGoToPin - Fungsi callback untuk menavigasi ke pin yang dipilih dari tampilan 'history'.
 * @param {Function} props.onDeletePin - Fungsi callback untuk menghapus pin dari tampilan 'history'.
 * @returns {JSX.Element|null} Komponen UnifiedSidebar, atau `null` jika tidak terbuka.
 */
const UnifiedSidebar = ({
    isOpen,
    isHidden,
    onToggleVisibility,
    activeView, // 'admin', 'regionInfo', or 'history'
    // Props for Admin view
    currentSelection,
    onSelectionChange,
    // Props for Region Info view
    regionData,
    dateRange,
    // Props for History view
    pins,
    onGoToPin,
    onDeletePin,
}) => {
    const [activeAdminTab, setActiveAdminTab] = useState('admin');
    const [activeRegionInfoTab, setActiveRegionInfoTab] = useState('stats');


    const handleProvinceChange = (e) => {
        const provinceCode = e.target.value;
        onSelectionChange({ provinceCode: provinceCode || undefined }, 'province');
    };
    const handleKabkotaChange = (e) => {
        const kabkotaCode = e.target.value;
        onSelectionChange({
            provinceCode: currentSelection.provinceCode,
            provinceName: currentSelection.provinceName,
            kabkotaCode: kabkotaCode || undefined,
        }, 'kabkota');
    };
    const handleKecamatanChange = (e) => {
        const kecamatanCode = e.target.value;
        onSelectionChange({
            provinceCode: currentSelection.provinceCode,
            provinceName: currentSelection.provinceName,
            kabkotaCode: currentSelection.kabkotaCode,
            kabkotaName: currentSelection.kabkotaName,
            kecamatanCode: kecamatanCode || undefined,
        }, 'kecamatan');
    };
    const handleDesaChange = (e) => {
        const desaName = e.target.value;
        onSelectionChange({ ...currentSelection, desaName: desaName || undefined }, 'desa');
    };

    const { data: provinsiData, loading: provinsiLoading } = useBoundaryData({ level: 'provinsi' });
    const { data: kabkotaData, loading: kabkotaLoading } = useBoundaryData({ level: 'kabkota', provinceCode: currentSelection.provinceCode });
    const { data: kecamatanData, loading: kecamatanLoading } = useBoundaryData({ level: 'kecamatan', provinceCode: currentSelection.provinceCode, kabkotaCode: currentSelection.kabkotaCode });
    const { data: desaData, loading: desaLoading } = useBoundaryData({ level: 'desa', provinceCode: currentSelection.provinceCode, kabkotaCode: currentSelection.kabkotaCode, kecamatanCode: currentSelection.kecamatanCode });

    const provinceOptions = provinsiData.map(p => ({ value: p.properties.kode_prov, name: p.properties.nama }));
    const kabkotaOptions = currentSelection.provinceCode ? kabkotaData.filter(k => k.properties.kode_prov === currentSelection.provinceCode).map(k => ({ value: k.properties.kode_kab, name: k.properties.nama })) : [];
    const kecamatanOptions = currentSelection.kabkotaCode ? kecamatanData.filter(k => k.properties.kode_kab === currentSelection.kabkotaCode).map(k => ({ value: k.properties.kode_kec, name: k.properties.nama })) : [];
    const desaOptions = currentSelection.kecamatanCode ? desaData.filter(d => d.properties.kode_kec === currentSelection.kecamatanCode).map(d => ({ value: d.properties.nama, name: d.properties.nama })) : [];

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
        } catch (err) {
            setCopyError(true);
            copyTimeoutRef.current = setTimeout(resetCopyStatus, 2000);
        }
    };

    const renderRegionInfo = () => {
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
                    <div className="mt-4 pt-36">
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
                        <Tooltip content={isCopied ? 'Tautan disalin!' : (copyError ? 'Gagal menyalin!' : 'Bagikan')} hideOnClick={false} onHide={resetCopyStatus}>
                            <button onClick={handleShare} className={`p-2 rounded-md focus:outline-none active:bg-gray-300 transition-colors duration-150 ${isCopied ? 'bg-green-100 text-green-700 hover:bg-green-200' : copyError ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`} aria-label="Bagikan">
                                <ShareIcon />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </>
        );
    };

    const renderAdmin = () => (
        <>
            <div className="pt-20 flex-shrink-0">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        <TabButton text="Administrasi Lokal" isActive={activeAdminTab === 'admin'} onClick={() => setActiveAdminTab('admin')} />
                        {/* <TabButton text="Nomor Telepon" isActive={activeAdminTab === 'phone'} onClick={() => setActiveAdminTab('phone')} /> */}
                    </div>
                </div>
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                {activeAdminTab === 'admin' && (
                    <div className="flex flex-col gap-4">
                        <CustomSelectDropdown label="1. Provinsi" value={currentSelection.provinceCode} onChange={handleProvinceChange} options={provinceOptions} placeholder={provinsiLoading ? "Memuat..." : "-- Pilih Provinsi --"} disabled={provinsiLoading} />
                        <CustomSelectDropdown label="2. Kabupaten/Kota" value={currentSelection.kabkotaCode} onChange={handleKabkotaChange} options={kabkotaOptions} placeholder={kabkotaLoading ? "Memuat..." : "-- Pilih Kab/Kota --"} disabled={!currentSelection.provinceCode || kabkotaLoading} />
                        <CustomSelectDropdown label="3. Kecamatan" value={currentSelection.kecamatanCode} onChange={handleKecamatanChange} options={kecamatanOptions} placeholder={kecamatanLoading ? "Memuat..." : "-- Pilih Kecamatan --"} disabled={!currentSelection.kabkotaCode || kecamatanLoading} />
                        <CustomSelectDropdown label="4. Desa/Kelurahan" value={currentSelection.desaName} onChange={handleDesaChange} options={desaOptions} placeholder={desaLoading ? "Memuat..." : "-- Pilih Desa/Kelurahan --"} disabled={!currentSelection.kecamatanCode || desaLoading} />
                    </div>
                )}
                {activeAdminTab === 'phone' && (
                    <div className="p-4 text-center text-gray-500">
                        <p>Fitur nomor telepon sedang dalam pengembangan.</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderHistory = () => (
        <>
            <div className="p-4 border-b flex justify-between items-center pt-20">
                <h2 className="text-lg font-bold text-gray-800">Riwayat 5 pin terakhir</h2>
            </div>
            <div className="flex-grow p-2.5 overflow-y-auto custom-scrollbar space-y-2.5 bg-gray-50/50">
                {pins.length === 0 ? (
                    <p className="text-sm mt-2 mb-2 text-gray-500 italic text-center">
                        Belum ada pin yang disimpan.
                    </p>
                ) : (
                    [...pins].reverse().map((pin) => (
                        <div
                            key={pin.id}
                            className="bg-white border border-gray-200/80 rounded-lg p-3 shadow-sm flex flex-col gap-2 transition-shadow hover:shadow-md"
                        >
                            <Tooltip content={pin.title} >
                                <span className="font-semibold text-gray-800 text-sm truncate">
                                    {pin.title}
                                </span>
                            </Tooltip>
                            <div className="flex items-center justify-between mt-1">
                                <button
                                    onClick={() => onGoToPin(pin)}
                                    className="text-xs inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 font-medium rounded-md hover:bg-blue-100"
                                >
                                    <GoToIcon className="w-3.5 h-3.5" />
                                    Lihat di Peta
                                </button>
                                <Tooltip content='Hapus Pin' >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePin(pin.id);
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                        aria-label={`Hapus ${pin.title}`}
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );

    if (!isOpen) {
        return null;
    }

    const renderContent = () => {
        switch (activeView) {
            case 'admin':
                return renderAdmin();
            case 'regionInfo':
                return renderRegionInfo();
            case 'history':
                return renderHistory();
            default:
                return null;
        }
    };

    return (
        <div
            className={`absolute top-0 left-0 transition-transform duration-300 ease-in-out shadow-xl h-full bg-white flex flex-col border-r border-gray-100 ${!isHidden ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ width: REGION_INFO_SIDEBAR_WIDTH }}
        >
            {renderContent()}
            <SidebarToggleButton
                isOpen={!isHidden}
                onClick={onToggleVisibility}
                position="left"
            />
        </div>
    );
};

export default UnifiedSidebar;
