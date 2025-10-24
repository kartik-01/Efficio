export async function loadRemoteSafely(importFn: () => Promise<any>) {
  try {
    const mod = await importFn();
    if (!mod || (!mod.default && typeof mod !== "function")) {
      console.warn("[loadRemoteSafely] invalid default export:", mod);
      return { default: null };
    }
    return mod;
  } catch (e: any) {
    const msg = e?.message || "";
    if (
      /Failed to fetch|Script error|Loading chunk|ChunkLoadError|network error/i.test(
        msg
      )
    ) {
      console.warn("[loadRemoteSafely] remote rebuilding, skipping…");
      return { default: null };
    }
    console.error("[loadRemoteSafely] fatal remote error:", e);
    return { default: null };
  }
}
