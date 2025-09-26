// This is a server-side API route that acts as a proxy
// for the external ACARS API. This bypasses client-side CORS restrictions.

export async function GET(request: Request) {
  try {
    const externalApiUrl = 'https://jalvirtual.com/apiacars';
    console.log(`[API Route] Fetching from external API: ${externalApiUrl}`);

    const response = await fetch(externalApiUrl, {
      // Optionally, you can add headers if the external API requires them
      // headers: {
      //   'Authorization': `Bearer YOUR_API_KEY`,
      //   'Content-Type': 'application/json',
      // },
      // Important: node-fetch (which Next.js's native fetch uses) doesn't
      // respect 'no-cors' mode, but this server-side fetch effectively
      // bypasses the browser's CORS.
      cache: 'no-store', // Ensures fresh data is fetched every time
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Route] External API responded with status ${response.status}: ${errorText}`);
      // Re-throw or return an appropriate error response
      return new Response(`Failed to fetch data from external ACARS API: ${errorText}`, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const data = await response.json();
    console.log('[API Route] Successfully fetched data from external API.');

    // Return the data directly to your frontend
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[API Route] Error processing ACARS proxy request: ${error}`);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}