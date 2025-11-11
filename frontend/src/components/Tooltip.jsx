import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/translucent.css';

/**
 * Komponen pembungkus (wrapper) di sekitar pustaka Tippy.js untuk menyediakan tooltip
 * yang konsisten di seluruh aplikasi. Komponen ini mengonfigurasi beberapa properti default
 * yang sesuai dengan gaya aplikasi.
 *
 * @param {object} props - Properti komponen, yang akan diteruskan langsung ke komponen Tippy.
 * @param {React.ReactNode} props.children - Elemen anak yang akan memicu tooltip.
 * @param {string} props.content - Konten teks atau HTML yang akan ditampilkan di dalam tooltip.
 * @returns {JSX.Element} Komponen Tooltip.
 */
const Tooltip = ({ children, ...props }) => {
  return (
    <Tippy
      theme="translucent"
      arrow={false}
      offset={[0, 8]}
      duration={[200, 150]}
      {...props}
    >
      <span>{children}</span>
    </Tippy>
  );
};

export default Tooltip;