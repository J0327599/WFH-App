import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  format, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isWeekend
} from 'date-fns';
import { ArrowLeft, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import userData from '../data/users.json';
import workStatusData from '../data/workStatus.json';

interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
}

type WorkStatus = 'H' | 'O' | 'L' | 'T' | 'S' | '';

interface StatusEntry {
  email: string;
  date: string;
  status: WorkStatus;
}

interface GroupedUsers {
  [manager: string]: {
    [department: string]: User[];
  };
}

const statusConfig = {
  H: { label: 'Work From Home', color: 'bg-blue-100 text-blue-800' },
  O: { label: 'Off-site', color: 'bg-purple-100 text-purple-800' },
  L: { label: 'Leave', color: 'bg-yellow-100 text-yellow-800' },
  T: { label: 'Training', color: 'bg-green-100 text-green-800' },
  S: { label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
};

const UserStatusDashboard: React.FC = () => {
  const [users] = useState<User[]>(userData.users);
  const [statuses, setStatuses] = useState<StatusEntry[]>(workStatusData.statuses || []);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  // Get all days in the month
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });
  };

  const daysInMonth = getDaysInMonth();

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Find the top manager
  const findTopManager = () => {
    const allManagers = new Set(users.map(user => user.reportsTo));
    const allEmployees = new Set(users.map(user => user.fullName));
    const topManagers = Array.from(allManagers).filter(manager => !allEmployees.has(manager));
    return topManagers[0];
  };

  // Build hierarchical user structure
  const buildHierarchy = (managerName: string): User[] => {
    return users.filter(user => user.reportsTo === managerName);
  };

  // Get user's current status
  const getUserStatus = (user: User, date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const status = statuses.find(s => 
      s.email === user.email && 
      s.date === formattedDate
    );
    return status?.status || '';
  };

  // Get status color
  const getStatusColor = (status: WorkStatus) => {
    return status ? statusConfig[status].color : 'bg-gray-100 text-gray-800';
  };

  // Get status label
  const getStatusLabel = (status: WorkStatus) => {
    return status ? statusConfig[status].label : 'Not Set';
  };

  // Toggle user expansion
  const toggleUserExpansion = (userName: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userName)) {
      newExpanded.delete(userName);
    } else {
      newExpanded.add(userName);
    }
    setExpandedUsers(newExpanded);
  };

  // Render month view for a user
  const renderMonthView = (user: User) => {
    return (
      <div className="flex flex-col space-y-2">
        <div className="overflow-x-auto">
          <div className="inline-flex pb-2" style={{ minWidth: 'max-content' }}>
            {daysInMonth.map(day => {
              const status = getUserStatus(user, day);
              const statusClass = getStatusColor(status);
              const statusLabel = getStatusLabel(status);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isWeekendDay = isWeekend(day);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`flex flex-col items-center px-1 ${isWeekendDay ? 'opacity-50' : ''}`}
                >
                  <div className={`text-[10px] leading-tight whitespace-nowrap ${isCurrentMonth ? 'text-gray-500' : 'text-gray-300'} ${isWeekendDay ? 'italic' : ''}`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-[10px] leading-tight ${isCurrentMonth ? 'text-gray-500' : 'text-gray-300'}`}>
                    {format(day, 'd')}
                  </div>
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs 
                      ${statusClass} 
                      ${!isCurrentMonth ? 'opacity-50' : ''} 
                      ${isWeekendDay ? 'bg-gray-100 text-gray-400' : ''}`}
                    title={`${format(day, 'MMMM d')}: ${isWeekendDay ? 'Weekend' : statusLabel}`}
                  >
                    {isWeekendDay ? 'W' : (status ? status : 'N')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 text-[10px] text-gray-500 px-1">
          {Object.entries(statusConfig).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded-full ${value.color} flex items-center justify-center text-[8px]`}>
                {key}
              </div>
              <span>{value.label}</span>
            </div>
          ))}
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[8px]">
              W
            </div>
            <span>Weekend</span>
          </div>
        </div>
      </div>
    );
  };

  // Render user card
  const renderUserCard = (user: User, level: number = 0) => {
    const status = getUserStatus(user, new Date());
    const statusClass = getStatusColor(status);
    const statusLabel = getStatusLabel(status);
    const directReports = buildHierarchy(user.fullName);
    const hasReports = directReports.length > 0;
    const isExpanded = expandedUsers.has(user.fullName);

    return (
      <div key={user.igg} className={`mb-4 ${level > 0 ? 'ml-8 pl-4 border-l-2 border-gray-200' : ''}`}>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  {hasReports && (
                    <button
                      onClick={() => toggleUserExpansion(user.fullName)}
                      className="mr-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                    <p className="text-sm text-gray-500">{user.jobTitle}</p>
                    <p className="text-sm text-gray-500">{user.area}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                  {statusLabel}
                </span>
              </div>
              {/* Month View */}
              <div className="mt-4 border-t pt-4">
                {renderMonthView(user)}
              </div>
            </div>
          </div>
        </div>
        {/* Render direct reports if expanded */}
        {hasReports && isExpanded && (
          <div className="mt-2">
            {directReports.map(report => renderUserCard(report, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleBack = () => {
    navigate('/');
  };

  // Handle logo click
  const handleLogoClick = () => {
    navigate('/admin');
  };

  // Render the top manager placeholder if they're not in the system
  const renderTopManagerPlaceholder = (managerName: string) => {
    return (
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{managerName}</h2>
        <p className="text-sm text-gray-500">Top Manager</p>
        <div className="mt-4">
          {users.filter(user => user.reportsTo === managerName).map(report => 
            renderUserCard(report)
          )}
        </div>
      </div>
    );
  };

  const topManager = findTopManager();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <button
              onClick={handleLogoClick}
              className="flex items-center"
            >
              <img
                src="https://images.seeklogo.com/logo-png/40/1/totalenergies-logo-png_seeklogo-405344.png"
                alt="TotalEnergies Logo"
                className="h-12 w-auto mb-2 hover:opacity-80 transition-opacity"
              />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 ml-2">Team Status Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-200 rounded-full">
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <span className="text-lg font-medium text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={goToNextMonth} className="p-2 hover:bg-gray-200 rounded-full">
              <ChevronRight className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Render the complete hierarchy starting from the top */}
          {topManager && renderTopManagerPlaceholder(topManager)}
        </div>
      </div>
    </div>
  );
};

export default UserStatusDashboard;
