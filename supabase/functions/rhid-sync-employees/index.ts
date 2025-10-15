import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const { accessToken, apiUrl } = await req.json();

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Token de acesso é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rhidApiUrl = apiUrl || "https://www.rhid.com.br/v2";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching employees from RHiD...");
    console.log("URL:", `${rhidApiUrl}/person?start=0&length=1000`);

    const rhidResponse = await fetch(`${rhidApiUrl}/person?start=0&length=1000`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("RHiD Response status:", rhidResponse.status);

    if (!rhidResponse.ok) {
      const errorText = await rhidResponse.text();
      console.error("RHiD Error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Falha ao buscar funcionários do RHiD",
          status: rhidResponse.status,
          details: errorText,
        }),
        {
          status: rhidResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responseData = await rhidResponse.json();
    const rhidEmployees = responseData.data || responseData || [];

    console.log(`Found ${rhidEmployees.length} employees`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const rhidEmployee of rhidEmployees) {
      try {
        const { data: existingEmployee } = await supabase
          .from("employees")
          .select("id")
          .eq("rhid_employee_id", rhidEmployee.id.toString())
          .maybeSingle();

        const employeeData = {
          employee_code: rhidEmployee.code?.toString() || "",
          name: rhidEmployee.name || "",
          document: rhidEmployee.cpf?.toString() || null,
          payroll_number: rhidEmployee.registration || "000000",
          company_payroll_number: "000000",
          rhid_employee_id: rhidEmployee.id.toString(),
          last_synced_at: new Date().toISOString(),
          sync_status: "synced",
          active: rhidEmployee.status === 1,
        };

        if (existingEmployee) {
          const { error } = await supabase
            .from("employees")
            .update(employeeData)
            .eq("id", existingEmployee.id);

          if (error) throw error;

          await supabase.from("employee_sync_log").insert({
            employee_id: existingEmployee.id,
            rhid_employee_id: rhidEmployee.id.toString(),
            sync_type: "update",
            sync_status: "success",
            sync_data: rhidEmployee,
          });
        } else {
          const { data: newEmployee, error } = await supabase
            .from("employees")
            .insert([employeeData])
            .select()
            .single();

          if (error) throw error;

          await supabase.from("employee_sync_log").insert({
            employee_id: newEmployee.id,
            rhid_employee_id: rhidEmployee.id.toString(),
            sync_type: "create",
            sync_status: "success",
            sync_data: rhidEmployee,
          });
        }

        syncedCount++;
      } catch (error) {
        console.error(`Error syncing employee ${rhidEmployee.id}:`, error);
        errorCount++;
        errors.push({
          employeeId: rhidEmployee.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        await supabase.from("employee_sync_log").insert({
          rhid_employee_id: rhidEmployee.id.toString(),
          sync_type: "sync",
          sync_status: "error",
          sync_data: rhidEmployee,
          error_message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        syncedCount,
        errorCount,
        totalEmployees: rhidEmployees.length,
        errors: errors.length > 0 ? errors : undefined,
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
        error: "Erro ao sincronizar funcionários",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
