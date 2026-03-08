/**
 * Ensures all src/*.ts files are under 250 lines.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
const MAX_LINES = 250;

// Files intentionally large (e.g., inlined data/prompts)
const EXEMPT = new Set<string>();

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

let violations = 0;
const files = collectTsFiles(SRC);

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const lineCount = content.split('\n').length;
  const relPath = relative(SRC, file);

  if (lineCount > MAX_LINES && !EXEMPT.has(relPath)) {
    console.error(`VIOLATION: ${relPath} has ${lineCount} lines (max: ${MAX_LINES})`);
    violations++;
  }
}

if (violations > 0) {
  console.error(`\n${violations} file(s) exceed ${MAX_LINES} lines.`);
  process.exit(1);
} else {
  console.info(`File size check passed (all files under ${MAX_LINES} lines).`);
}
