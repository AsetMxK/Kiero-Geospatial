import ChevronIcon from './icons/ChevronIcon';
import Tooltip from './Tooltip';

/**
 * Komponen tombol yang digunakan untuk menyembunyikan atau menampilkan sidebar.
 * Tombol ini diposisikan secara absolut relatif terhadap kontainer sidebar
 * dan menampilkan ikon chevron yang berputar untuk menunjukkan keadaan terbuka/tertutup.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.isOpen - Apakah sidebar saat ini terbuka.
 * @param {Function} props.onClick - Fungsi callback yang akan dieksekusi saat tombol diklik.
 * @param {'left' | 'right'} [props.position='left'] - Menentukan di sisi mana dari sidebar tombol akan muncul.
 * @returns {JSX.Element} Komponen tombol toggle sidebar.
 */
const SidebarToggleButton = ({ isOpen, onClick, position = 'left' }) => {
    const tooltipContent = isOpen ? 'Sembunyikan' : 'Tampilkan';
    const positionClasses = {
        left: 'left-full',
        right: 'right-full',
    };
    const roundedClasses = {
        left: 'rounded-r-lg',
        right: 'rounded-l-lg',
    };

    return (
        <div
            className={`absolute top-1/2 -translate-y-1/2 ${positionClasses[position]} z-40`}
        >
            <Tooltip content={tooltipContent}>
                <div
                    onClick={onClick}
                    className={`w-10 h-12 bg-white ${roundedClasses[position]} shadow-md flex items-center justify-center cursor-pointer pointer-events-auto`}
                >
                    <ChevronIcon isOpen={isOpen} />
                </div>
            </Tooltip>
        </div>
    );
};

export default SidebarToggleButton;
