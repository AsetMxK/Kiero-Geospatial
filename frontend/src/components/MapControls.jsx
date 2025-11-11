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
 * @returns {JSX.Element} Sebuah div yang berisi tombol-tombol kontrol peta.
 */
const MapControls = ({
  isFullscreen,
  onToggleFullscreen,
  onBack,
  isBackDisabled,
  isPinningMode,
  onTogglePinMode,
}) => {
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
      <Tooltip content={isFullscreen ? 'Keluar Layar Penuh' : 'Masuk Layar Penuh'}>
        <button
          onClick={onToggleFullscreen}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition flex items-center justify-center"
        >
          {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
        </button>
      </Tooltip>

      <Tooltip content={isPinningMode ? 'Nonaktifkan Mode Pin' : 'Aktifkan Mode Pin'}>
        <button
          onClick={onTogglePinMode}
          data-testid="pin-mode-toggle"
          className={`bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition flex items-center justify-center ${isPinningMode ? 'bg-blue-100 ring-2 ring-blue-500' : ''
            }`}
        >
          <PinIcon />
        </button>
      </Tooltip>

      <Tooltip content="Kembali">
        <button
          onClick={onBack}
          disabled={isBackDisabled}
          className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <BackIcon />
        </button>
      </Tooltip>
    </div>
  );
};

export default MapControls;