import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email, password, apiUrl } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rhidApiUrl = apiUrl || "https://www.rhid.com.br/v2";

    console.log("Attempting RHiD authentication...");
    console.log("URL:", `${rhidApiUrl}/login`);
    console.log("Email:", email);

    const rhidResponse = await fetch(`${rhidApiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    console.log("RHiD Response status:", rhidResponse.status);

    const responseText = await rhidResponse.text();
    console.log("RHiD Response body:", responseText);

    if (!rhidResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Falha na autenticação com RHiD",
          status: rhidResponse.status,
          details: responseText,
        }),
        {
          status: rhidResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = JSON.parse(responseText);

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: data.accessToken,
        data: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao processar autenticação",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
