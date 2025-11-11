import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef } from 'react';

/**
 * Komponen React kustom yang me-render label teks langsung di atas kanvas Google Map.
 * Komponen ini memanfaatkan kelas `OverlayView` dari Google Maps untuk membuat overlay HTML
 * kustom untuk setiap label. Komponen ini adalah komponen "headless" karena tidak me-render
 * DOM-nya sendiri, melainkan secara imperatif mengelola instance `OverlayView`.
 *
 * @param {object} props - Properti komponen.
 * @param {google.maps.LatLng | {lat: number, lng: number}} props.position - Posisi geografis untuk label.
 * @param {string} props.text - Konten teks dari label.
 * @param {string} [props.color='#1f2937'] - Warna teks label.
 * @returns {null} Komponen ini tidak me-render output apa pun.
 */
const MapLabel = ({ position, text, color = '#1f2937' }) => {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const overlayViewRef = useRef(null);
  const divRef = useRef(null);

  useEffect(() => {
    if (!map || !maps) return;

    class CustomOverlay extends maps.OverlayView {
      constructor(pos, content, clr) {
        super();
        this.div = null;
        this.pos = pos;
        this.content = content;
        this.clr = clr;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.whiteSpace = 'nowrap';
        this.div.style.transform = 'translate(-50%, -50%)';
        this.div.style.color = '#000';
        this.div.style.fontSize = '21px';
        this.div.style.fontWeight = '700';
        this.div.style.pointerEvents = 'none';
        this.div.style.textShadow = '1px 1px 0px #FFF, -1px -1px 0px #FFF, 1px -1px 0px #FFF, -1px 1px 0px #FFF, 0px 0px 4px #FFF';
        this.div.innerHTML = this.content;
        divRef.current = this.div;

        const panes = this.getPanes();
        panes?.overlayMouseTarget.appendChild(this.div);
      }

      draw() {
        const overlayProjection = this.getProjection();
        if (!overlayProjection || !this.div) return;

        const point = overlayProjection.fromLatLngToDivPixel(this.pos);
        if (point) {
          this.div.style.left = `${point.x}px`;
          this.div.style.top = `${point.y}px`;
        }
      }

      onRemove() {
        if (this.div) {
          this.div.parentNode?.removeChild(this.div);
          this.div = null;
          divRef.current = null;
        }
      }
    }

    overlayViewRef.current = new CustomOverlay(position, text, color);
    overlayViewRef.current.setMap(map);

    return () => {
      overlayViewRef.current?.setMap(null);
    };
  }, [map, maps, position, text, color]);

  return null;
};

export default MapLabel;