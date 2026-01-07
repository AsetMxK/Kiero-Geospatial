import { useState, useEffect, useRef, useMemo } from 'react';
import Tooltip from './Tooltip';

/**
 * Komponen ikon chevron bawah sederhana.
 *
 * @param {object} props - Properti komponen.
 * @param {boolean} props.disabled - Apakah ikon harus ditampilkan dalam keadaan nonaktif.
 * @returns {JSX.Element} Elemen SVG untuk ikon chevron.
 */
const ChevronDownIcon = ({ disabled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-colors ${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-600'}`}>
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
);

/**
 * Komponen dropdown pilihan kustom yang aksesibel dan dapat ditata.
 * Dibuat dari awal untuk memungkinkan fitur yang tidak tersedia pada `<select>` asli,
 * seperti opsi nonaktif yang berfungsi sebagai header, pencarian lokal, dan rendering opsi yang kompleks.
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
const CustomSelectDropdown = ({ label, placeholder, disabled = false, options = [], value, onChange, className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);
    const itemRefs = useRef([]);
    const safeOptions = Array.isArray(options) ? options : [];
    const selectedOption = options.find(opt => opt && opt.value === value);
    const selectedName = selectedOption ? selectedOption.name : placeholder;

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        let results = safeOptions;
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            results = safeOptions.filter(opt =>
                opt && (opt.disabled || (opt.name && opt.name.toLowerCase().includes(lowerQuery)))
            );
        }

        return [...results].sort((a, b) => {
            const nameA = a?.name?.toLowerCase() || '';
            const nameB = b?.name?.toLowerCase() || '';
            return nameA.localeCompare(nameB, 'id', { sensitivity: 'base' });
        });
    }, [safeOptions, searchQuery]);

    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, filteredOptions.length);
    }, [filteredOptions]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchQuery, isOpen]);

    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
            requestAnimationFrame(() => {
                itemRefs.current[highlightedIndex]?.scrollIntoView({
                    inline: 'nearest',
                    block: 'nearest',
                });
            });
        }
    }, [highlightedIndex, isOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery(''); // Reset search on close
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleOptionClick = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleKeyDown = (e) => {
        // Jika tertutup, Enter/Panah Bawah akan membukanya
        if (!isOpen) {
            if (!disabled && (e.key === 'Enter' || e.key === 'ArrowDown')) {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        if (filteredOptions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            // Loop ke bawah
            setHighlightedIndex(prev => {
                const nextIndex = (prev + 1) % filteredOptions.length;
                return nextIndex;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Loop ke atas
            setHighlightedIndex(prev => {
                const nextIndex = (prev - 1 + filteredOptions.length) % filteredOptions.length;
                return nextIndex;
            });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                const selected = filteredOptions[highlightedIndex];
                if (selected && !selected.disabled) {
                    handleOptionClick(selected.value);
                }
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <div ref={wrapperRef} className="w-full">
            {label && <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-0.5">{label}</label>}
            <div className="relative">
                <Tooltip content={selectedName} enabled={!!selectedOption && !isOpen}>
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        className={`
                            group w-full pl-2.5 pr-2 py-1.5 text-xs text-left rounded-lg border transition-all duration-200
                            grid grid-cols-1 items-center shadow-sm
                            ${disabled
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75'
                                : 'bg-white border-gray-200 hover:border-blue-400 hover:ring-2 hover:ring-blue-50 cursor-pointer'
                            }
                            ${isOpen ? 'ring-2 ring-blue-100 border-blue-500' : ''}
                            ${className}
                        `}
                    >
                        <span className="[grid-area:1/1] pr-6 flex items-center">
                            <span className={`truncate ${disabled ? 'text-gray-400' : value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                {selectedName}
                            </span>
                        </span>

                        <span className={`[grid-area:1/1] justify-self-end transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon disabled={disabled} />
                        </span>
                    </button>
                </Tooltip>

                {isOpen && (
                    <div className="absolute z-50 mt-1.5 w-full bg-white shadow-xl rounded-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="block w-full pl-8 pr-2 py-1 border border-gray-200 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs transition-colors"
                                    placeholder="Cari..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        </div>

                        <ul className="max-h-60 overflow-auto custom-scrollbar py-1 scroll-p-1">
                            <li
                                onClick={() => handleOptionClick('')}
                                className="text-gray-500 italic cursor-pointer select-none relative py-1.5 pl-3 pr-2 hover:bg-gray-50 transition-colors text-xs"
                            >
                                {placeholder}
                            </li>

                            {filteredOptions.length === 0 ? (
                                <li className="text-gray-400 text-center py-2 text-xs italic">
                                    Tidak ada hasil
                                </li>
                            ) : (
                                filteredOptions.filter(item => item && item.name).map((opt, index) => {
                                    const nameParts = opt.name.split(' - ');
                                    const prefix = nameParts.length > 1 ? `${nameParts[0]} -` : null;
                                    const mainText = nameParts.length > 1 ? nameParts.slice(1).join(' - ') : opt.name;
                                    const isSelected = value === opt.value;
                                    const isHighlighted = index === highlightedIndex;

                                    if (opt.disabled) {
                                        return (
                                            <li
                                                key={`${opt.value}-${index}`}
                                                ref={(el) => (itemRefs.current[index] = el)}
                                                className="text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none relative py-1.5 pl-3 pr-2 bg-gray-50/50 mt-1 first:mt-0"
                                            >
                                                {opt.name}
                                            </li>
                                        );
                                    }

                                    return (
                                        <li
                                            key={`${opt.value}-${index}`}
                                            ref={(el) => (itemRefs.current[index] = el)}
                                            onClick={() => handleOptionClick(opt.value)}
                                            className={`
                                                cursor-pointer select-none relative py-1.5 pl-3 pr-2 text-xs
                                                ${isSelected ? 'bg-blue-50 text-blue-700' : ''}
                                                ${isHighlighted && !isSelected ? 'bg-blue-50' : ''}
                                                ${!isSelected && !isHighlighted ? 'text-gray-700 hover:bg-gray-50 hover:text-gray-900' : ''}
                                            `}
                                        >
                                            <div className={`flex items-baseline ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                                                {prefix && <span className="flex-shrink-0 mr-1.5 opacity-75">{prefix}</span>}
                                                <span className="min-w-0 break-words">{mainText}</span>
                                                {isSelected && (
                                                    <span className="absolute right-3 inset-y-0 flex items-center text-blue-600">
                                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomSelectDropdown;