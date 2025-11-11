import { useRef, useEffect, useState, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * Komponen ikon pencarian sederhana.
 * @returns {JSX.Element} Elemen SVG untuk ikon pencarian.
 */
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Komponen ikon hapus (silang dalam lingkaran) sederhana.
 * @returns {JSX.Element} Elemen SVG untuk ikon hapus.
 */
const ClearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Komponen input pencarian yang terintegrasi dengan Google Maps Places Autocomplete API.
 * Komponen ini menyediakan input teks bagi pengguna untuk mencari lokasi, dan memicu callback
 * ketika sebuah tempat dipilih dari saran pelengkapan otomatis.
 *
 * @param {object} props - Properti komponen.
 * @param {Function} props.onPlaceSelect - Fungsi callback yang dipanggil dengan objek Google Maps Place saat tempat dipilih.
 * @returns {JSX.Element} Komponen SearchBar.
 */
const SearchBar = ({ onPlaceSelect }) => {
  const inputRef = useRef(null);
  const isClearingRef = useRef(false);
  const [value, setValue] = useState('');
  const map = useMap();

  useEffect(() => {
    if (!map || !inputRef.current) return;

    const inputElement = inputRef.current;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'id' },
      fields: ['geometry', 'name', 'formatted_address', 'address_components', 'types'],
      types: ['administrative_area_level_1', 'administrative_area_level_2', 'administrative_area_level_3', 'administrative_area_level_4', 'locality'],
    });

    autocomplete.bindTo('bounds', map);

    const listener = autocomplete.addListener('place_changed', () => {
      if (isClearingRef.current) {
        return;
      }
      const place = autocomplete.getPlace();
      onPlaceSelect(place.geometry ? place : null);
      if (inputElement) {
        setValue(inputElement.value);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.clearInstanceListeners(inputElement);
    };
  }, [map, onPlaceSelect]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    isClearingRef.current = true;
    setValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    setTimeout(() => {
      isClearingRef.current = false;
    }, 100);
  }, []);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
        <SearchIcon />
      </span>

      <input
        ref={inputRef}
        type="text"
        placeholder="Cari wilayah, kota, atau POI..."
        value={value}
        onChange={handleChange}
        className="relative w-full pl-12 pr-12 py-3 bg-white border-transparent rounded-full text-sm shadow-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 z-0"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
          aria-label="Hapus pencarian"
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
