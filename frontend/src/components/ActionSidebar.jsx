import MenuIcon from './icons/MenuIcon';
import WilayahIcon from './icons/WilayahIcon';
import PinIcon from './icons/PinIcon';
import MoreIcon from './icons/MoreIcon';
import DeviceIcon from './icons/DeviceIcon';
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
    <button onClick={onClick} className={`w-full flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>
        {icon}
        {text && <span className="text-xs mt-1">{text}</span>}
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
    // Placeholder data for recent places, as seen in the image
    const recentPlaces = [
        { name: 'Kaliman...', count: 6 },
        { name: 'Sukaraja', count: 2 },
        { name: 'Kalimantan Timur' },
    ];

    return (
        <div
            className="h-full bg-white shadow-md p-2 flex flex-col items-center gap-2 border-r border-gray-200 z-20"
            style={{ width: ACTION_SIDEBAR_WIDTH }}
        >
            <ActionSidebarButton icon={<MenuIcon />} />
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
            
            <hr className="w-full my-1 border-gray-200" />

            {/* Recent Places List - This is a simplified visual representation */}
            {/* {recentPlaces.map((place, index) => (
                <div key={index} className="flex flex-col items-center text-center w-full p-1 cursor-pointer hover:bg-gray-100 rounded-md">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mb-1 relative flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
                        {place.count && (
                            <span className="absolute -top-1.5 -right-1.5 bg-gray-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                                {place.count}
                            </span>
                        )}
                    </div>
                    <span className="text-xs leading-tight">{place.name}</span>
                </div>
            ))} */}
            
            {/* <ActionSidebarButton icon={<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><MoreIcon /></div>} text="Lainnya" /> */}

            <div className="flex-grow" /> {/* Spacer to push the last item to the bottom */}

            <hr className="w-full my-1 border-gray-200" />
            
            {/* <ActionSidebarButton icon={<DeviceIcon />} text="Dapatkan" /> */}
        </div>
    );
};

export default ActionSidebar;
