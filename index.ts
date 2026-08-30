// Supabase Edge Function: notify-admin
// Sends Email (Resend) + SMS (Africa's Talking) to admin and applicant.
//
// Deploy:
//   supabase functions deploy notify-admin
//
// Secrets:
//   supabase secrets set RESEND_API_KEY=re_xxx
//   supabase secrets set ADMIN_EMAIL=admin@yourdomain.com
//   supabase secrets set FROM_EMAIL="Grand Lodge Ghana <onboarding@resend.dev>"
//   supabase secrets set AT_USERNAME=sandbox          # Africa's Talking username
//   supabase secrets set AT_API_KEY=your_at_api_key
//   supabase secrets set AT_SENDER_ID=GLGHANA          # short code / sender ID
//   supabase secrets set ADMIN_PHONE=+233XXXXXXXXX     # admin SMS number

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@grandlodgeghana.org";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Grand Lodge Ghana <onboarding@resend.dev>";

const AT_USERNAME = Deno.env.get("AT_USERNAME");
const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_SENDER_ID = Deno.env.get("AT_SENDER_ID") || "GLGHANA";
const ADMIN_PHONE = Deno.env.get("ADMIN_PHONE"); // e.g. +233241234567

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return { skipped: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Resend: ${JSON.stringify(data)}`);
  return data;
}

/** Send SMS via Africa's Talking */
async function sendSms(to: string, message: string) {
  if (!AT_USERNAME || !AT_API_KEY) {
    console.warn("Africa's Talking credentials not set — skipping SMS");
    return { skipped: true };
  }
  // Normalize phone: ensure it starts with +
  let phone = to.trim().replace(/\s+/g, "");
  if (phone.startsWith("0")) phone = "+233" + phone.slice(1);
  if (!phone.startsWith("+")) phone = "+" + phone;

  const body = new URLSearchParams({
    username: AT_USERNAME,
    to: phone,
    message,
    from: AT_SENDER_ID,
  });

  const res = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey: AT_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Africa's Talking error:", data);
    throw new Error(`SMS failed: ${JSON.stringify(data)}`);
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      type, // "new_application" | "payment_received"
      application_id,
      full_name,
      email,
      phone,
      applicant_type,
      country,
      occupation,
      amount,
      payment_reference,
    } = body;

    const results: Record<string, unknown> = {};

    // ---------- EMAIL to admin ----------
    let subject = "";
    let html = "";

    if (type === "payment_received") {
      subject = `[Payment Received] ${full_name} — ${application_id}`;
      html = `
        <h2>Payment received — Application approved</h2>
        <p>A registration fee payment has been completed.</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px">
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Application ID</b></td><td style="padding:8px;border-bottom:1px solid #eee">${application_id}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Full name</b></td><td style="padding:8px;border-bottom:1px solid #eee">${full_name}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Email</b></td><td style="padding:8px;border-bottom:1px solid #eee">${email}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Phone</b></td><td style="padding:8px;border-bottom:1px solid #eee">${phone || "—"}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Type</b></td><td style="padding:8px;border-bottom:1px solid #eee">${applicant_type || "—"} · ${country || ""}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Occupation</b></td><td style="padding:8px;border-bottom:1px solid #eee">${occupation || "—"}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Amount</b></td><td style="padding:8px;border-bottom:1px solid #eee">₵${amount || 500}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Paystack ref</b></td><td style="padding:8px;border-bottom:1px solid #eee">${payment_reference || "—"}</td></tr>
        </table>
        <p style="margin-top:20px;color:#555">Log in to the admin dashboard to review the application.</p>
      `;
    } else {
      subject = `[New Application] ${full_name} — ${application_id}`;
      html = `
        <h2>New membership application</h2>
        <p>A new applicant has submitted a registration form. Payment is still pending.</p>
        <table style="border-collapse:collapse;width:100%;max-width:520px">
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Application ID</b></td><td style="padding:8px;border-bottom:1px solid #eee">${application_id}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Full name</b></td><td style="padding:8px;border-bottom:1px solid #eee">${full_name}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Email</b></td><td style="padding:8px;border-bottom:1px solid #eee">${email}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Phone</b></td><td style="padding:8px;border-bottom:1px solid #eee">${phone || "—"}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Type</b></td><td style="padding:8px;border-bottom:1px solid #eee">${applicant_type || "—"} · ${country || ""}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee"><b>Occupation</b></td><td style="padding:8px;border-bottom:1px solid #eee">${occupation || "—"}</td></tr>
        </table>
        <p style="margin-top:20px;color:#555">The applicant has been asked to pay the ₵500 registration fee.</p>
      `;
    }

    try {
      results.email = await sendEmail(subject, html);
    } catch (e) {
      results.emailError = String(e);
      console.error(e);
    }

    // ---------- SMS to ADMIN ----------
    if (ADMIN_PHONE) {
      const adminSms =
        type === "payment_received"
          ? `GLG: Payment received. ${full_name} (${application_id}) paid ₵${amount || 500}. Status: Approved. Ref: ${payment_reference || "n/a"}`
          : `GLG: New application from ${full_name} (${application_id}). Phone: ${phone || "n/a"}. Awaiting payment of ₵500.`;

      try {
        results.adminSms = await sendSms(ADMIN_PHONE, adminSms);
      } catch (e) {
        results.adminSmsError = String(e);
        console.error(e);
      }
    }

    // ---------- SMS to APPLICANT ----------
    if (phone) {
      let applicantSms = "";
      if (type === "payment_received") {
        applicantSms = `Grand Lodge of Ghana: Payment received. Your application ${application_id} is now APPROVED. Thank you.`;
      } else {
        applicantSms = `Grand Lodge of Ghana: Application received. Your ID is ${application_id}. Please pay ₵500 registration fee to complete. Track status on the portal.`;
      }
      try {
        results.applicantSms = await sendSms(phone, applicantSms);
      } catch (e) {
        results.applicantSmsError = String(e);
        console.error(e);
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
