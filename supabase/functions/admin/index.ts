
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache client to avoid recreating it for each request
let supabaseClient: ReturnType<typeof createClient> | null = null;

// Helper function to get or create Supabase client
const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;
  
  supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  return supabaseClient;
};

// Retry mechanism for auth operations
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt <= maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
      }
    }
  }
  
  throw lastError!;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Admin function called with method:", req.method);
    
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = getSupabaseClient();
    } catch (e) {
      console.error("Error creating Supabase client:", e);
      return new Response(
        JSON.stringify({ error: "Failed to initialize Supabase client" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed successfully");
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { action, userData } = requestBody;
    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing required 'action' field" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log("Action requested:", action);
    console.log("User data received:", userData);
    
    const authClient = supabase.auth.admin
    let result;
    
    switch (action) {
      case 'listUsers':
        console.log("Listing users");
        try {
          // Implement retry mechanism for list users
          result = await retryOperation(async () => {
            // Use a higher per-page count to reduce pagination needs
            const response = await authClient.listUsers({ perPage: 1000 });
            
            if (!response?.data?.users || response.data.users.length === 0) {
              console.log("No users found on first attempt, trying again");
              return await authClient.listUsers();
            }
            
            return response;
          });
          
          // Validate the response structure
          console.log("Users found:", result?.data?.users?.length || 0);
        } catch (err) {
          console.error("Error in listUsers:", err);
          return new Response(
            JSON.stringify({ error: `Error listing users: ${err.message || "Unknown error"}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        break;
      case 'createUser':
        console.log("Creating user with email:", userData.email);
        
        if (!userData.email || !userData.password) {
          return new Response(
            JSON.stringify({ error: "Missing required user data fields" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // We need to ensure consistent format between what's received and what's expected
        const createUserData = {
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: userData.user_metadata || {
            name: userData.name,
            role: userData.role
          }
        };
        console.log("Formatted create user data:", createUserData);
        
        try {
          result = await retryOperation(() => authClient.createUser(createUserData));
          console.log("Create user result:", result);
          
          // Additional validation to ensure user was created
          if (result.error || !result?.data?.user?.id) {
            throw new Error(result.error?.message || "Failed to create user");
          }
        } catch (err) {
          console.error("Error in createUser:", err);
          return new Response(
            JSON.stringify({ error: `Error creating user: ${err.message || "Unknown error"}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        break;
      case 'updateUser':
        const { id, ...updateData } = userData;
        console.log("Updating user with id:", id);
        
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Missing required user ID for update" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        // Format the update data correctly
        const formattedUpdateData: any = {};
        
        if (updateData.password) {
          formattedUpdateData.password = updateData.password;
        }
        
        if (updateData.email) {
          formattedUpdateData.email = updateData.email;
        }
        
        // Handle metadata updates separately
        if (updateData.name || updateData.role || updateData.user_metadata) {
          formattedUpdateData.user_metadata = updateData.user_metadata || {};
          
          if (updateData.name) {
            formattedUpdateData.user_metadata.name = updateData.name;
          }
          
          if (updateData.role) {
            formattedUpdateData.user_metadata.role = updateData.role;
          }
        }
        
        console.log("Formatted update data:", formattedUpdateData);
        try {
          result = await retryOperation(() => authClient.updateUserById(id, formattedUpdateData));
          console.log("Update user result:", result);
        } catch (err) {
          console.error("Error in updateUser:", err);
          return new Response(
            JSON.stringify({ error: `Error updating user: ${err.message || "Unknown error"}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        break;
      case 'deleteUser':
        console.log("Deleting user with id:", userData.id);
        if (!userData.id) {
          return new Response(
            JSON.stringify({ error: "Missing required user ID for deletion" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        try {
          result = await retryOperation(() => authClient.deleteUser(userData.id));
          console.log("Delete user result:", result);
        } catch (err) {
          console.error("Error in deleteUser:", err);
          return new Response(
            JSON.stringify({ error: `Error deleting user: ${err.message || "Unknown error"}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    // Process the result to ensure errors are properly formatted as strings
    if (result && result.error) {
      console.error("Admin function error:", result.error);
      if (typeof result.error === 'object') {
        // Convert error object to string
        result.error = result.error.message || JSON.stringify(result.error);
      }
    }

    console.log("Operation completed successfully");
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Admin function error:", error);
    // Ensure the error is a string
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
