import WilayahIcon from './icons/WilayahIcon';
import PinIcon from './icons/PinIcon';
import Tooltip from './Tooltip';
import { ACTION_SIDEBAR_WIDTH } from '../constants/layout';

/**
 * Ikon AI untuk fitur Geo AI - menggunakan sparkle/stars design.
 * @returns {JSX.Element} Elemen SVG untuk ikon AI.
 */
const GeoAiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
);

/**
 * Komponen tombol yang dapat digunakan kembali untuk ActionSidebar.
 * Menampilkan ikon dan teks (di mobile) atau tooltip (di desktop).
 *
 * @param {object} props - Properti komponen.
 * @param {JSX.Element} props.icon - Elemen ikon SVG untuk ditampilkan.
 * @param {string} [props.text] - Label teks untuk ditampilkan (mobile) atau tooltip (desktop).
 * @param {Function} props.onClick - Fungsi yang akan dipanggil saat tombol diklik.
 * @param {boolean} props.isActive - Apakah tombol harus ditampilkan dalam keadaan aktif.
 * @param {boolean} props.isMobile - Apakah tampilan mobile.
 * @returns {JSX.Element} Elemen tombol untuk sidebar aksi.
 */
const ActionSidebarButton = ({ icon, text, onClick, isActive, isMobile }) => {
    const buttonContent = (
        <button
            onClick={onClick}
            className={`
                w-full flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group
                ${isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
            `}
        >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                {icon}
            </div>
            {isMobile && text && <span className="text-[10px] font-semibold mt-1.5">{text}</span>}
        </button>
    );

    // Di desktop, bungkus dengan Tooltip
    if (!isMobile && text) {
        return (
            <Tooltip content={text} placement="right">
                {buttonContent}
            </Tooltip>
        );
    }

    return buttonContent;
};

/**
 * Sidebar vertikal tetap di sisi kiri layar yang berisi tombol-tombol aksi utama.
 * Tombol-tombol ini digunakan untuk mengubah visibilitas dan konten dari `UnifiedSidebar` utama.
 *
 * @param {object} props - Properti komponen.
 * @param {Function} props.onButtonClick - Fungsi callback yang dieksekusi saat tombol aksi diklik. Menerima nama sidebar yang akan dibuka (misalnya, 'wilayah', 'history').
 * @param {string|null} props.activeSidebar - Nama tampilan sidebar yang sedang aktif, digunakan untuk menyorot tombol yang sesuai.
 * @returns {JSX.Element} Komponen ActionSidebar.
 */
const ActionSidebar = ({ onButtonClick, activeSidebar, isMobile }) => {
    return (
        <div
            className={`
                bg-white shadow-sm flex items-center pointer-events-auto
                ${isMobile
                    ? 'fixed bottom-0 left-0 right-0 h-auto flex-row justify-around border-t border-gray-200 py-2 px-4 z-[70]'
                    : 'h-full flex-col gap-3 border-r border-gray-200 p-3 z-20'
                }
            `}
            style={!isMobile ? { width: ACTION_SIDEBAR_WIDTH } : {}}
        >
            <ActionSidebarButton
                icon={<WilayahIcon />}
                text="Wilayah"
                onClick={() => onButtonClick('wilayah')}
                isActive={activeSidebar === 'wilayah'}
                isMobile={isMobile}
            />
            <ActionSidebarButton
                icon={<PinIcon className="w-6 h-6" />}
                text="Disimpan"
                onClick={() => onButtonClick('history')}
                isActive={activeSidebar === 'history'}
                isMobile={isMobile}
            />
            <ActionSidebarButton
                icon={<GeoAiIcon />}
                text="Geo AI"
                onClick={() => onButtonClick('geoAi')}
                isActive={activeSidebar === 'geoAi'}
                isMobile={isMobile}
            />
        </div>
    );
};

export default ActionSidebar;
