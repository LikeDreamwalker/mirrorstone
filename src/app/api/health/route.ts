export async function GET() {
  try {
    // Simple health check
    if (!process.env.DEEPSEEK_API_KEY) {
      return new Response("API key not configured", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Service unavailable", { status: 503 });
  }
}
