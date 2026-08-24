/**
 * Ambient asset module declarations for the generated DSH asset map.
 * The esbuild DSH client build inlines these imports as data URLs; the
 * standalone Vite workflow never resolves them directly.
 */

declare module '*.webp' {
  const url: string
  export default url
}

declare module '*.png' {
  const url: string
  export default url
}
