import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter, useNavigate, useLocation, Routes, Route, Link, Navigate
} from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck, Menu, LogIn, LogOut, LayoutDashboard, FileText, CalendarDays,
  Users, Search, CheckCircle2, XCircle, Clock3, Eye, ChevronRight, UserRound,
  LockKeyhole, Globe2, MapPin, Mail, Phone, ArrowRight, Plus, Trash2,
  AlertCircle, CreditCard, Home as HomeIcon, Info, ListChecks, Briefcase
} from 'lucide-react';
import './styles.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const REGISTRATION_FEE_GHS = 500;
const REGISTRATION_FEE_PESEWAS = REGISTRATION_FEE_GHS * 100;

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const demoApps = [
  { id: 'GLG-2026-0001', full_name: 'Kofi Mensah', email: 'kofi@example.com', phone: '+233 20 000 0000', occupation: 'Teacher', applicant_type: 'Ghanaian', country: 'Ghana', status: 'pending', payment_status: 'unpaid', created_at: '2026-05-20T10:00:00Z' },
  { id: 'GLG-2026-0002', full_name: 'Ama Serwaa', email: 'ama@example.com', phone: '+233 24 000 0000', occupation: 'Nurse', applicant_type: 'Ghanaian', country: 'Ghana', status: 'under_review', payment_status: 'paid', created_at: '2026-05-20T09:00:00Z' },
  { id: 'GLG-2026-0003', full_name: 'Kwame Asante', email: 'kwame@example.com', phone: '+1 202 000 0000', occupation: 'Engineer', applicant_type: 'International', country: 'United States', status: 'approved', payment_status: 'paid', created_at: '2026-05-19T12:00:00Z' },
  { id: 'GLG-2026-0004', full_name: 'Abena Owusu', email: 'abena@example.com', phone: '+233 55 000 0000', occupation: 'Trader', applicant_type: 'Ghanaian', country: 'Ghana', status: 'rejected', payment_status: 'unpaid', created_at: '2026-05-19T08:00:00Z' },
];

const demoEvents = [
  { id: 1, title: 'Initiation Ceremony', date: '2026-06-15', location: 'Accra, Ghana' },
  { id: 2, title: 'Annual Communication', date: '2026-08-10', location: 'Accra, Ghana' },
  { id: 3, title: 'Grand Lodge Meeting', date: '2026-10-05', location: 'Kumasi, Ghana' },
];

const demoInitiations = [
  { id: 1, title: 'Class of 2026 — Accra', date: '2026-06-20', location: 'Accra' },
  { id: 2, title: 'Class of 2026 — Kumasi', date: '2026-07-11', location: 'Kumasi' },
  { id: 3, title: 'Class of 2026 — Tamale', date: '2026-08-22', location: 'Tamale' },
];

