import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, 'public', 'data', 'batas-administrasi');

const directoriesToIndex = ['kab-kota', 'kecamatan', 'desa'];

function generateIndexes(startPath) {
  if (!fs.existsSync(startPath)) {
    console.warn(`Direktori tidak ditemukan: ${startPath}, skipping.`);
    return;
  }

  const items = fs.readdirSync(startPath, { withFileTypes: true });

  const topojsonFiles = items
    .filter(item => item.isFile() && item.name.endsWith('.topojson'))
    .map(item => item.name);

  if (topojsonFiles.length > 0) {
    const indexPath = path.join(startPath, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(topojsonFiles, null, 2));
    console.log(`✅ index.json dibuat di: ${startPath}`);
  }

  const subDirectories = items.filter(item => item.isDirectory());
  for (const dir of subDirectories) {
    generateIndexes(path.join(startPath, dir.name));
  }
}

console.log('🚀 Memulai proses pembuatan indeks otomatis...');
directoriesToIndex.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  generateIndexes(fullPath);
});
console.log('✨ Proses selesai.');