import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { statusService } from '../services/statusService';
import { isHoliday } from '../data/holidays';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const STATUS_LABELS = {
  H: 'Work from Home',
  O: 'Office',
  L: 'Leave',
  T: 'Training',
  S: 'Sick Leave'
};

interface StatusCount {
  status: string;
  count: number;
}

interface DailyCount {
  date: string;
  total: number;
  wfh: number;
  office: number;
}

interface AuditLog {
  id: number;
  timestamp: string;
  user_id: string;
  action: string;
  details: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [averageWfhRate, setAverageWfhRate] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch monthly status data and audit logs
        const [monthData, logs] = await Promise.all([
          statusService.getMonthlyStatuses(currentMonth),
          statusService.getAuditLogs(5)
        ]);

        setAuditLogs(logs);
        
        // Calculate status counts
        const counts: { [key: string]: number } = {};
        monthData.forEach(entry => {
          counts[entry.status] = (counts[entry.status] || 0) + 1;
        });

        const statusCountsArray = Object.entries(counts).map(([status, count]) => ({
          status: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
          count
        }));

        // Calculate daily counts
        const days = eachDayOfInterval({
          start: startOfMonth(currentMonth),
          end: endOfMonth(currentMonth)
        });

        const dailyData = days.map(day => {
          if (isWeekend(day) || isHoliday(day)) {
            return {
              date: format(day, 'MMM dd'),
              total: 0,
              wfh: 0,
              office: 0
            };
          }

          const dayEntries = monthData.filter(entry => entry.date === format(day, 'yyyy-MM-dd'));
          return {
            date: format(day, 'MMM dd'),
            total: dayEntries.length,
            wfh: dayEntries.filter(entry => entry.status === 'H').length,
            office: dayEntries.filter(entry => entry.status === 'O').length
          };
        });

        // Calculate total users and average WFH rate
        const totalEntries = monthData.length;
        const wfhEntries = monthData.filter(entry => entry.status === 'H').length;
        
        setStatusCounts(statusCountsArray);
        setDailyCounts(dailyData);
        setTotalUsers(totalEntries);
        setAverageWfhRate(totalEntries ? (wfhEntries / totalEntries) * 100 : 0);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentMonth]);

  const handleMonthChange = (increment: number) => {
    setCurrentMonth(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + increment, 1));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Previous Month
          </button>
          <span className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => handleMonthChange(1)}
            className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Next Month
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary Cards */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Updates</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average WFH Rate</p>
                  <p className="text-2xl font-bold">{averageWfhRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Trends */}
            <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Daily Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wfh" name="Work from Home" fill="#0088FE" />
                    <Bar dataKey="office" name="In Office" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.map((log, index) => (
                    <tr key={log.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
