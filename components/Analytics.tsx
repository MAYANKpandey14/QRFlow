import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { QRCodeData, AnalyticsData } from '../types';
import { DB, AuthService } from '../services/db';
import { MapPin, Smartphone, Calendar, Download } from 'lucide-react';

interface AnalyticsProps {
  qrId?: string;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Analytics: React.FC<AnalyticsProps> = ({ qrId }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [selectedQrId, setSelectedQrId] = useState<string>(qrId || 'all');

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if(user) {
        const userQrs = DB.getQRs(user.id);
        setQrs(userQrs);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const user = AuthService.getCurrentUser();
    
    // Simulate network delay for effect
    setTimeout(() => {
        let stats: AnalyticsData;
        if (selectedQrId === 'all' && user) {
            stats = DB.getAnalytics(null, user.id);
        } else {
            stats = DB.getAnalytics(selectedQrId);
        }
        setData(stats);
        setLoading(false);
    }, 500);
  }, [selectedQrId]);

  const handleExport = () => {
     if(!data) return;
     const headers = "Date,Count\n";
     const csvContent = "data:text/csv;charset=utf-8," + headers + data.scansByDate.map(e => `${e.date},${e.count}`).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `analytics_${selectedQrId}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
           <p className="text-slate-500">Track performance and user engagement.</p>
        </div>
        <div className="flex gap-3">
            <select 
                value={selectedQrId} 
                onChange={(e) => setSelectedQrId(e.target.value)}
                className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 min-w-[200px]"
            >
                <option value="all">All QR Codes</option>
                {qrs.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
            <button onClick={handleExport} disabled={!data || data.totalScans === 0} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : data ? (
        <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Total Scans</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.totalScans}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Unique Visitors</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.uniqueVisitors}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Top Location</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{data.scansByCountry[0]?.name || '-'}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Top Device</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2 uppercase">{data.scansByDevice[0]?.name || '-'}</h3>
                </div>
            </div>

            {data.totalScans === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-200">
                    <p className="text-slate-500">No data available for this selection.</p>
                </div>
            ) : (
            <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-800">Scans Over Time</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.scansByDate}>
                                <defs>
                                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorScans)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                     <div className="flex items-center gap-2 mb-6">
                        <Smartphone className="text-indigo-600" size={20} />
                        <h3 className="font-bold text-slate-800">Device Type</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.scansByDevice}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.scansByDevice.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2">
                        {data.scansByDevice.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="uppercase">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <MapPin className="text-indigo-600" size={20} />
                    <h3 className="font-bold text-slate-800">Top Locations</h3>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.scansByCountry}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            </>
            )}
        </>
      ) : null}
    </div>
  );
};