import { useState, useMemo } from 'react';
import { useRegionStatsDetails } from '../hooks/useRegionStatsDetails';
import { getStatusColorHsl } from '../utils/statusColors';
import { TICKET_STATUSES } from '../constants/ticketStatus';

/**
 * Komponen tombol filter berbentuk "pil" untuk status tiket.
 *
 * @param {object} props - Properti komponen.
 * @param {string} props.label - Teks yang akan ditampilkan pada pil.
 * @param {string} props.statusKey - Kunci status (misalnya, 'open', 'closed') yang direpresentasikan oleh pil.
 * @param {boolean} props.isChecked - Apakah pil ini sedang dalam keadaan terpilih/aktif.
 * @param {Function} props.onChange - Fungsi callback yang akan dipanggil saat pil diklik.
 * @returns {JSX.Element} Komponen pil filter.
 */
const StatusFilterPill = ({ label, statusKey, isChecked, onChange }) => {
    const color = getStatusColorHsl(statusKey);
    return (
        <label
            htmlFor={`filter-${statusKey}`}
            className={`
                px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all
                ${isChecked
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
            `}
            style={{ backgroundColor: isChecked ? color : undefined }}
        >
            <input
                id={`filter-${statusKey}`}
                type="checkbox"
                checked={isChecked}
                onChange={() => onChange(statusKey)}
                className="sr-only"
            />
            <span className="capitalize">{label}</span>
        </label>
    );
};

/**
 * Komponen tabel yang menampilkan rincian statistik tiket berdasarkan kategori.
 * Menangani status pemuatan, status kesalahan, dan kasus di mana tidak ada data untuk ditampilkan.
 *
 * @param {object} props - Properti komponen.
 * @param {Array<object>} props.data - Array data statistik kategori yang akan ditampilkan.
 * @param {boolean} props.isLoading - Bendera yang menunjukkan jika data sedang dimuat.
 * @param {boolean} props.isError - Bendera yang menunjukkan jika terjadi kesalahan saat mengambil data.
 * @returns {JSX.Element} Komponen tabel statistik.
 */
const CombinedCategoryTable = ({ data, isLoading, isError }) => {
    if (isLoading) {
        return (
            <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </th>
                            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {[...Array(5)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                    <div className="h-4 bg-gray-300 rounded"></div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                    <div className="h-4 bg-gray-300 rounded w-1/2 ml-auto"></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    if (isError) return <p className="text-center text-red-500 py-4">Gagal memuat detail statistik.</p>;

    if (data.length === 0) {
        return <p className="text-center text-gray-500 py-4 italic">Tidak ada data untuk status yang dipilih.</p>;
    }

    return (
        <div className="overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategori
                        </th>
                        <th scope="col" className="w-1/4 px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jumlah
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item) => (
                        <tr key={item.category}>
                            <td className="px-4 py-2 whitespace-normal text-sm text-gray-700">{item.category}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-medium text-right">{item.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

/**
 * Komponen "kanvas" yang menampilkan visualisasi detail statistik tiket.
 * Komponen ini hanya me-render sesuatu ketika `isEnabled` adalah `true`. Komponen ini mengambil data rinciannya
 * sendiri menggunakan hook `useRegionStatsDetails` dan memungkinkan pengguna untuk memfilter
 * data berdasarkan status tiket menggunakan `StatusFilterPill`.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.isEnabled - Bendera untuk mengontrol visibilitas komponen. Jika `false`, komponen mengembalikan `null`.
 * @param {string} props.regionCode - Kode wilayah untuk mengambil data statistik.
 * @param {{startDate: Date, endDate: Date}} props.dateRange - Rentang tanggal untuk mengambil data statistik.
 * @returns {JSX.Element|null} Komponen kanvas statistik, atau `null` jika tidak diaktifkan.
 */
const StatisticsCanvas = ({ isEnabled, regionCode, dateRange }) => {
    const [activeFilter, setActiveFilter] = useState(TICKET_STATUSES[0].key);
    const shouldFetch = isEnabled;

    const { data: statsDetails, isLoading, isError } = useRegionStatsDetails(
        regionCode,
        dateRange,
        activeFilter,
        shouldFetch
    );

    const processedData = useMemo(() => {
        if (!statsDetails) {
            return [];
        }
        return statsDetails;

    }, [statsDetails]);

    const handleFilterChange = (statusKey) => {
        setActiveFilter(statusKey);
    };

    if (!isEnabled) {
        return null;
    }

    return (
        <div className="mt-4 p-4 border-t border-gray-200">
            <header className="flex flex-col gap-4 mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Detail Statistik per Kategori</h2>

                <div className="flex flex-wrap items-center gap-2">
                    {TICKET_STATUSES.map(status => (
                        <StatusFilterPill
                            key={status.key}
                            label={status.label}
                            statusKey={status.key}
                            isChecked={activeFilter === status.key}
                            onChange={handleFilterChange}
                        />
                    ))}
                </div>
            </header>

            <CombinedCategoryTable
                data={processedData}
                isLoading={isLoading}
                isError={isError}
            />
        </div>
    );
};

export default StatisticsCanvas;