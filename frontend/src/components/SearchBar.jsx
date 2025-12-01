
import { useRef, useEffect, useState, useMemo } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useGeoSearch } from '../hooks/useGeoSearch';

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SearchBar = ({ onPlaceSelect }) => {
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [googlePredictions, setGooglePredictions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);

  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [placesService, setPlacesService] = useState(null);

  const {
    data: localPredictions = [],
    isLoading: isLocalLoading
  } = useGeoSearch(debouncedValue);

  useEffect(() => {
    if (placesLib && !autocompleteService) {
      setAutocompleteService(new placesLib.AutocompleteService());
    }
    if (placesLib && map && !placesService) {
      setPlacesService(new placesLib.PlacesService(map));
    }
  }, [placesLib, map, autocompleteService, placesService]);

  // Debounce implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
      if (inputValue.length <= 2) {
        setGooglePredictions([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Fetch Google Predictions
  useEffect(() => {
    if (debouncedValue.length > 2 && autocompleteService) {
      autocompleteService.getPlacePredictions({
        input: debouncedValue,
        componentRestrictions: { country: 'id' },
        types: ['geocode', 'establishment']
      }, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setGooglePredictions(predictions);
        } else {
          setGooglePredictions([]);
        }
      });
      setIsOpen(true);
    }
  }, [debouncedValue, autocompleteService]);

  const isLoading = isLocalLoading;
  const predictions = useMemo(() => ({
    local: localPredictions,
    google: googlePredictions
  }), [localPredictions, googlePredictions]);

  const allPredictions = useMemo(() => [
    ...predictions.local,
    ...predictions.google
  ], [predictions]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, allPredictions.length);
  }, [allPredictions]);

  const handleLocalSelect = (feature) => {
    setInputValue(feature.properties.nama);
    setIsOpen(false);
    onPlaceSelect(feature);
  };

  const handleGoogleSelect = (placePrediction) => {
    setInputValue(placePrediction.description);
    setIsOpen(false);

    if (!placesService) return;

    placesService.getDetails({
      placeId: placePrediction.place_id,
      fields: ['geometry', 'name', 'formatted_address', 'types', 'address_components']
    }, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry && place.geometry.location) {
        onPlaceSelect(place);
      }
    });
  };

  const handleClear = () => {
    setInputValue('');
    setGooglePredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Reset highlighted index when predictions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [predictions, isOpen]);

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

  const handleKeyDown = (e) => {
    if (!isOpen || allPredictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % allPredictions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + allPredictions.length) % allPredictions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (highlightedIndex >= 0 && highlightedIndex < allPredictions.length) {
        e.preventDefault();
        const selectedItem = allPredictions[highlightedIndex];
        if (highlightedIndex < predictions.local.length) {
          handleLocalSelect(selectedItem);
        } else {
          handleGoogleSelect(selectedItem);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
          <SearchIcon />
        </span>

        <input
          ref={inputRef}
          type="text"
          placeholder="Cari wilayah, kota, atau POI..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => inputValue.length > 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="relative w-full pl-12 pr-12 py-3 bg-white border-transparent rounded-full text-sm shadow-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 z-0"
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center">
          {isLoading ? (
            <Spinner />
          ) : inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Hapus pencarian"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {isOpen && (predictions.local.length > 0 || predictions.google.length > 0) && (
        <div ref={dropdownRef} className="absolute w-full mt-2 bg-white rounded-lg shadow-xl max-h-[60vh] overflow-y-auto custom-scrollbar z-50 border border-gray-100 py-1 scroll-p-1">
          {predictions.local.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Wilayah
              </div>
              {predictions.local.map((item, index) => {
                const isHighlighted = index === highlightedIndex;

                // Helper to determine dynamic type name
                const getTypeName = (level, tipeAdm) => {
                  if (level === 'desa') {
                    return tipeAdm === '2' ? 'kelurahan' : 'desa';
                  }
                  if (level === 'kab_kota' || level === 'kabkota') {
                    return tipeAdm === '5' ? 'Kota' : 'Kab.';
                  }
                  return level; // Fallback
                };

                const regionType = getTypeName(item.properties.level, item.properties.tipe_adm);

                // Construct hierarchical string
                const parts = [];

                // Always add the type of the current region first
                parts.push(regionType);

                if (item.properties.level === 'desa' || item.properties.level === 'kelurahan') {
                  if (item.properties.nama_kec) {
                    parts.push(`Kec. ${item.properties.nama_kec}`);
                  }
                }

                if (item.properties.level !== 'kab_kota' && item.properties.level !== 'kabkota' && item.properties.level !== 'provinsi') {
                  if (item.properties.nama_kab) {
                    const kabType = item.properties.tipe_adm_kab === '5' ? 'Kota' : 'Kab.';
                    parts.push(`${kabType} ${item.properties.nama_kab}`);
                  }
                }

                if (item.properties.level !== 'provinsi') {
                  if (item.properties.nama_prov) {
                    parts.push(`Prov. ${item.properties.nama_prov}`);
                  }
                }

                return (
                  <button
                    key={`local-${index}`}
                    ref={(el) => (itemRefs.current[index] = el)}
                    onClick={() => handleLocalSelect(item)}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 ${isHighlighted ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium text-gray-800 text-sm">{item.properties.nama}</div>
                    <div className="text-xs text-gray-500 mt-0.5 capitalize">
                      {parts.join(' • ')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {predictions.google.length > 0 && (
            <div className="py-2 border-t border-gray-100">
              <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                Google Maps
              </div>
              {predictions.google.map((item, index) => {
                const globalIndex = predictions.local.length + index;
                const isHighlighted = globalIndex === highlightedIndex;
                return (
                  <button
                    key={item.place_id}
                    ref={(el) => (itemRefs.current[globalIndex] = el)}
                    onClick={() => handleGoogleSelect(item)}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 ${isHighlighted ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                  >
                    <div className="font-medium text-gray-800 text-sm">{item.structured_formatting.main_text}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.structured_formatting.secondary_text}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )
      }
    </div >
  );
};

export default SearchBar;
