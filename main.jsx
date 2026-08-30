import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import {
  ShieldCheck, CheckCircle2, LockKeyhole, Search, CreditCard,
  LogOut, Calendar, Users, FileText, Plus
} from 'lucide-react';
import './styles.css';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const REGISTRATION_FEE_GHS = 500;

const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', dob: '', occupation: '',
    address: '', applicantType: 'Ghanaian', country: 'Ghana', message: ''
  });
  const [submittedApp, setSubmittedApp] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const appData = {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      occupation: formData.occupation,
      address: formData.address,
      applicant_type: formData.applicantType,
      country: formData.country,
      message: formData.message,
      payment_status: 'pending',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('applications').insert([appData]).select();
      if (!error && data && data[0]) {
        setSubmittedApp(data[0]);
      } else {
        setSubmittedApp({ id: 'GLG-2026-' + Math.floor(100000 + Math.random() * 900000), ...appData });
      }
    } else {
      setSubmittedApp({ id: 'GLG-2026-' + Math.floor(100000 + Math.random() * 900000), ...appData });
    }
    setLoading(false);
  };

  const handlePaystackPayment = () => {
    if (!window.PaystackPop) {
      alert('Paystack SDK failed to load. Please refresh.');
      return;
    }
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: submittedApp.email,
      amount: REGISTRATION_FEE_GHS * 100,
      currency: 'GHS',
      ref: '' + Math.floor(Math.random() * 1000000000 + 1),
      callback: async (response) => {
        if (supabase && submittedApp.id) {
          await supabase.from('applications').update({
            payment_status: 'paid',
            status: 'approved',
            paystack_reference: response.reference
          }).eq('id', submittedApp.id);
        }
        alert('Payment Successful!');
        window.location.href = '/status';
      },
      onClose: () => {
        alert('Transaction cancelled.');
      }
    });
    handler.openIframe();
  };

  if (submittedApp) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Application received</h2>
        <p className="text-slate-600 mb-6">Your registration has been submitted successfully.</p>
        
        <div className="bg-slate-50 p-4 rounded-xl mb-6">
          <span className="text-sm text-slate-500 block mb-1">Application ID</span>
          <span className="text-xl font-bold text-emerald-800">{submittedApp.id}</span>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          A registration fee of <strong>₵{REGISTRATION_FEE_GHS}</strong> is required. Without payment your application will remain <strong>rejected / unapproved</strong>.
        </p>

        <button
          onClick={handlePaystackPayment}
          className="w-full py-3.5 px-6 rounded-xl bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2 shadow-md mb-4"
        >
          <CreditCard size={20} />
          Pay ₵{REGISTRATION_FEE_GHS} with Paystack
        </button>

        <p className="text-xs text-slate-500">
          After successful payment you will be redirected to your application dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Applicant Registration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text" required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email" required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel" required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800"
            />
          </div>
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-3 px-6 rounded-xl bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors mt-4"
        >
          {loading ? 'Submitting...' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
}

function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsLoggedIn(true);
      fetchApplications();
    } else {
      alert('Incorrect Password');
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    if (supabase) {
      const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
      if (data) setApplications(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    if (supabase) {
      await supabase.from('applications').update({ status: newStatus }).eq('id', id);
    }
    setApplications(applications.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...events, { id: Date.now(), ...newEvent }]);
    setNewEvent({ title: '', date: '', location: '' });
  };

  const filteredApps = applications.filter(app => 
    (app.full_name && app.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.email && app.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (app.id && String(app.id).includes(searchTerm))
  );

  const initiationList = applications.filter(app => app.status === 'approved' || app.payment_status === 'paid');

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <LockKeyhole size={24} />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900 mb-1">Staff Access</h2>
        <p className="text-xs text-center text-slate-500 mb-6">Enter passcode to view dashboard</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passcode</label>
            <input
              type="password" required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors"
          >
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Management Portal</h2>
          <p className="text-sm text-slate-500">Grand Lodge of Ghana Admin</p>
        </div>
        <button
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-medium"
        >
          <LogOut size={16} /> Exit
        </button>
      </div>

      <div className="flex gap-2 my-6 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'applications' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-slate-500'
          }`}
        >
          <FileText size={18} /> Applications
        </button>
        <button
          onClick={() => setActiveTab('initiation')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'initiation' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-slate-500'
          }`}
        >
          <Users size={18} /> Initiation List ({initiationList.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'events' ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-slate-500'
          }`}
        >
          <Calendar size={18} /> Lodge Events
        </button>
      </div>

      {activeTab === 'applications' && (
        <div>
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="py-3 px-4">Applicant ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td className="py-3 px-4 font-semibold">{app.id}</td>
                    <td className="py-3 px-4">{app.full_name}</td>
                    <td className="py-3 px-4">{app.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {app.payment_status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : app.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                        {app.status || 'pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => updateStatus(app.id, 'approved')} className="px-2.5 py-1 bg-emerald-800 text-white rounded text-xs">Approve</button>
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'initiation' && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-slate-900">Approved Candidates for Initiation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initiationList.map(candidate => (
              <div key={candidate.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text
