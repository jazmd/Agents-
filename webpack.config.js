import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: './bin/cli.js',
  output: {
    filename: 'ruflo.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'node',
};
