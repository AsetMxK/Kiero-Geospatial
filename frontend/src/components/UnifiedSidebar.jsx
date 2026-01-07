import { useState, useRef, useEffect } from 'react';
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
    isMobile,
}) => {
    const [activeAdminTab, setActiveAdminTab] = useState('admin');
    const [activeRegionInfoTab, setActiveRegionInfoTab] = useState('stats');
    const [isFullHeight, setIsFullHeight] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // State untuk Geo AI
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const startTime = useRef(0);
    const hasDragged = useRef(false);

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

    // Reset CSS variable when closed or unmounted, and set it when open
    useEffect(() => {
        if (isMobile) {
            if (isOpen) {
                let baseHeight;
                if (isHidden) baseHeight = `${PEEK_HEIGHT}px`;
                else if (isFullHeight) baseHeight = `${FULL_HEIGHT_VH}vh`;
                else baseHeight = `${HALF_HEIGHT_VH}vh`;

                const currentH = parseFloat(baseHeight.includes('vh')
                    ? (parseFloat(baseHeight) * window.innerHeight / 100)
                    : parseFloat(baseHeight));

                const clampLimit = window.innerHeight * 0.5;
                const clampedH = Math.min(currentH, clampLimit);

                document.documentElement.style.setProperty('--mobile-drawer-height', `${clampedH}px`);
                document.documentElement.style.setProperty('--drawer-transition', 'bottom 0.3s ease-in-out');
            } else {
                // Animate to 80px (ActionSidebar height) when closed
                document.documentElement.style.setProperty('--mobile-drawer-height', '80px');
                document.documentElement.style.setProperty('--drawer-transition', 'bottom 0.3s ease-in-out');
            }
        } else {
            document.documentElement.style.removeProperty('--mobile-drawer-height');
            document.documentElement.style.removeProperty('--drawer-transition');
        }

        return () => {
            document.documentElement.style.removeProperty('--mobile-drawer-height');
            document.documentElement.style.removeProperty('--drawer-transition');
        };
    }, [isOpen, isMobile, isHidden, isFullHeight]);

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

    const renderAdmin = () => (
        <>
            <div className={`${isMobile ? 'pt-4' : 'pt-20'} flex-shrink-0`}>
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
            <div className={`p-4 border-b flex justify-between items-center ${isMobile ? 'pt-4' : 'pt-20'}`}>
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

    /**
     * Fungsi untuk mengirim pesan ke AI
     */
    const handleAiSubmit = async (e) => {
        e.preventDefault();
        if (!aiInput.trim() || isAiLoading) return;

        const userMessage = { role: 'user', content: aiInput.trim() };
        setAiMessages(prev => [...prev, userMessage]);
        setAiInput('');
        setIsAiLoading(true);

        try {
            // TODO: Implementasi API call ke backend AI
            // Untuk sementara, simulasi response
            await new Promise(resolve => setTimeout(resolve, 1500));

            const aiResponse = {
                role: 'assistant',
                content: `Terima kasih atas pertanyaanmu tentang "${userMessage.content}". Fitur Geo AI sedang dalam tahap pengembangan. Segera kami akan dapat membantu Anda dengan analisis geografis, pencarian lokasi, dan informasi wilayah berbasis AI.`
            };
            setAiMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            const errorMessage = {
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
                isError: true
            };
            setAiMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const renderGeoAi = () => (
        <>
            {/* Header - Centered Horizontal */}
            <div className={`p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white ${isMobile ? 'pt-4' : 'pt-20'}`}>
                <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Geo AI Assistant</h2>
                        <p className="text-sm text-white/80">Tanya tentang wilayah & lokasi</p>
                    </div>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4 bg-gray-50/50">
                {aiMessages.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                            </svg>
                        </div>
                        <h3 className="text-gray-700 font-semibold mb-2">Halo! Saya Geo AI</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            Tanyakan tentang informasi geografis, wilayah administratif, atau bantu temukan lokasi tertentu.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {['Dimana Jakarta?', 'Info provinsi Jawa Barat', 'Luas wilayah Bandung'].map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setAiInput(suggestion)}
                                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    aiMessages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : msg.isError
                                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md'
                                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-md'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                {isAiLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="flex space-x-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-xs text-gray-500">AI sedang berpikir...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            {/* Input Area - Centered and Modern */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
                <form onSubmit={handleAiSubmit} className="max-w-lg mx-auto">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1.5 pl-4 border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                        <textarea
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAiSubmit(e);
                                }
                            }}
                            placeholder="Tanyakan sesuatu tentang wilayah..."
                            className="flex-1 bg-transparent text-sm resize-none focus:outline-none py-2 custom-scrollbar placeholder-gray-500"
                            rows={1}
                            style={{ maxHeight: '80px', minHeight: '24px' }}
                            disabled={isAiLoading}
                        />
                        <button
                            type="submit"
                            disabled={!aiInput.trim() || isAiLoading}
                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${aiInput.trim() && !isAiLoading
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );

    const lastActiveView = useRef(activeView);

    useEffect(() => {
        if (activeView) {
            lastActiveView.current = activeView;
        }
    }, [activeView]);

    const renderContent = () => {
        const viewToRender = isOpen ? activeView : lastActiveView.current;
        switch (viewToRender) {
            case 'admin':
                return renderAdmin();
            case 'regionInfo':
                return renderRegionInfo();
            case 'history':
                return renderHistory();
            case 'geoAi':
                return renderGeoAi();
            default:
                return null;
        }
    };

    const PEEK_HEIGHT = 170;
    const HALF_HEIGHT_VH = 50;
    const FULL_HEIGHT_VH = 99;

    const processDragEnd = () => {
        const deltaY = currentY.current - startY.current;
        const deltaTime = Date.now() - startTime.current;
        const velocity = Math.abs(deltaY) / deltaTime;
        const isFlick = velocity > 0.5;

        // Calculate current height state
        const isPeek = isHidden;
        const isHalf = !isHidden && !isFullHeight;
        const isFull = !isHidden && isFullHeight;

        if (isFlick) {
            if (deltaY < 0) { // Flick Up
                if (isPeek) onToggleVisibility(); // Peek -> Half
                else if (isHalf) setIsFullHeight(true); // Half -> Full
            } else { // Flick Down
                if (isFull) setIsFullHeight(false); // Full -> Half
                else if (isHalf) onToggleVisibility(); // Half -> Peek
            }
        } else {
            // Drag logic based on threshold (e.g., 100px)
            const threshold = 100;
            if (deltaY < -threshold) { // Drag Up
                if (isPeek) onToggleVisibility();
                else if (isHalf) setIsFullHeight(true);
            } else if (deltaY > threshold) { // Drag Down
                if (isFull) setIsFullHeight(false);
                else if (isHalf) onToggleVisibility();
            }
        }
    };

    const handleTouchStart = (e) => {
        if (!isMobile) return;
        hasDragged.current = false;
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        startTime.current = Date.now();
        setIsDragging(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging || !isMobile) return;
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - startY.current;
        if (Math.abs(deltaY) > 5) hasDragged.current = true;
        currentY.current = touchY;
        setDragOffset(deltaY);
    };

    const handleTouchEnd = () => {
        if (!isDragging || !isMobile) return;
        setIsDragging(false);
        setDragOffset(0);
        processDragEnd();
    };

    // Mouse handlers for desktop drag
    const handleMouseDown = (e) => {
        if (!isMobile) return;
        e.preventDefault();
        hasDragged.current = false;
        startY.current = e.clientY;
        currentY.current = startY.current;
        startTime.current = Date.now();
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            const clientY = e.clientY;
            const deltaY = clientY - startY.current;
            if (Math.abs(deltaY) > 5) hasDragged.current = true;
            currentY.current = clientY;
            setDragOffset(deltaY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setDragOffset(0);
            processDragEnd();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleMobileToggle = (e) => {
        if (hasDragged.current) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            return;
        }

        if (isHidden) {
            // Peek -> Half
            onToggleVisibility();
        } else if (!isFullHeight) {
            // Half -> Full
            setIsFullHeight(true);
        } else {
            // Full -> Half
            setIsFullHeight(false);
        }
    };

    const getHeightStyle = () => {
        if (isMobile) {
            let baseHeight;
            if (isHidden) baseHeight = `${PEEK_HEIGHT}px`;
            else if (isFullHeight) baseHeight = `${FULL_HEIGHT_VH}vh`;
            else baseHeight = `${HALF_HEIGHT_VH}vh`;

            if (isDragging) {
                const currentH = parseFloat(baseHeight.includes('vh')
                    ? (parseFloat(baseHeight) * window.innerHeight / 100)
                    : parseFloat(baseHeight));
                const dragH = currentH - dragOffset;

                // Update CSS variable for other components (clamped at 50vh)
                const clampLimit = window.innerHeight * 0.5;
                const clampedH = Math.min(dragH, clampLimit);
                document.documentElement.style.setProperty('--mobile-drawer-height', `${clampedH}px`);
                document.documentElement.style.setProperty('--drawer-transition', 'none');

                return {
                    height: `calc(${baseHeight} - ${dragOffset}px)`,
                    transition: 'none',
                    transform: 'none'
                };
            }

            // Update CSS variable for static states
            const currentH = parseFloat(baseHeight.includes('vh')
                ? (parseFloat(baseHeight) * window.innerHeight / 100)
                : parseFloat(baseHeight));
            const clampLimit = window.innerHeight * 0.5;
            const clampedH = Math.min(currentH, clampLimit);

            if (isOpen) {
                document.documentElement.style.setProperty('--mobile-drawer-height', `${clampedH}px`);
                document.documentElement.style.setProperty('--drawer-transition', 'bottom 0.3s ease-in-out');
            }

            return {
                height: baseHeight,
                transition: 'height 0.3s ease-in-out, transform 0.3s ease-in-out'
            };
        }
        return { width: REGION_INFO_SIDEBAR_WIDTH };
    };

    return (
        <div
            className={`
                absolute shadow-xl bg-white flex flex-col pointer-events-auto
                ${isMobile
                    ? `bottom-0 left-0 w-full rounded-t-2xl border-t border-gray-200 z-[60] overflow-hidden pb-[90px] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`
                    : `top-0 left-0 h-full border-r border-gray-100 transition-all duration-300 ease-in-out ${isOpen && !isHidden ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`
                }
            `}
            style={getHeightStyle()}
        >
            {isMobile && (
                <div
                    className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onClick={handleMobileToggle}
                >
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                </div>
            )}
            {renderContent()}
            {!isMobile && isOpen && (
                <SidebarToggleButton
                    isOpen={!isHidden}
                    onClick={onToggleVisibility}
                    position="left"
                />
            )}
        </div>
    );
};

export default UnifiedSidebar;
