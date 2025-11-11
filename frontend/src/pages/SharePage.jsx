import { useState, useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import RegionFilterForm from '../components/RegionFilterForm';
import CategoryFilterForm from '../components/CategoryFilterForm';
import { useBoundaryData } from '../hooks/useBoundaryData';

/**
 * Komponen halaman mandiri yang berfungsi sebagai alat bantu untuk membuat URL berbagi.
 * Halaman ini memungkinkan pengguna memilih wilayah dan kategori menggunakan komponen filter,
 * lalu menghasilkan URL yang dapat disalin atau dibuka, yang akan memuat `MapPage`
 * dengan state yang telah dipilih sebelumnya.
 *
 * @returns {JSX.Element} Halaman pembuat tautan berbagi.
 */
const SharePage = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const [selection, setSelection] = useState({});
    const [categorySelection, setCategorySelection] = useState(null);

    // Fetch data required to map codes to names for URL generation
    const { data: provinsiData } = useBoundaryData({ level: 'provinsi' });
    const { data: kabkotaData } = useBoundaryData({ level: 'kabkota', provinceCode: selection.provinceCode });
    const { data: kecamatanData } = useBoundaryData({ level: 'kecamatan', provinceCode: selection.provinceCode, kabkotaCode: selection.kabkotaCode });

    const generatedUrl = useMemo(() => {
        const baseUrl = `${window.location.origin}/`;
        const params = new URLSearchParams();

        if (selection.provinceCode) {
            const prov = provinsiData.find(p => p.properties.kode_prov === selection.provinceCode);
            if (prov) params.set('provinsi', prov.properties.nama);
        }
        if (selection.kabkotaCode) {
            const kab = kabkotaData.find(k => k.properties.kode_kab === selection.kabkotaCode);
            if (kab) params.set('kabkota', kab.properties.nama);
        }
        if (selection.kecamatanCode) {
            const kec = kecamatanData.find(k => k.properties.kode_kec === selection.kecamatanCode);
            if (kec) params.set('kecamatan', kec.properties.nama);
        }
        if (selection.desaName) {
            params.set('desakel', selection.desaName);
        }
        
        if (categorySelection) {
            params.set('category', categorySelection);
        }

        const paramString = params.toString();
        return paramString ? `${baseUrl}?${paramString}` : baseUrl;
    }, [selection, provinsiData, kabkotaData, kecamatanData, categorySelection]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedUrl)
            .then(() => alert('URL disalin ke clipboard!'))
            .catch(err => console.error('Gagal menyalin URL: ', err));
    };

    const openInNewTab = () => {
        window.open(generatedUrl, '_blank');
    };

    const handleSelectionChange = (newSelection) => {
        setSelection(newSelection);
    };

    if (!apiKey) {
        return <div className="w-screen h-screen flex items-center justify-center">API Key untuk Google Maps tidak ditemukan.</div>;
    }

    return (
        <APIProvider apiKey={apiKey}>
            <div className="w-screen min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <main className="w-full max-w-4xl">
                    <RegionFilterForm
                        currentSelection={selection}
                        onSelectionChange={handleSelectionChange}
                    />
                    <CategoryFilterForm 
                        currentSelection={categorySelection}
                        onSelectionChange={setCategorySelection}
                    />
                    <div className="w-full p-8 bg-white rounded-lg shadow-md text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Tautan Berbagi Anda</h1>
                        <p className="text-gray-600 mb-6">
                            Gunakan formulir di atas untuk memilih wilayah dan membuat URL khusus.
                        </p>

                        <div className="w-full p-4 mb-6 bg-gray-50 border rounded-md text-left overflow-x-auto">
                            <code className="text-sm text-gray-700 whitespace-nowrap">{generatedUrl}</code>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={copyToClipboard}
                                className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                            >
                                Salin URL
                            </button>
                            <button
                                onClick={openInNewTab}
                                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                            >
                                Buka di Tab Baru
                            </button>
                        </div>
                         <a href="/" className="mt-8 inline-block px-4 py-2 text-sm text-blue-500 hover:underline">
                            Kembali ke Peta Utama
                        </a>
                    </div>
                </main>
            </div>
        </APIProvider>
    );
};

export default SharePage;