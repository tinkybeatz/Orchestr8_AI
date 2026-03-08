/**
 * Circular dependency detection using madge.
 */
import madge from 'madge';
import { resolve } from 'node:path';

const SRC = resolve(import.meta.dirname, '..', 'src');

const result = await madge(SRC, {
  fileExtensions: ['ts'],
  tsConfig: resolve(import.meta.dirname, '..', 'tsconfig.json'),
});

const cycles = result.circular();

if (cycles.length > 0) {
  console.error('Circular dependencies detected:');
  for (const cycle of cycles) {
    console.error(`  ${cycle.join(' -> ')}`);
  }
  process.exit(1);
} else {
  console.info('No circular dependencies found.');
}
