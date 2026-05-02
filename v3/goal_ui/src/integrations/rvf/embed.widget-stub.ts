/**
 * Widget-build stub for `embed.ts`.
 *
 * The embeddable widget IIFE bundle uses `inlineDynamicImports: true`
 * (per `vite.config.ts`'s widget block), which inlines every dynamic
 * import target into the single output file. The ruvector ONNX-WASM
 * loader's Node-fallback path uses `__dirname` + `readFileSync`, both
 * of which are undefined in browser context — so the loader being
 * statically reachable from the widget tree (via `goalRepo.ts`'s
 * `embedText` reference) trips a `__dirname is not defined` runtime
 * error on `/demo` and any embedder host.
 *
 * Aliasing `@/integrations/rvf/embed` → this stub for the widget
 * build only (see `vite.config.ts`'s widget `resolve.alias`) keeps
 * the main app's full embedder behaviour while the widget compiles
 * past-goal recall to a no-op. Past-goal recall is a main-app
 * feature (relies on user-local IDB history) that wouldn't work in a
 * cross-origin embed anyway.
 */

export async function embedText(_text: string): Promise<Float32Array> {
  // Returning an all-zero vector means HnswLite cosine yields 0 score
  // for every comparison — `searchPastGoals` returns no chips,
  // exactly the desired widget behaviour.
  return new Float32Array(384);
}

export async function getEmbedder(): Promise<{
  readonly dim: number;
  embedOne(text: string): Float32Array;
  embedBatch(texts: string[]): Float32Array;
}> {
  return {
    dim: 384,
    embedOne(_text: string) { return new Float32Array(384); },
    embedBatch(texts: string[]) { return new Float32Array(texts.length * 384); },
  };
}
