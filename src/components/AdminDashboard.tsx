import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Download,
  Search,
  UserPlus,
  Trash2,
  Edit2
} from 'lucide-react';
import { format } from 'date-fns';
import { statusService, User } from '../services/statusService';
import { StatusEntry } from '../types';

interface DashboardStats {
  totalUsers: number;
  workingFromHome: number;
  onLeave: number;
  offsite: number;
  inTraining: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogoClick = () => {
    navigate('/');
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentDate = new Date();
        const [fetchedUsers, monthData] = await Promise.all([
          statusService.getUsers(),
          statusService.getMonthlyStatuses(currentDate)
        ]);
        setUsers(fetchedUsers);
        setStatuses(monthData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = (): DashboardStats => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayStatuses = statuses.filter(s => s.date === today);

    return {
      totalUsers: users.length,
      workingFromHome: todayStatuses.filter(s => s.status === 'H').length,
      onLeave: todayStatuses.filter(s => s.status === 'L').length,
      offsite: todayStatuses.filter(s => s.status === 'O').length,
      inTraining: todayStatuses.filter(s => s.status === 'T').length,
    };
  };

  const stats = calculateStats();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = areaFilter === 'all' || user.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  const exportToExcel = () => {
    const headers = ['Name', 'Job Title', 'Area', 'Email', 'Reports To'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => 
        [user.fullName, user.jobTitle, user.area, user.email, user.reportsTo].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_export.csv';
    link.click();
  };

  const uniqueAreas = Array.from(new Set(users.map(user => user.area)));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={handleLogoClick}
              className="flex items-center mr-4"
            >
              <img
                src="https://images.seeklogo.com/logo-png/40/1/totalenergies-logo-png_seeklogo-405344.png"
                alt="TotalEnergies Logo"
                className="h-12 w-auto mb-2 hover:opacity-80 transition-opacity"
              />
            </button>
            <Users className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Working From Home</h3>
                <p className="text-2xl font-bold text-blue-600">{stats.workingFromHome}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">On Leave</h3>
                <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Offsite</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.offsite}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">In Training</h3>
                <p className="text-2xl font-bold text-green-600">{stats.inTraining}</p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                <option value="all">All Areas</option>
                {uniqueAreas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="H">Work From Home</option>
                <option value="O">Offsite</option>
                <option value="L">Leave</option>
                <option value="T">Training</option>
                <option value="S">Sick</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert('Add User functionality not implemented yet.')}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add User
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" /> Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports To</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">Loading users...</td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.jobTitle}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.area}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.reportsTo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {}}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {}}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
