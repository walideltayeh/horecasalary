
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
    console.log("User data:", userData);
    
    const authClient = supabase.auth.admin

    let result
    switch (action) {
      case 'listUsers':
        console.log("Listing users");
        result = await authClient.listUsers()
        break
      case 'createUser':
        console.log("Creating user with email:", userData.email);
        result = await authClient.createUser(userData)
        break
      case 'updateUser':
        const { id, ...updateData } = userData
        console.log("Updating user with id:", id);
        result = await authClient.updateUserById(id, updateData)
        break
      case 'deleteUser':
        console.log("Deleting user with id:", userData.id);
        result = await authClient.deleteUser(userData.id)
        break
      default:
        throw new Error('Invalid action')
    }

    console.log("Operation result:", result);
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error("Admin function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
