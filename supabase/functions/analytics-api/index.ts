
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
    const qrId = url.searchParams.get('qrId')

    // GET Stats (Protected usually)
    if (req.method === 'GET') {
       if (qrId) {
           const { data, error } = await supabase.from('scans').select('*').eq('qr_id', qrId)
           if (error) throw error
           return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       } else {
           // All user stats? By joining qrs?
           // Frontend calls API.getStats(qrId). Maybe it never calls getStats() without ID?
           // Let's check api.ts later. But for now if no ID, return empty or error or all scans via user's QRs.
           // Simplest: only support by qrId for now, or just return all accessible scans.
           const { data, error } = await supabase.from('scans').select('*').limit(1000)
           if (error) throw error
           return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       }
    }

    // POST Record Scan (Public)
    if (req.method === 'POST') {
        const body = await req.json()
        
        // Enrich with Request IP/Headers if missing
        // Deno specific: req.headers.get("x-forwarded-for"), user-agent
        const ip = req.headers.get("x-forwarded-for") || body.ip || 'unknown';
        const userAgent = req.headers.get("user-agent") || body.userAgent;

        const payload = {
            qr_id: body.qrId || null,
            short_link_id: body.shortLinkId || null,
            device: body.device || userAgent, // Fallback
            browser: body.browser,
            city: body.city,
            country: body.country,
            ip: ip
        }

        const { error } = await supabase.from('scans').insert(payload)
        if (error) throw error
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
