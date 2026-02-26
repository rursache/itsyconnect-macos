export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Trigger env validation and auto-generation of ENCRYPTION_MASTER_KEY
    await import("./lib/env");
  }
}
