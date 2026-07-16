export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Purge orphaned pending uploads (file + row) on server start.
    const { cleanupExpiredUploads } = await import("@/lib/uploads");
    await cleanupExpiredUploads().catch((err) =>
      console.error("Startup upload cleanup failed:", err)
    );
  }
}
