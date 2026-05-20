import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './bin/ruflo.js',
  output: {
    filename: 'ruflo.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
};
