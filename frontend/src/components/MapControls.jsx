import Tooltip from './Tooltip';
import MaximizeIcon from './icons/MaximizeIcon';
import MinimizeIcon from './icons/MinimizeIcon';
import PinIcon from './icons/PinIcon';
import BackIcon from './icons/BackIcon';

/**
 * Komponen yang me-render kontrol mengambang di atas peta.
 * Termasuk tombol untuk mengubah mode layar penuh, masuk/keluar dari "mode pin",
 * dan navigasi kembali dalam hierarki pemilihan wilayah.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.isFullscreen - Apakah aplikasi saat ini dalam mode layar penuh.
 * @param {Function} props.onToggleFullscreen - Fungsi callback untuk mengubah mode layar penuh.
 * @param {Function} props.onBack - Fungsi callback untuk menangani aksi "kembali" (misalnya, pergi ke wilayah induk).
 * @param {boolean} props.isBackDisabled - Apakah tombol "kembali" harus dinonaktifkan.
 * @param {boolean} props.isPinningMode - Apakah peta saat ini dalam "mode pin".
 * @param {Function} props.onTogglePinMode - Fungsi callback untuk mengubah "mode pin".
 * @param {boolean} props.isMobile - Apakah tampilan saat ini adalah mobile.
 * @returns {JSX.Element} Sebuah div yang berisi tombol-tombol kontrol peta.
 */
const MapControls = ({
  isFullscreen,
  onToggleFullscreen,
  onBack,
  isBackDisabled,
  isPinningMode,
  onTogglePinMode,
  isMobile,
}) => {
  return (
    <div className={`absolute ${isMobile ? 'right-4' : 'top-4 right-4'} z-20 flex flex-col gap-3 pointer-events-auto`} style={isMobile ? { bottom: 'calc(var(--mobile-drawer-height, 80px) + 16px)', transition: 'var(--drawer-transition, bottom 0.3s ease-in-out)' } : {}}>
      <Tooltip content={isFullscreen ? 'Keluar Layar Penuh' : 'Masuk Layar Penuh'}>
        <button
          onClick={onToggleFullscreen}
          className={`
            p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center
            ${isFullscreen
              ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-600'
              : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
        >
          {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
        </button>
      </Tooltip>

      <Tooltip content={isPinningMode ? 'Nonaktifkan Mode Pin' : 'Aktifkan Mode Pin'}>
        <button
          onClick={onTogglePinMode}
          data-testid="pin-mode-toggle"
          className={`
            p-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center
            ${isPinningMode
              ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-600'
              : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
        >
          <PinIcon />
        </button>
      </Tooltip>

      <Tooltip content="Kembali">
        <button
          onClick={onBack}
          disabled={isBackDisabled}
          className="bg-white p-2.5 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center"
        >
          <BackIcon />
        </button>
      </Tooltip>
    </div>
  );
};

export default MapControls;