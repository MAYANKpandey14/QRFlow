
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    const slug = url.searchParams.get('slug')
    const action = url.searchParams.get('action') // click_tracking

    if (req.method === 'GET') {
       if (slug) {
           // Public lookup (might not have Auth header if called publicly, but RLS allows read for public if set? Or we use service key if needed. But usually short links are public read. Assuming RLS allows select on short_links for everyone.)
           // Note: if user is not logged in, request doesn't have Authorization header with user token. Supabase client uses anon key. 
           // If 'short_links' table has "Enable Read Access for all users" policy, this works.
           
           const { data, error } = await supabase.from('short_links').select('*').eq('slug', slug).single()
           if (error) return new Response(JSON.stringify(null), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) // Return null if not found
           return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       }
       
       // List (Auth required)
       const { data, error } = await supabase.from('short_links').select('*').order('created_at', { ascending: false })
       if (error) throw error
       return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'POST') {
        const body = await req.json()
        
        // Special Action: Increment Clicks (Public)
        if (action === 'increment' && body.id) {
            // Using RPC or Update. RPC is safer.
            const { error } = await supabase.rpc('increment_clicks', { row_id: body.id });
            if (error) {
                 // Fallback
                 const { data: curr } = await supabase.from('short_links').select('clicks').eq('id', body.id).single()
                 if (curr) {
                    await supabase.from('short_links').update({ clicks: curr.clicks + 1 }).eq('id', body.id)
                 }
            }
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Create Short Link (Auth required)
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const payload = { ...body, user_id: user.id, clicks: 0 }
        
        const { data, error } = await supabase.from('short_links').insert(payload).select().single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'DELETE') {
        if (!id) throw new Error('ID required')
        const { error } = await supabase.from('short_links').delete().eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
