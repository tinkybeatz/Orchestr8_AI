/**
 * Ensures cross-module imports only go through barrel (index.ts) files.
 * e.g. importing from '../domain/model/entity.ts' instead of '../domain/index.ts'
 * is forbidden when crossing module boundaries.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const SRC = join(import.meta.dirname, '..', 'src');
const TOP_MODULES = ['domain', 'application', 'adapters', 'infrastructure', 'contracts'];

function collectTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTsFiles(full));
    } else if (full.endsWith('.ts') && !full.endsWith('index.ts')) {
      files.push(full);
    }
  }
  return files;
}

function getTopModule(filePath: string): string | null {
  const rel = relative(SRC, filePath);
  const first = rel.split('/')[0];
  return first && TOP_MODULES.includes(first) ? first : null;
}

let violations = 0;

for (const mod of TOP_MODULES) {
  const modDir = join(SRC, mod);
  try {
    const files = collectTsFiles(modDir);
    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const currentModule = getTopModule(file);

      // Match import statements
      const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1]!;
        // Resolve the import relative to the file
        const resolved = join(dirname(file), importPath.replace(/\.js$/, '.ts'));
        const targetModule = getTopModule(resolved);

        // Cross-module import that doesn't go through index
        if (targetModule && targetModule !== currentModule) {
          const relImport = relative(SRC, resolved);
          // Check if it's importing a specific file instead of through barrel
          if (!importPath.endsWith('/index.js') && !importPath.match(/\/index$/)) {
            // Allow direct file imports within adapters to their own port interfaces
            // This is expected: adapters import port interfaces directly
            const isAdapterImportingPort =
              currentModule === 'adapters' &&
              (targetModule === 'application' || targetModule === 'infrastructure');

            if (!isAdapterImportingPort) {
              const relFile = relative(SRC, file);
              console.error(
                `VIOLATION: ${relFile} imports ${relImport} directly instead of through barrel`,
              );
              violations++;
            }
          }
        }
      }
    }
  } catch {
    // Module directory may not exist
  }
}

if (violations > 0) {
  console.error(`\n${violations} deep import violation(s) found.`);
  process.exit(1);
} else {
  console.info('Deep import check passed.');
}
