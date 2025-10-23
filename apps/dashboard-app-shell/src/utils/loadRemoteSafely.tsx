/**
 * Tries to dynamically import a remote module.
 * Returns null if the remoteEntry fails to load.
 */
export async function loadRemoteSafely<T = any>(remoteImport: () => Promise<T>): Promise<T | null> {
  try {
    const module = await remoteImport();
    return module;
  } catch (err) {
    console.error("⚠️ Failed to load remote module:", err);
    return null;
  }
}
