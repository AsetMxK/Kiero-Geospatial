import MapPage from './pages/MapPage';
import SharePage from './pages/SharePage';
import IframeMapPage from './pages/IframeMapPage';

/**
 * Komponen root aplikasi, yang berfungsi sebagai router sisi klien sederhana.
 * Komponen ini memeriksa `window.location.pathname` untuk menentukan komponen halaman mana yang akan di-render.
 * - `/`: Aplikasi peta utama (`MapPage`).
 * - `/share`: Halaman untuk menampilkan lokasi yang dibagikan dan di-pin (`SharePage`).
 * - `/map-iframe`: Versi minimalis dari peta untuk disematkan di situs pihak ketiga (`IframeMapPage`).
 * Jika path tidak cocok dengan salah satu dari ini, komponen akan menampilkan halaman 404 Not Found.
 *
 * @returns {JSX.Element} Komponen halaman yang sesuai dengan path URL saat ini.
 */
const App = () => {
    const path = window.location.pathname;

    if (path === '/share') {
        return <SharePage />;
    }

    if (path === '/map-iframe') {
        return <IframeMapPage />;
    }

    if (path === '/') {
        return <MapPage />;
    }

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">404 - Halaman Tidak Ditemukan</h1>
            <p className="text-lg">Maaf, halaman yang Anda cari tidak ada.</p>
            <a href="/" className="mt-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Kembali ke Peta
            </a>
        </div>
    );
};

export default App;
