import { useState, useEffect, useRef } from 'react';
import Tooltip from './Tooltip';

/**
 * Komponen ikon chevron bawah sederhana.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.disabled - Apakah ikon harus ditampilkan dalam keadaan nonaktif.
 * @returns {JSX.Element} Elemen SVG untuk ikon chevron.
 */
const ChevronDownIcon = ({ disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
);

/**
 * Komponen dropdown pilihan kustom yang aksesibel dan dapat ditata.
 * Dibuat dari awal untuk memungkinkan fitur yang tidak tersedia pada `<select>` asli,
 * seperti opsi nonaktif yang berfungsi sebagai header dan rendering opsi yang kompleks.
 *
 * @param {object} props - Properti komponen.
 * @param {string} [props.label] - Label opsional untuk ditampilkan di atas dropdown.
 * @param {string} props.placeholder - Teks placeholder untuk ditampilkan saat tidak ada nilai yang dipilih.
 * @param {boolean} [props.disabled=false] - Apakah dropdown interaktif.
 * @param {Array<{value: string, name: string, disabled?: boolean}>} props.options - Daftar opsi. Opsi dengan `disabled: true` di-render sebagai header yang tidak dapat dipilih.
 * @param {string|undefined} props.value - Nilai opsi yang saat ini dipilih.
 * @param {Function} props.onChange - Fungsi callback yang menerima objek event seperti `{ target: { value } }` saat sebuah opsi dipilih.
 * @returns {JSX.Element} Komponen dropdown pilihan kustom.
 */
const CustomSelectDropdown = ({ label, placeholder, disabled = false, options, value, onChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const selectedOption = options.find(opt => opt && opt.value === value);
    const selectedName = selectedOption ? selectedOption.name : placeholder;

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleOptionClick = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef}>
            {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
            <div className="relative mt-1">
                <Tooltip content={selectedName} enabled={!!selectedOption}>
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        className={`
                            w-full pl-2 pr-2 py-1.5 text-sm text-left rounded-md border border-gray-300
                            bg-white grid grid-cols-1 items-center
                            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}
                            ${className}
                        `}
                    >
                        <span className="[grid-area:1/1] pr-6 flex items-center">
                            <span className={`truncate ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
                                {selectedName}
                            </span>
                        </span>

                        <span className={`[grid-area:1/1] justify-self-end transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon disabled={disabled} />
                        </span>
                    </button>
                </Tooltip>

                {isOpen && (
                    <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none custom-scrollbar">
                        <li
                            onClick={() => handleOptionClick('')} 
                            className="text-gray-500 italic cursor-pointer select-none relative py-2 pl-3 pr-2 hover:bg-gray-100"
                        >
                            {placeholder}
                        </li>
                        {options.filter(item => item && item.name).map((opt, index) => {
                            const nameParts = opt.name.split(' - ');
                            const prefix = nameParts.length > 1 ? `${nameParts[0]} -` : null;
                            const mainText = nameParts.length > 1 ? nameParts.slice(1).join(' - ') : opt.name;

                            if (opt.disabled) {
                                return (
                                    <li
                                        key={`${opt.value}-${index}`}
                                        className="text-gray-500 font-bold select-none relative py-2 pl-3 pr-2"
                                    >
                                        {opt.name}
                                    </li>
                                );
                            }

                            return (
                                <li
                                    key={`${opt.value}-${index}`}
                                    onClick={() => handleOptionClick(opt.value)}
                                    className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-2 hover:bg-gray-100"
                                >
                                    <div className={`flex items-baseline ${value === opt.value ? 'font-semibold' : 'font-normal'}`}>
                                        {prefix && <span className="flex-shrink-0 mr-1.5">{prefix}</span>}
                                        <span className="min-w-0">{mainText}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CustomSelectDropdown;