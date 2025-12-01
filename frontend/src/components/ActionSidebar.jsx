import WilayahIcon from './icons/WilayahIcon';
import PinIcon from './icons/PinIcon';
import LayerIcon from './icons/LayerIcon';
import { ACTION_SIDEBAR_WIDTH } from '../constants/layout';

/**
 * Komponen tombol yang dapat digunakan kembali untuk ActionSidebar.
 * Menampilkan ikon dan teks opsional, serta menyorot dirinya sendiri saat aktif.
 *
 * @param {object} props - Properti komponen.
 * @param {JSX.Element} props.icon - Elemen ikon SVG untuk ditampilkan.
 * @param {string} [props.text] - Label teks opsional untuk ditampilkan di bawah ikon.
 * @param {Function} props.onClick - Fungsi yang akan dipanggil saat tombol diklik.
 * @param {boolean} props.isActive - Apakah tombol harus ditampilkan dalam keadaan aktif.
 * @returns {JSX.Element} Elemen tombol untuk sidebar aksi.
 */
const ActionSidebarButton = ({ icon, text, onClick, isActive }) => (
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
        {text && <span className="text-[10px] font-semibold mt-1.5">{text}</span>}
    </button>
);

/**
 * Sidebar vertikal tetap di sisi kiri layar yang berisi tombol-tombol aksi utama.
 * Tombol-tombol ini digunakan untuk mengubah visibilitas dan konten dari `UnifiedSidebar` utama.
 *
 * @param {object} props - Properti komponen.
 * @param {Function} props.onButtonClick - Fungsi callback yang dieksekusi saat tombol aksi diklik. Menerima nama sidebar yang akan dibuka (misalnya, 'wilayah', 'history').
 * @param {string|null} props.activeSidebar - Nama tampilan sidebar yang sedang aktif, digunakan untuk menyorot tombol yang sesuai.
 * @returns {JSX.Element} Komponen ActionSidebar.
 */
const ActionSidebar = ({ onButtonClick, activeSidebar }) => {
    return (
        <div
            className="h-full bg-white shadow-sm p-3 flex flex-col items-center gap-3 border-r border-gray-200 z-20"
            style={{ width: ACTION_SIDEBAR_WIDTH }}
        >
            <ActionSidebarButton
                icon={<WilayahIcon />}
                text="Wilayah"
                onClick={() => onButtonClick('wilayah')}
                isActive={activeSidebar === 'wilayah'}
            />
            <ActionSidebarButton
                icon={<PinIcon className="w-6 h-6" />}
                text="Disimpan"
                onClick={() => onButtonClick('history')}
                isActive={activeSidebar === 'history'}
            />
            <ActionSidebarButton
                icon={<LayerIcon />}
                text="Lapisan"
                onClick={() => onButtonClick('layers')}
                isActive={activeSidebar === 'layers'}
            />
        </div>
    );
};

export default ActionSidebar;
