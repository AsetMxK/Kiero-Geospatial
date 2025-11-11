import InfoIcon from './icons/InfoIcon';
import SitemapIcon from './icons/SitemapIcon';
import Tooltip from './Tooltip';

/**
 * Komponen yang menampilkan satu set tombol aksi mengambang (floating action buttons),
 * biasanya ditampilkan di peta saat sebuah wilayah dipilih. Komponen ini mencakup tombol
 * untuk menampilkan info wilayah dan, secara opsional, untuk menelusuri sub-wilayah.
 *
 * @param {object} props - Properti komponen.
 * @param {Function} props.onShowInfo - Fungsi callback yang dieksekusi saat tombol "Tampilkan Info" diklik.
 * @param {Function} props.onShowSubRegions - Fungsi callback yang dieksekusi saat tombol "Tampilkan Sub-wilayah" diklik.
 * @param {boolean} props.canDrillDown - Menentukan apakah tombol "Tampilkan Sub-wilayah" terlihat.
 * @returns {JSX.Element} Sebuah div yang berisi tombol-tombol aksi mengambang.
 */
const FloatingActionButtons = ({ onShowInfo, onShowSubRegions, canDrillDown }) => {
  return (
    <div className="flex gap-2 p-1 bg-white rounded-full shadow-lg">
      <Tooltip content="Tampilkan Info Wilayah">
        <button
          onClick={onShowInfo}
          className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
        >
          <InfoIcon />
        </button>
      </Tooltip>
      {canDrillDown && (
        <Tooltip content="Tampilkan Sub-wilayah">
          <button
            onClick={onShowSubRegions}
            className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition flex items-center justify-center"
          >
            <SitemapIcon />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default FloatingActionButtons;
