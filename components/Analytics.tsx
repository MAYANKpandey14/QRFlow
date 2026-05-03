
import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { useAnalytics, useQRs } from '../hooks/useData';
import { MapPin, Smartphone, Calendar, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Analytics: React.FC = () => {
    const [selectedQrId, setSelectedQrId] = useState<string>('all');
    const { data: qrs } = useQRs();
    const { data, isLoading } = useAnalytics(_getQueryId(selectedQrId));

    function _getQueryId(val: string) {
        return val === 'all' ? undefined : val;
    }

    const handleExport = () => {
        if (!data) return;
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

    if (!qrs) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Track performance and user engagement.</p>
                </div>
                <div className="flex gap-3">
                    <Select value={selectedQrId} onValueChange={setSelectedQrId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select QR Code" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All QR Codes</SelectItem>
                            {qrs.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExport} disabled={!data || data.totalScans === 0}>
                        <Download size={16} className="mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : data ? (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground">Total Scans</p>
                                <h3 className="text-3xl font-bold text-foreground mt-2">{data.totalScans}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground">Unique (Est.)</p>
                                <h3 className="text-3xl font-bold text-foreground mt-2">{data.uniqueVisitors}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground">Top Location</p>
                                <h3 className="text-3xl font-bold text-foreground mt-2">{data.scansByCountry[0]?.name || '-'}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground">Top Device</p>
                                <h3 className="text-3xl font-bold text-foreground mt-2 uppercase">{data.scansByDevice[0]?.name || '-'}</h3>
                            </CardContent>
                        </Card>
                    </div>

                    {data.totalScans === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">No data available for this selection.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Charts Row 1 */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Calendar className="text-primary" size={20} />
                                            Scans Over Time
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={data.scansByDate}>
                                                    <defs>
                                                        <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--popover))',
                                                            borderColor: 'hsl(var(--border))',
                                                            borderRadius: '8px',
                                                            color: 'hsl(var(--popover-foreground))',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                    />
                                                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorScans)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Smartphone className="text-primary" size={20} />
                                            Device Type
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
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
                                                    <Tooltip contentStyle={{
                                                        backgroundColor: 'hsl(var(--popover))',
                                                        borderColor: 'hsl(var(--border))',
                                                        borderRadius: '8px',
                                                        color: 'hsl(var(--popover-foreground))'
                                                    }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-2">
                                            {data.scansByDevice.map((entry, index) => (
                                                <div key={index} className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <span className="uppercase">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Row 2 */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <MapPin className="text-primary" size={20} />
                                        Top Locations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data.scansByCountry}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                                <Tooltip cursor={{ fill: 'hsl(var(--accent))' }} contentStyle={{
                                                    backgroundColor: 'hsl(var(--popover))',
                                                    borderColor: 'hsl(var(--border))',
                                                    borderRadius: '8px',
                                                    color: 'hsl(var(--popover-foreground))'
                                                }} />
                                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            ) : null}
        </div>
    );
};