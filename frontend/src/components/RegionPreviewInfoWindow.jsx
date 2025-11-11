import React from 'react';
import { InfoWindow } from '@vis.gl/react-google-maps';
import NavigationIcon from './icons/NavigationIcon';
import { TICKET_STATUSES } from '../constants/ticketStatus';

/**
 * Komponen helper untuk menampilkan statistik tiket dalam InfoWindow.
 * Menangani status pemuatan dan kasus di mana data tidak tersedia.
 *
 * @param {object} props - Properti komponen.
 * @param {object|null} props.stats - Objek yang berisi statistik tiket (open, pending, closed, total).
 * @param {boolean} props.loading - Bendera yang menunjukkan jika data sedang dimuat.
 * @returns {JSX.Element} Tampilan statistik.
 */
const StatsDisplay = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="text-sm text-gray-500 min-h-[72px] flex items-center justify-center">
        Memuat data...
      </div>
    );
  }

  const statsData = stats;

  if (!statsData) {
    return (
      <div className="text-sm text-gray-500 min-h-[72px] flex items-center justify-center">
        Data tidak tersedia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
      {TICKET_STATUSES.map(status => (
        <React.Fragment key={status.key}>
          <span>{status.label}:</span>
          <span className="font-semibold text-right">{statsData[status.key]}</span>
        </React.Fragment>
      ))}
      <span className="font-bold border-t pt-1 mt-1">Total:</span>
      <span className="font-bold border-t pt-1 mt-1 text-right">{statsData.total}</span>
    </div>
  );
};

/**
 * Komponen InfoWindow kustom yang menampilkan pratinjau data untuk sebuah wilayah,
 * termasuk nama wilayah dan statistik tiket. Komponen ini biasanya muncul saat pengguna
 * mengarahkan kursor ke sebuah sub-wilayah pada peta.
 *
 * @param {object} props - Properti komponen.
 * @param {{lat: number, lng: number}|null} props.position - Posisi geografis untuk InfoWindow.
 * @param {string} props.regionName - Nama wilayah yang akan ditampilkan.
 * @param {object|null} props.stats - Objek statistik tiket untuk ditampilkan oleh `StatsDisplay`.
 * @param {boolean} props.loading - Bendera status pemuatan untuk diteruskan ke `StatsDisplay`.
 * @param {Function} props.onClose - Fungsi callback yang dipanggil saat pengguna menutup InfoWindow.
 * @param {Function} props.onNavigate - Fungsi callback yang dipanggil saat pengguna mengklik tombol "Lihat selengkapnya".
 * @returns {JSX.Element|null} Komponen RegionPreviewInfoWindow, atau null jika tidak ada posisi.
 */
const RegionPreviewInfoWindow = ({
  position,
  regionName,
  stats,
  loading,
  onClose,
  onNavigate,
}) => {

  if (!position) {
    return null;
  }

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
      <div className="p-2 bg-white rounded-lg shadow-lg min-w-[200px]">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{regionName}</h3>

        <StatsDisplay stats={stats} loading={loading} />

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={onNavigate}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <NavigationIcon className="w-4 h-4" />
            <span>Lihat selengkapnya</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">
          atau klik area dua kali
        </p>
      </div>
    </InfoWindow>
  );
};

export default RegionPreviewInfoWindow;
