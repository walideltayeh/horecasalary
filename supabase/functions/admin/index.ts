
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Admin function called with method:", req.method);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    console.log("Action requested:", action);
    console.log("User data received:", userData);
    
    const authClient = supabase.auth.admin

    let result;
    switch (action) {
      case 'listUsers':
        console.log("Listing users");
        try {
          result = await authClient.listUsers({ perPage: 100 });
          console.log("Users found:", result?.data?.users?.length || 0);
          
          // Validate the structure of each user
          if (result?.data?.users && result.data.users.length > 0) {
            console.log("First user example:", JSON.stringify(result.data.users[0]));
          } else {
            console.log("No users found or empty users array");
          }
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
          result = await authClient.createUser(createUserData);
          console.log("Create user result:", result);
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
          result = await authClient.updateUserById(id, formattedUpdateData);
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
        try {
          result = await authClient.deleteUser(userData.id);
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
        throw new Error('Invalid action');
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
        status: 400 
      }
    );
  }
});
