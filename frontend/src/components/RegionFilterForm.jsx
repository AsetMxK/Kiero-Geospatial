import { useBoundaryData } from '../hooks/useBoundaryData';

const SelectDropdown = ({ label, placeholder, disabled = false, options, value, onChange }) => {
    const selectId = `select-form-${label.replace(/\s+/g, '-')}`;
    return (
        <div className="flex-1 min-w-[200px]">
            <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <select
                id={selectId}
                disabled={disabled}
                value={value || ""}
                onChange={onChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
                <option value="">{placeholder}</option>
                {options.filter(item => item && item.name).sort((a, b) => a.name.localeCompare(b.name)).map((opt, index) => (
                    <option key={`${opt.value}-${index}`} value={opt.value}>
                        {opt.name}
                    </option>
                ))}
            </select>
        </div>
    );
};

/**
 * Komponen form yang menyediakan serangkaian dropdown bertingkat untuk memfilter
 * tampilan peta berdasarkan wilayah administratif (Provinsi, Kab/Kota, Kecamatan, Desa).
 * Data untuk setiap dropdown diambil secara dinamis menggunakan hook `useBoundaryData`.
 *
 * @param {object} props - Properti komponen.
 * @param {object} props.currentSelection - Objek yang menyimpan kode wilayah yang saat ini dipilih (provinceCode, kabkotaCode, dll.).
 * @param {Function} props.onSelectionChange - Fungsi callback yang dipanggil dengan objek seleksi baru ketika pilihan pengguna berubah.
 * @returns {JSX.Element} Komponen form filter wilayah.
 */
const RegionFilterForm = ({ currentSelection, onSelectionChange }) => {
    const { data: provinsiData, loading: provinsiLoading } = useBoundaryData({ level: 'provinsi' });
    const { data: kabkotaData, loading: kabkotaLoading } = useBoundaryData({ level: 'kabkota', provinceCode: currentSelection.provinceCode });
    const { data: kecamatanData, loading: kecamatanLoading } = useBoundaryData({ level: 'kecamatan', provinceCode: currentSelection.provinceCode, kabkotaCode: currentSelection.kabkotaCode });
    const { data: desaData, loading: desaLoading } = useBoundaryData({ level: 'desa', provinceCode: currentSelection.provinceCode, kabkotaCode: currentSelection.kabkotaCode, kecamatanCode: currentSelection.kecamatanCode });

    const handleProvinceChange = (e) => {
        const provinceCode = e.target.value;
        onSelectionChange({ provinceCode: provinceCode || undefined });
    };

    const handleKabkotaChange = (e) => {
        const kabkotaCode = e.target.value;
        onSelectionChange({
            ...currentSelection,
            kabkotaCode: kabkotaCode || undefined,
            kecamatanCode: undefined,
            desaName: undefined,
        });
    };

    const handleKecamatanChange = (e) => {
        const kecamatanCode = e.target.value;
        onSelectionChange({
            ...currentSelection,
            kecamatanCode: kecamatanCode || undefined,
            desaName: undefined,
        });
    };

    const handleDesaChange = (e) => {
        const desaName = e.target.value;
        onSelectionChange({
            ...currentSelection,
            desaName: desaName || undefined,
        });
    };

    const provinceOptions = provinsiData.map(p => ({ value: p.properties.kode_prov, name: p.properties.nama }));

    const kabkotaOptions = currentSelection.provinceCode
        ? kabkotaData
            .filter(k => k.properties.kode_prov === currentSelection.provinceCode)
            .map(k => ({ value: k.properties.kode_kab, name: k.properties.nama }))
        : [];

    const kecamatanOptions = currentSelection.kabkotaCode
        ? kecamatanData
            .filter(k => k.properties.kode_kab === currentSelection.kabkotaCode)
            .map(k => ({ value: k.properties.kode_kec, name: k.properties.nama }))
        : [];

    const desaOptions = currentSelection.kecamatanCode
        ? desaData
            .filter(d => d.properties.kode_kec === currentSelection.kecamatanCode)
            .map(d => ({ value: d.properties.nama, name: d.properties.nama }))
        : [];

    return (
        <div className="w-full bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Filter Wilayah</h2>
            <div className="flex flex-wrap gap-4">
                <SelectDropdown label="Provinsi" value={currentSelection.provinceCode} onChange={handleProvinceChange} options={provinceOptions} placeholder={provinsiLoading ? "Memuat..." : "-- Pilih Provinsi --"} disabled={provinsiLoading} />
                <SelectDropdown label="Kabupaten/Kota" value={currentSelection.kabkotaCode} onChange={handleKabkotaChange} options={kabkotaOptions} placeholder={kabkotaLoading ? "Memuat..." : "-- Pilih Kab/Kota --"} disabled={!currentSelection.provinceCode || kabkotaLoading} />
                <SelectDropdown label="Kecamatan" value={currentSelection.kecamatanCode} onChange={handleKecamatanChange} options={kecamatanOptions} placeholder={kecamatanLoading ? "Memuat..." : "-- Pilih Kecamatan --"} disabled={!currentSelection.kabkotaCode || kecamatanLoading} />
                <SelectDropdown label="Desa/Kelurahan" value={currentSelection.desaName} onChange={handleDesaChange} options={desaOptions} placeholder={desaLoading ? "Memuat..." : "-- Pilih Desa/Kelurahan --"} disabled={!currentSelection.kecamatanCode || desaLoading} />
            </div>
        </div>
    );
};

export default RegionFilterForm;