/* ---------- Auth ---------- */
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) {
      const demo = localStorage.getItem('demoUser');
      if (demo) setUser(JSON.parse(demo));
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

/* ---------- Helpers ---------- */
function Field({ label, type = 'text', name, value, onChange, placeholder, required, accept }) {
  return (
    <label>
      {label}
      <input
        type={type}
        name={name}
        value={type === 'file' ? undefined : value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        accept={accept}
      />
    </label>
  );
}

function StatusPill({ status, payment_status }) {
  const map = {
    pending: { label: 'Pending', cls: 'pending' },
    under_review: { label: 'Under review', cls: 'under_review' },
    approved: { label: 'Approved', cls: 'approved' },
    rejected: { label: 'Rejected', cls: 'rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`statusPill ${s.cls}`}>
      {s.label}
      {payment_status === 'paid' && <small> · Paid</small>}
      {payment_status === 'unpaid' && status !== 'approved' && <small> · Unpaid</small>}
    </span>
  );
}

function calcAge(dob) {
  if (!dob) return 0;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}


function loadPaystack(callback) {
  if (window.PaystackPop) {
    callback();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://js.paystack.co/v1/inline.js';
  script.onload = callback;
  document.body.appendChild(script);
}

/** Notify admin via Supabase Edge Function (Resend). Fails silently in demo mode. */
async function notifyAdmin(payload) {
  if (!supabase) {
    console.log('[demo] Admin notification:', payload.type, payload.application_id);
    return;
  }
  try {
    const { error } = await supabase.functions.invoke('notify-admin', { body: payload });
    if (error) console.warn('Admin notification failed:', error.message);
  } catch (err) {
    console.warn('Admin notification error:', err);
  }
}


/* ---------- Layout ---------- */
function Layout({ children }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    else localStorage.removeItem('demoUser');
    nav('/');
  };

  const publicLinks = [
    ['/', 'Home'],
    ['/about', 'About'],
    ['/apply', 'Apply Now'],
    ['/status', 'My Application'],
    ['/events', 'Events'],
    ['/initiations', 'Initiation List'],
  ];

  return (
    <div className="app">
      <header className="top">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Grand Lodge of Ghana" />
          <div>
            <b>GRAND LODGE</b>
            <span>OF GHANA</span>
          </div>
        </Link>
        <button className="mobileMenu" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu />
        </button>
        <nav className={open ? 'open' : ''}>
          {publicLinks.map(([to, label]) => (
            <Link
              key={to}
              className={loc.pathname === to ? 'active' : ''}
              onClick={() => setOpen(false)}
              to={to}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link className="navBtn" to="/admin" onClick={() => setOpen(false)}>
                <LayoutDashboard size={16} /> Admin
              </Link>
              <button className="navBtn" onClick={logout}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <Link className="navBtn" to="/staff" onClick={() => setOpen(false)}>
              <LogIn size={16} /> Staff sign in
            </Link>
          )}
        </nav>
      </header>
      {children}
      <footer>
        <div className="footerInner">
          <div className="brand">
            <img src="/logo.png" alt="" />
            <div>
              <b>GRAND LODGE OF GHANA</b>
              <span>Online Registration Portal</span>
            </div>
          </div>
          <div>© 2026 Grand Lodge of Ghana. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Pages ---------- */
function Home() {
  return (
    <>
      <section className="hero">
        <div className="heroCopy">
          <div className="eyebrow">
            <ShieldCheck size={17} /> Secure 2026 Registration Portal
          </div>
          <h1>
            Join a legacy that <em>transforms.</em>
          </h1>
          <p>
            Submit your application online, pay the registration fee, and track your
            application status securely from any device.
          </p>
          <div className="actions">
            <Link className="btn primary" to="/apply">
              Start application <ArrowRight size={17} />
            </Link>
            <Link className="btn secondary" to="/status">
              Check status
            </Link>
          </div>
          <div className="trust">
            <span><ShieldCheck /> Secure registration</span>
            <span><Globe2 /> Ghana & international</span>
            <span><CreditCard /> Paystack payments</span>
          </div>
        </div>
        <div className="crestCard">
          <img src="/logo.png" alt="Crest" />
          <h3>THAT ALL SHALL BE ONE</h3>
          <p>Grand Lodge of Ghana</p>
        </div>
      </section>
      <section className="features">
        <Feature icon={<FileText />} title="Easy application" text="Complete the guided registration form with validation at every step." />
        <Feature icon={<CreditCard />} title="Secure payment" text="Pay the ₵500 registration fee via Paystack. Applications without payment remain unapproved." />
        <Feature icon={<Clock3 />} title="Real-time status" text="See whether your application is pending, under review, approved or rejected." />
        <Feature icon={<Users />} title="Applicant portal" text="Return to your dashboard to view confirmation and general notices." />
      </section>
    </>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="feature">
      <div className="iconBox">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function About() {
  return (
    <main className="formPage">
      <div className="pageIntro">
        <span className="eyebrow">About us</span>
        <h1>Grand Lodge of Ghana</h1>
        <p>A proud fraternal institution committed to brotherhood, charity and personal growth.</p>
      </div>
      <div className="card" style={{ padding: '32px' }}>
        <p>
          The Grand Lodge of Ghana welcomes applications from qualified men of good character
          who wish to join our ranks. Our 2026 registration portal provides a secure and
          transparent way to submit your application, pay the required fee, and follow the
          progress of your candidacy.
        </p>
        <p style={{ marginTop: 16 }}>
          <strong>Registration fee:</strong> ₵500 (Ghana Cedis). Payment is required for
          your application to be considered for approval. Unpaid applications will remain
          rejected until payment is completed.
        </p>
        <p style={{ marginTop: 16 }}>
          Applicants must be <strong>20 years of age or older</strong>. You will be asked
          to provide personal details, occupation, residential address and a copy of a
          valid identification document.
        </p>
        <div className="actions" style={{ marginTop: 28 }}>
          <Link className="btn primary" to="/apply">Start application <ArrowRight size={17} /></Link>
        </div>
      </div>
    </main>
  );
}

function Apply() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    occupation: '',
    date_of_birth: '',
    house_address: '',
    applicant_type: 'Ghanaian',
    country: 'Ghana',
    message: '',
    id_card_name: '',
  });
  const [idFile, setIdFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null); // { id, email, full_name, ... }
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setForm({ ...form, id_card_name: file.name });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const age = calcAge(form.date_of_birth);
    if (age < 20) {
      setError('Applicants must be 20 years of age or older.');
      return;
    }
    if (!form.id_card_name) {
      setError('Please upload a copy of your ID card.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        occupation: form.occupation.trim(),
        date_of_birth: form.date_of_birth,
        house_address: form.house_address.trim(),
        id_card_name: form.id_card_name,
        applicant_type: form.applicant_type,
        country: form.country.trim(),
        message: form.message.trim(),
        status: 'pending',
        payment_status: 'unpaid',
      };

      if (supabase) {
        const { data, error: err } = await supabase
          .from('applications')
          .insert(payload)
          .select('id, application_number, email, full_name')
          .single();
        if (err) throw err;
        const appId = data.application_number || data.id;
        setDone({
          id: appId,
          dbId: data.id,
          email: data.email,
          full_name: data.full_name,
          phone: payload.phone,
          applicant_type: payload.applicant_type,
          country: payload.country,
          occupation: payload.occupation,
        });
        notifyAdmin({
          type: 'new_application',
          application_id: appId,
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          applicant_type: payload.applicant_type,
          country: payload.country,
          occupation: payload.occupation,
        });
      } else {
        const id = 'GLG-2026-' + String(Date.now()).slice(-6);
        const record = { ...payload, id, application_number: id, created_at: new Date().toISOString() };
        localStorage.setItem('demoApplication', JSON.stringify(record));
        // keep a simple list for admin demo
        const list = JSON.parse(localStorage.getItem('demoApps') || '[]');
        list.unshift(record);
        localStorage.setItem('demoApps', JSON.stringify(list));
        setDone({
          id,
          email: payload.email,
          full_name: payload.full_name,
          phone: payload.phone,
          applicant_type: payload.applicant_type,
          country: payload.country,
          occupation: payload.occupation,
        });
        notifyAdmin({
          type: 'new_application',
          application_id: id,
          full_name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          applicant_type: payload.applicant_type,
          country: payload.country,
          occupation: payload.occupation,
        });
      }
    } catch (err) {
      setError(err.message || 'Unable to submit application.');
    } finally {
      setSaving(false);
    }
  };

  const payNow = () => {
    if (!done) return;
    setPaying(true);

    const startPayment = () => {
      if (!PAYSTACK_KEY && !window.PaystackPop) {
        // Demo mode without real key – simulate success
        completePayment('DEMO-' + Date.now());
        return;
      }

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_KEY || 'pk_test_demo',
        email: done.email,
        amount: REGISTRATION_FEE_PESEWAS,
        currency: 'GHS',
        ref: 'GLG-' + done.id + '-' + Date.now(),
        metadata: {
          application_id: done.id,
          custom_fields: [
            { display_name: 'Application ID', variable_name: 'application_id', value: done.id },
            { display_name: 'Full Name', variable_name: 'full_name', value: done.full_name },
          ],
        },
        callback: (response) => {
          completePayment(response.reference);
        },
        onClose: () => setPaying(false),
      });
      handler.openIframe();
    };

    loadPaystack(startPayment);
  };

  const completePayment = async (reference) => {
    try {
      if (supabase && done.dbId) {
        await supabase
          .from('applications')
          .update({
            payment_status: 'paid',
            payment_reference: reference,
            paid_at: new Date().toISOString(),
            status: 'approved',
            updated_at: new Date().toISOString(),
          })
          .eq('id', done.dbId);
      } else {
        const d = JSON.parse(localStorage.getItem('demoApplication') || '{}');
        d.payment_status = 'paid';
        d.payment_reference = reference;
        d.paid_at = new Date().toISOString();
        d.status = 'approved';
        localStorage.setItem('demoApplication', JSON.stringify(d));
        const list = JSON.parse(localStorage.getItem('demoApps') || '[]');
        const idx = list.findIndex((a) => a.id === d.id);
        if (idx >= 0) list[idx] = d;
        localStorage.setItem('demoApps', JSON.stringify(list));
      }
      await notifyAdmin({
        type: 'payment_received',
        application_id: done.id,
        full_name: done.full_name,
        email: done.email,
        phone: done.phone,
        applicant_type: done.applicant_type,
        country: done.country,
        occupation: done.occupation,
        amount: REGISTRATION_FEE_GHS,
        payment_reference: reference,
      });
      nav('/status?paid=1&id=' + encodeURIComponent(done.id) + '&email=' + encodeURIComponent(done.email));
    } catch (err) {
      setError('Payment recorded but status update failed. Contact the office with reference: ' + reference);
      setPaying(false);
    }
  };

  if (done) {
    return (
      <main className="centerPage">
        <div className="successCard">
          <CheckCircle2 size={56} />
          <h1>Application received</h1>
          <p>Your registration has been submitted successfully.</p>
          <div className="applicationNo">
            Application ID <b>{done.id}</b>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            A registration fee of <strong>₵{REGISTRATION_FEE_GHS}</strong> is required.
            Without payment your application will remain <strong>rejected / unapproved</strong>.
          </p>
          <button className="btn primary" onClick={payNow} disabled={paying} style={{ marginTop: 20 }}>
            <CreditCard size={18} />
            {paying ? 'Opening payment…' : `Pay ₵${REGISTRATION_FEE_GHS} with Paystack`}
          </button>
          <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
            After successful payment you will be redirected to your application dashboard.
          </p>
          <Link className="btn secondary" to="/status" style={{ marginTop: 12 }}>
            View status later
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="formPage">
      <div className="pageIntro">
        <span className="eyebrow">Applicant registration</span>
        <h1>Start your application</h1>
        <p>
          Fill in your details accurately. Fields marked * are required.
          Applicants must be 20 years or older. Registration fee: ₵{REGISTRATION_FEE_GHS}.
        </p>
      </div>
      <form className="card form" onSubmit={submit}>
        <div className="stepbar">
          <span className="step active">1 <small>Personal info</small></span>
          <span className="line" />
          <span className="step">2 <small>Review</small></span>
          <span className="line" />
          <span className="step">3 <small>Payment</small></span>
        </div>

        <div className="grid2">
          <Field label="Full name *" name="full_name" value={form.full_name} onChange={update} placeholder="Enter your full name" required />
          <Field label="Email address *" type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" required />
          <Field label="Phone number *" name="phone" value={form.phone} onChange={update} placeholder="+233 ..." required />
          <Field label="Occupation *" name="occupation" value={form.occupation} onChange={update} placeholder="e.g. Teacher, Engineer" required />
          <Field label="Date of birth * (must be 20+)" type="date" name="date_of_birth" value={form.date_of_birth} onChange={update} required />
          <label>
            Applicant type *
            <select name="applicant_type" value={form.applicant_type} onChange={update}>
              <option>Ghanaian</option>
              <option>International</option>
            </select>
          </label>
          <Field label="Country of residence *" name="country" value={form.country} onChange={update} placeholder="Ghana" required />
          <Field label="House address *" name="house_address" value={form.house_address} onChange={update} placeholder="Street, city, region" required />
          <label>
            Upload ID Card *
            <input type="file" accept="image/*,.pdf" onChange={onFile} required />
            {form.id_card_name && <small className="muted">Selected: {form.id_card_name}</small>}
          </label>
          <label>
            Additional message
            <textarea name="message" value={form.message} onChange={update} rows="4" placeholder="Optional message" />
          </label>
        </div>

        {error && (
          <div className="error">
            <AlertCircle size={17} /> {error}
          </div>
        )}

        <div className="formFoot">
          <span className="muted">Your information is protected. Payment of ₵{REGISTRATION_FEE_GHS} is required for approval.</span>
          <button disabled={saving} className="btn primary">
            {saving ? 'Submitting…' : 'Submit application'} <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </main>
  );
}

function Status() {
  const [app, setApp] = useState(null);
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const loc = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    if (params.get('paid') === '1') {
      setId(params.get('id') || '');
      setEmail(params.get('email') || '');
      setMsg('Payment successful! Your application has been approved.');
    }
  }, [loc.search]);

  useEffect(() => {
    if (id && email && new URLSearchParams(loc.search).get('paid') === '1') {
      // auto-search after payment redirect
      search(null, true);
    }
  }, [id, email]);

  const search = async (e, silent = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    if (!silent) setMsg('');
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('application_number', id.trim())
          .eq('email', email.trim().toLowerCase())
          .single();
        if (error) throw new Error('Application not found. Check your ID and email.');
        setApp(data);
      } else {
        const d = JSON.parse(localStorage.getItem('demoApplication') || 'null');
        if (d && (d.id === id.trim() || d.application_number === id.trim()) && d.email === email.trim().toLowerCase()) {
          setApp(d);
        } else {
          throw new Error('Demo application not found. Submit an application first.');
        }
      }
    } catch (err) {
      setMsg(err.message);
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="centerPage">
      <div className="statusBox">
        <span className="eyebrow">Applicant dashboard</span>
        <h1>Track your application</h1>
        <p>Enter the application ID and email used during registration.</p>
        <form onSubmit={search} className="statusForm">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Application ID" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
          <button className="btn primary" disabled={loading}>
            {loading ? 'Checking…' : 'Check status'}
          </button>
        </form>
        {msg && (
          <div className={msg.includes('successful') ? 'notice' : 'error'} style={{ marginTop: 14 }}>
            {msg.includes('successful') ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {msg}
          </div>
        )}
        {app && (
          <div className="statusResult">
            <div>
              <span className="muted">Application</span>
              <b>{app.application_number || app.id}</b>
            </div>
            <StatusPill status={app.status} payment_status={app.payment_status} />
            <div className="detail">
              <b>{app.full_name}</b>
              <span>{app.applicant_type} · {app.country}</span>
              <span>{app.email}</span>
              {app.occupation && <span>Occupation: {app.occupation}</span>}
            </div>
            <div className="notice">
              {app.payment_status !== 'paid' && (
                <>
                  <AlertCircle size={18} /> Payment of ₵{REGISTRATION_FEE_GHS} is required.
                  Without payment your application cannot be approved.
                </>
              )}
              {app.payment_status === 'paid' && app.status === 'approved' && (
                <>
                  <CheckCircle2 size={18} /> Payment received. Your application has been approved.
                </>
              )}
              {app.payment_status === 'paid' && app.status === 'under_review' && (
                <>
                  <Clock3 size={18} /> Payment received. Your application is under review.
                </>
              )}
              {app.status === 'rejected' && app.payment_status !== 'paid' && (
                <>
                  <XCircle size={18} /> Application not approved — payment was not completed.
                </>
              )}
              {app.status === 'pending' && app.payment_status !== 'paid' && (
                <>
                  <Clock3 size={18} /> Application submitted. Please complete payment to proceed.
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EventsPage() {
  const [events, setEvents] = useState(demoEvents);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('events').select('*').order('date').then(({ data }) => {
      if (data?.length) setEvents(data);
    });
  }, []);

  return (
    <main className="formPage">
      <div className="pageIntro">
        <span className="eyebrow">Calendar</span>
        <h1>Upcoming events</h1>
        <p>Official activities of the Grand Lodge of Ghana.</p>
      </div>
      <div className="card">
        <div className="cardHead"><h2>Events</h2></div>
        {events.map((e) => (
          <div className="listRow" key={e.id}>
            <div className="roundIcon"><CalendarDays /></div>
            <div>
              <b>{e.title}</b>
              <span>{new Date(e.date).toLocaleDateString(undefined, { dateStyle: 'long' })} · {e.location}</span>
            </div>
            <ChevronRight />
          </div>
        ))}
        {!events.length && <div className="empty">No events scheduled yet.</div>}
      </div>
    </main>
  );
}

function InitiationsPage() {
  const [items, setItems] = useState(demoInitiations);

  useEffect(() => {
    if (!supabase) return;
    supabase.from('initiation_classes').select('*').order('date').then(({ data }) => {
      if (data?.length) setItems(data);
    });
  }, []);

  return (
    <main className="formPage">
      <div className="pageIntro">
        <span className="eyebrow">Initiation</span>
        <h1>Initiation list</h1>
        <p>Upcoming initiation classes for the 2026 intake.</p>
      </div>
      <div className="card">
        <div className="cardHead"><h2>Classes</h2></div>
        {items.map((x) => (
          <div className="listRow" key={x.id}>
            <div className="roundIcon"><Users /></div>
            <div>
              <b>{x.title}</b>
              <span>
                {x.date ? new Date(x.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Date TBA'}
                {x.location ? ` · ${x.location}` : ''}
              </span>
            </div>
            <ChevronRight />
          </div>
        ))}
        {!items.length && <div className="empty">No initiation classes published yet.</div>}
      </div>
    </main>
  );
}

function Staff() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav('/admin');
      } else {
        // Demo: only allow a known pattern – no public signup
        if (!email.includes('@')) throw new Error('Please enter a valid registered email.');
        localStorage.setItem('demoUser', JSON.stringify({ email }));
        nav('/admin');
      }
    } catch (e) {
      setErr(e.message || 'Sign in failed. Only registered staff emails are allowed.');
    }
  };

  return (
    <main className="centerPage">
      <div className="authCard">
        <img src="/logo.png" alt="" />
        <span className="eyebrow">Staff access</span>
        <h1>Welcome back</h1>
        <p>
          Authorized staff only. New staff accounts can only be created by an administrator.
          Fake or unregistered emails cannot sign in.
        </p>
        <form onSubmit={submit}>
          <Field label="Email address *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@grandlodge.org" required />
          <Field label="Password *" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          <button className="btn primary full">
            Sign in <LogIn size={17} />
          </button>
        </form>
        {err && <div className="error">{err}</div>}
        <p className="muted" style={{ marginTop: 16, fontSize: 13, textAlign: 'center' }}>
          Need an account? Contact the Grand Lodge administrator.
        </p>
      </div>
    </main>
  );
}

function Admin() {
  const { user, loading } = useAuth();
  const [apps, setApps] = useState([]);
  const [events, setEvents] = useState(demoEvents);
  const [tab, setTab] = useState('dashboard');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!user) return;
    if (supabase) {
      supabase.from('applications').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setApps(data);
      });
      supabase.from('events').select('*').order('date').then(({ data }) => {
        if (data?.length) setEvents(data);
      });
    } else {
      const stored = JSON.parse(localStorage.getItem('demoApps') || '[]');
      setApps(stored.length ? stored : demoApps);
    }
  }, [user]);

  if (loading) return <main className="centerPage"><p>Loading…</p></main>;
  if (!user) return <Navigate to="/staff" replace />;

  const filtered = apps.filter(
    (a) =>
      !q ||
      a.full_name?.toLowerCase().includes(q.toLowerCase()) ||
      a.email?.toLowerCase().includes(q.toLowerCase()) ||
      (a.application_number || a.id || '').toLowerCase().includes(q.toLowerCase())
  );

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === 'pending').length,
    approved: apps.filter((a) => a.status === 'approved').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
    paid: apps.filter((a) => a.payment_status === 'paid').length,
  };

  const setStatus = async (app, status) => {
    if (supabase) {
      await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', app.id);
    }
    setApps((prev) => prev.map((x) => (x.id === app.id ? { ...x, status } : x)));
  };

  return (
    <div className="adminPage">
      <aside>
        <div className="adminUser">
          <UserRound size={20} />
          <div>
            <b>Staff</b>
            <span>{user.email}</span>
          </div>
        </div>
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>
          <LayoutDashboard size={16} /> Dashboard
        </button>
        <button className={tab === 'applications' ? 'active' : ''} onClick={() => setTab('applications')}>
          <FileText size={16} /> Applications
        </button>
        <button className={tab === 'events' ? 'active' : ''} onClick={() => setTab('events')}>
          <CalendarDays size={16} /> Events
        </button>
      </aside>
      <div className="adminMain">
        <div className="adminHeader">
          <h1>{tab === 'dashboard' ? 'Dashboard' : tab === 'applications' ? 'Applications' : 'Events'}</h1>
        </div>

        {tab === 'dashboard' && (
          <div className="dashGrid">
            <div className="stat"><span>Total applications</span><strong>{stats.total}</strong></div>
            <div className="stat"><span>Pending</span><strong>{stats.pending}</strong></div>
            <div className="stat"><span>Approved</span><strong>{stats.approved}</strong></div>
            <div className="stat"><span>Paid</span><strong>{stats.paid}</strong></div>
          </div>
        )}

        {tab === 'applications' && (
          <div className="card">
            <div className="toolbar">
              <div className="searchBox">
                <Search size={16} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or ID" />
              </div>
            </div>
            <table className="card">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>{a.application_number || a.id}</td>
                    <td>
                      <b>{a.full_name}</b>
                      <div className="muted">{a.email}</div>
                    </td>
                    <td>{a.applicant_type}</td>
                    <td>{a.payment_status === 'paid' ? 'Paid' : 'Unpaid'}</td>
                    <td><StatusPill status={a.status} payment_status={a.payment_status} /></td>
                    <td>
                      <button className="iconBtn" title="Approve" onClick={() => setStatus(a, 'approved')}><CheckCircle2 size={16} /></button>
                      <button className="iconBtn" title="Reject" onClick={() => setStatus(a, 'rejected')}><XCircle size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <div className="empty">No applications found.</div>}
          </div>
        )}

        {tab === 'events' && (
          <EventsAdmin events={events} setEvents={setEvents} />
        )}
      </div>
    </div>
  );
}

