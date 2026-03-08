/**
 * CI guard: enforces hexagonal dependency direction.
 * domain must NOT import from adapters, infrastructure, or contracts.
 * application must NOT import from adapters or infrastructure.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');

const FORBIDDEN: Record<string, string[]> = {
  domain: ['adapters', 'infrastructure', 'contracts'],
  application: ['adapters', 'infrastructure'],
};

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

for (const [layer, banned] of Object.entries(FORBIDDEN)) {
  const layerDir = join(SRC, layer);
  try {
    const files = collectTsFiles(layerDir);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const relPath = relative(SRC, file);
      for (const target of banned) {
        // Match both relative and path-alias imports
        const patterns = [
          new RegExp(`from\\s+['"].*/${target}/`, 'g'),
          new RegExp(`from\\s+['"]@${target}/`, 'g'),
          new RegExp(`import\\s+.*['"].*/${target}/`, 'g'),
        ];
        for (const pattern of patterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const m of matches) {
              console.error(`VIOLATION: ${relPath} imports from ${target}: ${m.trim()}`);
              violations++;
            }
          }
        }
      }
    }
  } catch {
    // Layer directory may not exist yet
  }
}

if (violations > 0) {
  console.error(`\n${violations} dependency direction violation(s) found.`);
  process.exit(1);
} else {
  console.info('Dependency direction check passed.');
}
