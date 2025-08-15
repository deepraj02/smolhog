
'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Stats {
  total_events: number;
  unique_users: number;
  top_events: Array<{ event: string; count: number }>;
}

interface Event {
  event_name: string;
  user_id: string;
  timestamp: string;
  properties: any;
  session_id: string | null; 
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, eventsResponse] = await Promise.all([
        fetch('/analytics/stats'),
        fetch('/analytics/events')
      ])

      const statsData = await statsResponse.json();
      setStats(statsData);

      const eventsData = await eventsResponse.json();
      const processedEvents = (eventsData.events || []).map((event: Event) => ({
        ...event,
        properties: typeof event.properties === 'string' 
          ? JSON.parse(event.properties) 
          : event.properties
      }));
      
      setEvents(processedEvents);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const prepareTimelineData = () => {
    const timeGroups: { [key: string]: number } = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      timeGroups[hour] = (timeGroups[hour] || 0) + 1;
    });
    
    return Object.entries(timeGroups)
      .map(([time, count]) => ({ time, events: count }))
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(-20);
  };

  const preparePieData = () => {
    return stats?.top_events?.slice(0, 6).map((event, index) => ({
      name: event.event,
      value: event.count,
      color: COLORS[index % COLORS.length]
    })) || [];
  };

  const prepareBarData = () => {
    return stats?.top_events?.slice(0, 8).map(event => ({
      event: event.event.length > 15 ? event.event.substring(0, 15) + '...' : event.event,
      count: event.count
    })) || [];
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-5xl font-mono">Loading...</div>
      </div>
    );
  }

  const timelineData = prepareTimelineData();
  const pieData = preparePieData();
  const barData = prepareBarData();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow hover:bg-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2 text-white">Total Events</h3>
          <p className="text-3xl font-bold font-mono text-blue-400">{stats.total_events?.toLocaleString()}</p>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow hover:bg-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2 text-white">Unique Users</h3>
          <p className="text-3xl font-bold font-mono text-green-400">{stats.unique_users?.toLocaleString()}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow hover:bg-gray-700 transition-colors">
          <h3 className="text-lg font-semibold mb-2 text-white">Events per User</h3>
          <p className="text-3xl font-bold font-mono text-purple-400">
            {stats.unique_users > 0 ? (stats.total_events / stats.unique_users).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-white">Events Timeline</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="events" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorEvents)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-white">Event Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                    
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-white">Top Events</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="event" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-white">Recent Events</h3>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-700">
                <tr>
                  <th className="text-left p-2 text-white font-semibold">Event</th>
                  <th className="text-left p-2 text-white font-semibold">User</th>
                  <th className="text-left p-2 text-white font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 15).map((event, index) => (
                  <tr key={index} className="border-b border-gray-600 hover:bg-gray-700 transition-colors">
                    <td className="p-2 font-medium text-blue-400">{event.event_name}</td>
                    <td className="p-2 text-gray-300 font-mono text-xs">
                      {event.user_id.length > 20 ? `${event.user_id.substring(0, 20)}...` : event.user_id}
                    </td>
                    <td className="p-2 text-gray-300 text-xs">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}