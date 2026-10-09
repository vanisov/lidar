import regular from '../fonts/plex-mono-400.woff2';
import semibold from '../fonts/plex-mono-600.woff2';

/**
 * IBM Plex Mono (OFL, see ../fonts/OFL.txt). The bytes ship in the content script so no page CSP can block them;
 * @font-face in a shadow root is ignored, so the faces go on document.fonts and come off when Lidar closes.
 */
export function loadFonts(): () => void {
  const faces = [
    new FontFace('Lidar Mono', regular, { weight: '400' }),
    new FontFace('Lidar Mono', semibold, { weight: '600' }),
  ];
  for (const f of faces) document.fonts.add(f);
  return () => faces.forEach(f => document.fonts.delete(f));
}
