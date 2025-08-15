'use client';

import { useEffect, useState } from 'react';

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
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); 
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      
      const statsResponse = await fetch('/api/analytics/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      
      const eventsResponse = await fetch('/api/analytics/events?limit=50');
      const eventsData = await eventsResponse.json();
      setEvents(eventsData.events);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <div className="text-5xl font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.total_events?.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Unique Users</h3>
          <p className="text-3xl font-bold text-green-600">{stats.unique_users?.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Events per User</h3>
          <p className="text-3xl font-bold text-purple-600">
            {stats.unique_users > 0 ? (stats.total_events / stats.unique_users).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Top Events</h3>
          <div className="space-y-2">
            {stats.top_events?.slice(0, 10).map((event, index) => (
              <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <span className="font-medium">{event.event}</span>
                <span className="text-gray-600">{event.count}</span>
              </div>
            ))}
          </div>
        </div>


        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Recent Events</h3>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{event.event_name}</td>
                    <td className="p-2 text-gray-600">
                      {event.user_id.length > 20 ? `${event.user_id.substring(0, 20)}...` : event.user_id}
                    </td>
                    <td className="p-2 text-gray-500">
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
