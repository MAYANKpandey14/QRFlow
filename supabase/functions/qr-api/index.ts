
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

    if (req.method === 'GET') {
       if (id) {
           const { data, error } = await supabase.from('qrs').select('*').eq('id', id).single()
           if (error) throw error
           return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       } 
       if (slug) {
           // Public or Protected? Redirects are public.
           // If 'qrs' is public read for slugs, good.
           const { data, error } = await supabase.from('qrs').select('*').eq('slug', slug).single()
           // If not found, return null
           if (error) return new Response(JSON.stringify(null), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
           return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       }
       else {
           const { data, error } = await supabase.from('qrs').select('*').order('created_at', { ascending: false })
           if (error) throw error
           return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       }
    }

    if (req.method === 'POST') {
        const body = await req.json()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const payload = { ...body, user_id: user.id }
        
        if (body.id) {
            const { data, error } = await supabase.from('qrs').update(payload).eq('id', body.id).select().single()
            if (error) throw error
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } else {
             const { data, error } = await supabase.from('qrs').insert(payload).select().single()
             if (error) throw error
             return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
    }

    if (req.method === 'DELETE') {
        if (!id) throw new Error('ID required')
        const { error } = await supabase.from('qrs').delete().eq('id', id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
