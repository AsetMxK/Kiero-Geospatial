import { Routes, Route, Link } from 'react-router-dom';
import MapPage from './pages/MapPage';
import SharePage from './pages/SharePage';
import IframeMapPage from './pages/IframeMapPage';
import IframeMapPageClientAuth from './pages/IframeMapPageClientAuth';
import IframeFullMapPage from './pages/IframeFullMapPage';
import GlobalErrorHandler from './components/GlobalErrorHandler';

/**
 * Komponen halaman 404 (Not Found) sederhana.
 * Ditampilkan oleh router ketika tidak ada rute lain yang cocok.
 * Menyertakan <Link> (dari React Router) untuk kembali ke halaman utama.
 * @returns {JSX.Element} Halaman 404.
 */
const NotFound = () => (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">404 - Halaman Tidak Ditemukan</h1>
        <p className="text-lg">Maaf, halaman yang Anda cari tidak ada.</p>
        <Link to="/" className="mt-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Kembali ke Peta
        </Link>
    </div>
);

/**
 * Komponen root aplikasi yang mengatur routing sisi klien menggunakan React Router.
 * Komponen ini mendefinisikan rute-rute utama aplikasi dan me-render
 * komponen halaman yang sesuai berdasarkan URL saat ini.
 * * Rute yang Didefinisikan:
 * - `/`: Aplikasi peta utama (`MapPage`).
 * - `/share`: Halaman untuk menampilkan lokasi yang dibagikan (`SharePage`).
 * - `/map-iframe`: Versi peta minimalis untuk disematkan (`IframeMapPage`).
 * - `*` (catch-all): Halaman 404 (`NotFound`) jika tidak ada rute lain yang cocok.
 *
 * Catatan: Semua path ini relatif terhadap `basename` yang diatur dalam
 * `<BrowserRouter>` di `main.jsx`.
 *
 * @returns {JSX.Element} Komponen <Routes> yang berisi halaman aktif.
 */
const App = () => {

    return (
        <>
            <GlobalErrorHandler />
            <Routes>
                <Route path="/" element={<MapPage />} />
                <Route path="/share" element={<SharePage />} />
                <Route path="/map-iframe" element={<IframeMapPage />} />
                <Route path="/map-iframe-client" element={<IframeMapPageClientAuth />} />
                <Route path="/map-iframe-full" element={<IframeFullMapPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
};

export default App;
