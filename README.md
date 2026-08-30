# Grand Lodge of Ghana — 2026 Registration Portal

Vercel-ready React + Vite + Supabase + Paystack application.

## Features
- Public Ghanaian / international applicant registration
- Required fields: full name, email, phone, occupation, date of birth (age 20+), house address, ID card upload, applicant type, country, message
- Registration fee **₵500** via **Paystack**
- Without payment the application cannot be approved (status remains pending/rejected)
- After successful payment the applicant is redirected to the status dashboard and status becomes **approved**
- Applicant confirmation and status dashboard
- Staff authentication (login only — no public signup)
- Only administrators can create staff accounts (via Supabase Auth)
- Protected admin dashboard
- Search / filter / review / approve / reject applications
- Public Events and Initiation List pages
- About page
- Supabase PostgreSQL + Row Level Security schema
- Responsive mobile / desktop UI
- Demo mode when Supabase / Paystack keys are missing

## Environment variables (Vercel)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PAYSTACK_PUBLIC_KEY=pk_live_... or pk_test_...
```

## Deploy to Vercel
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Create your first staff user in Supabase Authentication.
4. Promote that user to admin:
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR-STAFF-EMAIL');
   ```
5. Upload / import this folder to Vercel.
6. Add the three environment variables above.
7. Deploy.

## Payment flow
1. Applicant submits the form → receives Application ID.
2. Clicks **Pay ₵500 with Paystack**.
3. On successful payment → status set to `approved`, payment_status `paid`.
4. Redirected to the My Application (status) page.

## Staff access
- Public visitors **cannot** create staff accounts.
- Only registered emails that exist in Supabase Auth can sign in.
- Admins manage applications, events, etc. from `/admin`.

## Admin email + SMS notifications

When a new application is submitted **or** a payment is completed:

| Recipient | Channel | Content |
|-----------|---------|---------|
| Admin | Email (Resend) | Full application / payment details |
| Admin | SMS (Africa's Talking) | Short alert with ID & name |
| Applicant | SMS (Africa's Talking) | Application ID / approval confirmation |

### Setup (one-time)

#### 1. Email — Resend
1. Create a free account at [resend.com](https://resend.com) and get an API key.

#### 2. SMS — Africa's Talking (recommended for Ghana)
1. Create an account at [africastalking.com](https://africastalking.com).
2. Get your **Username**, **API Key**, and register a **Sender ID** (e.g. `GLGHANA`).
3. For testing you can use the Sandbox username `sandbox`.

#### 3. Deploy the Edge Function
```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy notify-admin
```

#### 4. Set secrets
```bash
# Email
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set ADMIN_EMAIL=your-admin@email.com
# optional:
supabase secrets set FROM_EMAIL="Grand Lodge Ghana <onboarding@resend.dev>"

# SMS
supabase secrets set AT_USERNAME=sandbox
supabase secrets set AT_API_KEY=your_africastalking_api_key
supabase secrets set AT_SENDER_ID=GLGHANA
supabase secrets set ADMIN_PHONE=+233241234567
```

#### 5. Enable the function
In Supabase Dashboard → Edge Functions → `notify-admin` → ensure it is enabled.

### SMS message examples
- **New application (to applicant):**  
  `Grand Lodge of Ghana: Application received. Your ID is GLG-2026-XXXX. Please pay ₵500 registration fee to complete. Track status on the portal.`
- **Payment received (to applicant):**  
  `Grand Lodge of Ghana: Payment received. Your application GLG-2026-XXXX is now APPROVED. Thank you.`
- **Admin alerts:** short summaries with name, ID and status.

In demo mode (no Supabase keys) notifications are logged to the browser console only.
