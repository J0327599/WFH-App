import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import UserStatusTable from './UserStatusTable';
import AnalyticsDashboard from './AnalyticsDashboard';
import { statusService, User } from '../services/statusService';

const UserStatusDashboard = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await statusService.getUsers();
        setUsers(fetchedUsers || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">User Status Dashboard</h1>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            className={`px-4 py-2 rounded-lg text-sm sm:text-base ${activeTab === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('table')}
          >
            Status Table
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm sm:text-base ${activeTab === 'analytics' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm sm:text-base bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={() => navigate('/admin')}
          >
            Admin Dashboard
          </button>
        </div>

        {activeTab === 'table' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <UserStatusTable 
              users={users}
              currentDate={currentDate}
              onMonthChange={setCurrentDate}
            />
          </div>
        ) : (
          <AnalyticsDashboard />
        )}
      </div>
    </div>
  );
};

export default UserStatusDashboard;
