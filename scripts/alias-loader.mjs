// Loader mínimo para rodar os checks em node puro: resolve o alias `@/` do jsconfig
// apontando para `src/`. Só existe para os scripts de check; o app usa o Next.
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import { existsSync } from 'node:fs'

const RAIZ = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = resolvePath(RAIZ, 'src')

export function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const base = resolvePath(SRC, specifier.slice(2))
    for (const tentativa of [base, `${base}.js`, `${base}.jsx`, resolvePath(base, 'index.js')]) {
      if (tentativa.endsWith('.js') || tentativa.endsWith('.jsx')) {
        if (existsSync(tentativa)) {
          return { url: pathToFileURL(tentativa).href, shortCircuit: true }
        }
      }
    }
  }
  return next(specifier, context)
}