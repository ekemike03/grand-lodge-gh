import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, CheckCircle2, Lock, Search, CreditCard, LogOut, Calendar, Users, FileText, Plus } from 'lucide-react';
import './styles.css';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  
  // Form State
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '' });
  const [submittedApp, setSubmittedApp] = useState(null);

  // Mock Admin Data for Testing
  const [applications, setApplications] = useState([
    { id: 'GLG-2026-948123', full_name: 'Kofi Mensah', email: 'kofi@example.com', payment_status: 'paid', status: 'approved' },
    { id: 'GLG-2026-102938', full_name: 'Yaw Boateng', email: 'yaw@example.com', payment_status: 'pending', status: 'pending' }
  ]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAdmin(true);
    } else {
      alert('Incorrect passcode. Use: admin123');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const newApp = {
      id: 'GLG-2026-' + Math.floor(100000 + Math.random() * 900000),
      full_name: formData.fullName,
      email: formData.email,
      payment_status: 'pending',
      status: 'pending'
    };
    setSubmittedApp(newApp);
    setApplications([newApp, ...applications]);
  };

  const updateStatus = (id, status) => {
    setApplications(applications.map(app => app.id === id ? { ...app, status } : app));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsAdmin(false)}>
          <ShieldCheck className="text-emerald-800" size={32} />
          <span className="font-bold text-lg text-slate-900 tracking-wide uppercase">Grand Lodge of Ghana</span>
        </div>
        <button
          onClick={() => setIsAdmin(!isAdmin)}
          className="text-sm font-semibold text-emerald-800 border border-emerald-800 px-4 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          {isAdmin ? 'Exit Admin' : 'Admin Portal'}
        </button>
      </header>

      <main className="p-4 max-w-5xl mx-auto my-6">
        {!isAdmin ? (
          /* REGISTRATION VIEW */
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            {!submittedApp ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Applicant Registration</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text" required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email" required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-800/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 px-6 rounded-xl bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors mt-4"
                  >
                    Submit Application
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Received!</h2>
                <p className="text-slate-600 mb-4">Your ID: <strong className="text-emerald-800">{submittedApp.id}</strong></p>
                <button
                  onClick={() => setSubmittedApp(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium"
                >
                  Submit Another
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ADMIN DASHBOARD VIEW */
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {password !== 'admin123' && applications.length >= 0 && !isAdmin ? null : null}
            
            {/* If password not entered yet */}
            {password !== 'admin123' && !window.bypassPass ? (
              <div className="max-w-md mx-auto my-12 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Enter Passcode</h2>
                <p className="text-xs text-slate-500 mb-6">Type admin123 to access control panel</p>
                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <input
                    type="password"
                    placeholder="Passcode (admin123)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200"
                  />
                  <button type="submit" className="w-full py-2.5 bg-emerald-800 text-white font-medium rounded-xl">
                    Unlock Dashboard
                  </button>
                </form>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Admin Management Portal</h2>
                  <button onClick={() => setPassword('')} className="px-4 py-2 text-rose-700 bg-rose-50 rounded-lg text-sm font-medium">
                    Lock Portal
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td className="py-3 px-4 font-semibold">{app.id}</td>
                          <td className="py-3 px-4">{app.full_name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 flex gap-2">
                            <button onClick={() => updateStatus(app.id, 'approved')} className="px-2 py-1 bg-emerald-800 text-white rounded text-xs">Approve</button>
                            <button onClick={() => updateStatus(app.id, 'rejected')} className="px-2 py-1 bg-rose-600 text-white rounded text-xs">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