function EventsAdmin({ events, setEvents }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const add = async () => {
    if (!title || !date) return;
    const item = { id: Date.now(), title, date, location: 'Ghana' };
    if (supabase) {
      const { data } = await supabase.from('events').insert({ title, date, location: 'Ghana' }).select().single();
      if (data) setEvents([...events, data]);
    } else {
      setEvents([...events, item]);
    }
    setTitle('');
    setDate('');
  };

  const remove = async (e) => {
    if (supabase) await supabase.from('events').delete().eq('id', e.id);
    setEvents(events.filter((x) => x.id !== e.id));
  };

  return (
    <div className="card">
      <div className="cardHead"><h2>Upcoming events</h2></div>
      <div className="eventAdd">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn primary" onClick={add}><Plus size={16} /> Add</button>
      </div>
      {events.map((e) => (
        <div className="listRow" key={e.id}>
          <div className="roundIcon"><CalendarDays /></div>
          <div>
            <b>{e.title}</b>
            <span>{new Date(e.date).toLocaleDateString(undefined, { dateStyle: 'long' })} · {e.location}</span>
          </div>
          <button className="iconBtn" onClick={() => remove(e)}><Trash2 /></button>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/apply" element={<Apply />} />
        <Route path="/status" element={<Status />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/initiations" element={<InitiationsPage />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
