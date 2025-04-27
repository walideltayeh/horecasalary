
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

    const { action, userData } = await req.json()
    console.log("Action requested:", action);
    console.log("User data received:", userData);
    
    const authClient = supabase.auth.admin

    let result
    switch (action) {
      case 'listUsers':
        console.log("Listing users");
        result = await authClient.listUsers({ perPage: 50 })
        console.log("Users found:", result?.data?.users?.length || 0);
        break
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
        }
        console.log("Formatted create user data:", createUserData);
        result = await authClient.createUser(createUserData)
        console.log("Create user result:", result);
        break
      case 'updateUser':
        const { id, ...updateData } = userData
        console.log("Updating user with id:", id);
        result = await authClient.updateUserById(id, updateData)
        console.log("Update user result:", result);
        break
      case 'deleteUser':
        console.log("Deleting user with id:", userData.id);
        result = await authClient.deleteUser(userData.id)
        console.log("Delete user result:", result);
        break
      default:
        throw new Error('Invalid action')
    }

    // Process the result to ensure errors are properly formatted as strings
    if (result.error) {
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
    )
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
    )
  }
})
