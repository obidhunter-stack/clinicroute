import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  ChevronRight,
  Activity,
  Building2,
  RefreshCw
} from 'lucide-react';
import api from './api';

// ============================================
// LOGIN PAGE
// ============================================
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@democlinic.co.uk');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-10 h-10 text-teal-600" />
            <span className="text-3xl font-bold text-slate-800">ClinicRoute</span>
          </div>
          <p className="text-slate-500">Healthcare Workflow Automation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 mb-2">Demo Credentials:</p>
          <p className="text-xs text-slate-600">Email: admin@democlinic.co.uk</p>
          <p className="text-xs text-slate-600">Password: Password123!</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SIDEBAR
// ============================================
function Sidebar({ currentPage, setCurrentPage, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  if (user?.role === 'ADMIN') {
    menuItems.push({ id: 'users', label: 'Users', icon: Users });
  }

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col h-screen">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="w-8 h-8 text-teal-400" />
          <span className="text-xl font-bold">ClinicRoute</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Workflow Automation</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD PAGE
// ============================================
function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Active Cases', value: stats?.summary?.totalActive || 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Overdue', value: stats?.summary?.totalOverdue || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'New Today', value: stats?.summary?.newToday || 0, icon: Plus, color: 'bg-green-500' },
    { label: 'Avg. Processing (days)', value: stats?.summary?.avgProcessingDays || 0, icon: Clock, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cases by Status</h2>
          <div className="space-y-3">
            {stats?.byStatus?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-600">{item.status.replace(/_/g, ' ')}</span>
                <span className="font-medium text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cases by Insurer</h2>
          <div className="space-y-3">
            {stats?.byInsurer?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-600">{item.insurerName}</span>
                <span className="font-medium text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CASES PAGE
// ============================================
function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    loadCases();
  }, [statusFilter]);

  const loadCases = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await api.getCases(params);
      setCases(data.items || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCases();
  };

  const getStatusColor = (status) => {
    const colors = {
      RECEIVED: 'bg-blue-100 text-blue-800',
      SUBMITTED: 'bg-yellow-100 text-yellow-800',
      AWAITING_INSURER: 'bg-orange-100 text-orange-800',
      APPROVED: 'bg-green-100 text-green-800',
      DENIED: 'bg-red-100 text-red-800',
      TREATMENT_SCHEDULED: 'bg-purple-100 text-purple-800',
      CLOSED: 'bg-slate-100 text-slate-800',
      CANCELLED: 'bg-slate-100 text-slate-600',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (selectedCase) {
    return <CaseDetailPage caseData={selectedCase} onBack={() => setSelectedCase(null)} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cases</h1>
        <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
          <Plus className="w-5 h-5" />
          New Case
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">Received</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="AWAITING_INSURER">Awaiting Insurer</option>
            <option value="APPROVED">Approved</option>
            <option value="DENIED">Denied</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Reference</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Patient</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Insurer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">SLA</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-teal-600">{c.referenceNumber}</td>
                  <td className="px-6 py-4 text-slate-800">{c.patientFirstName} {c.patientLastName}</td>
                  <td className="px-6 py-4 text-slate-600">{c.referralType}</td>
                  <td className="px-6 py-4 text-slate-600">{c.insurer?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.slaBreached ? (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Overdue
                      </span>
                    ) : (
                      <span className="text-green-600 text-sm">On track</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="text-teal-600 hover:text-teal-800"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cases.length === 0 && (
            <div className="text-center py-12 text-slate-500">No cases found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// CASE DETAIL PAGE
// ============================================
function CaseDetailPage({ caseData, onBack }) {
  const [fullCase, setFullCase] = useState(caseData);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaseDetails();
  }, []);

  const loadCaseDetails = async () => {
    try {
      const [caseDetails, logs] = await Promise.all([
        api.getCase(caseData.id),
        api.getAuditLogs(caseData.id),
      ]);
      setFullCase(caseDetails);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load case details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateCaseStatus(caseData.id, newStatus, 'Status updated via UI');
      loadCaseDetails();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      RECEIVED: 'bg-blue-100 text-blue-800',
      SUBMITTED: 'bg-yellow-100 text-yellow-800',
      AWAITING_INSURER: 'bg-orange-100 text-orange-800',
      APPROVED: 'bg-green-100 text-green-800',
      DENIED: 'bg-red-100 text-red-800',
      TREATMENT_SCHEDULED: 'bg-purple-100 text-purple-800',
      CLOSED: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6">
        ← Back to Cases
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{fullCase.referenceNumber}</h1>
                <p className="text-slate-500">{fullCase.referralType}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fullCase.status)}`}>
                {fullCase.status?.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Patient</p>
                <p className="font-medium text-slate-800">{fullCase.patientFirstName} {fullCase.patientLastName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date of Birth</p>
                <p className="font-medium text-slate-800">{new Date(fullCase.patientDob).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Referring Clinician</p>
                <p className="font-medium text-slate-800">{fullCase.referringClinician}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Insurer</p>
                <p className="font-medium text-slate-800">{fullCase.insurer?.name}</p>
              </div>
            </div>

            {fullCase.clinicalNotes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Clinical Notes</p>
                <p className="text-slate-700">{fullCase.clinicalNotes}</p>
              </div>
            )}
          </div>

          {/* Status Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {fullCase.status === 'RECEIVED' && (
                <button
                  onClick={() => handleStatusChange('SUBMITTED')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Submit to Insurer
                </button>
              )}
              {fullCase.status === 'SUBMITTED' && (
                <button
                  onClick={() => handleStatusChange('AWAITING_INSURER')}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Mark as Awaiting Insurer
                </button>
              )}
              {fullCase.status === 'AWAITING_INSURER' && (
                <>
                  <button
                    onClick={() => handleStatusChange('APPROVED')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark Approved
                  </button>
                  <button
                    onClick={() => handleStatusChange('DENIED')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Mark Denied
                  </button>
                </>
              )}
              {fullCase.status === 'APPROVED' && (
                <button
                  onClick={() => handleStatusChange('TREATMENT_SCHEDULED')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Schedule Treatment
                </button>
              )}
              {['TREATMENT_SCHEDULED', 'DENIED'].includes(fullCase.status) && (
                <button
                  onClick={() => handleStatusChange('CLOSED')}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                >
                  Close Case
                </button>
              )}
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Audit Trail</h2>
            <div className="space-y-4">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-teal-500" />
                  <div className="flex-1">
                    <p className="text-slate-800">{log.description}</p>
                    <p className="text-sm text-slate-500">
                      {log.user?.firstName} {log.user?.lastName} • {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-slate-500">No audit entries</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">SLA Status</h2>
            {fullCase.slaBreached ? (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">SLA Breached</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">On Track</span>
              </div>
            )}
            <p className="text-sm text-slate-500 mt-2">
              Deadline: {new Date(fullCase.slaDeadline).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Assignment</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-medium">
                {fullCase.assignedTo?.firstName?.[0]}{fullCase.assignedTo?.lastName?.[0]}
              </div>
              <div>
                <p className="font-medium text-slate-800">
                  {fullCase.assignedTo?.firstName} {fullCase.assignedTo?.lastName}
                </p>
                <p className="text-sm text-slate-500">{fullCase.assignedTo?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// REPORTS PAGE (Simple)
// ============================================
function ReportsPage() {
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await api.getWeeklyTrend();
      setTrend(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reports</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Weekly Case Trend</h2>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {trend.map((week, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-24 text-sm text-slate-500">{week.weekStart}</span>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${Math.min(week.received * 10, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-20">
                    {week.received} received
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// USERS PAGE
// ============================================
function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <button className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-sm font-medium">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <span className="font-medium text-slate-800">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-slate-400">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (api.getToken()) {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch (err) {
        // Token invalid
        api.setToken(null);
      }
    }
    setChecking(false);
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'cases':
        return <CasesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        {renderPage()}
      </main>
    </div>
  );
}
