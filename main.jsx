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
                  <h4 className="font-bold text-slate-900">{candidate.full_name}</h4>
                  <p className="text-xs text-slate-500">ID: {candidate.id} | {candidate.email}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-xs">Ready for Initiation</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <form onSubmit={handleAddEvent} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900">Add New Lodge Event</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="px-4 py-2 border rounded-lg" required />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="px-4 py-2 border rounded-lg" required />
              <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} className="px-4 py-2 border rounded-lg" />
            </div>
            <button type="submit" className="px-4 py-2 bg-emerald-800 text-white rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> Publish Event</button>
          </form>

          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="p-4 border rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{ev.title}</h4>
                  <p className="text-xs text-slate-500">{ev.date} — {ev.location || 'Main Lodge Hall'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
