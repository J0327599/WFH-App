import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { Calendar as CalendarIcon, LogOut, Check, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { db } from '../lib/db';
import { useNavigate } from 'react-router-dom';

type WorkStatus = 'H' | 'O' | 'L' | 'T' | 'S' | '';

interface DayStatus {
  date: Date;
  status: WorkStatus;
}

interface StatusMenuPosition {
  x: number;
  y: number;
  date: Date;
}

const statusConfig = {
  H: { label: 'Work From Home', color: 'bg-blue-100 hover:bg-blue-200', textColor: 'text-blue-800' },
  O: { label: 'Off-site', color: 'bg-purple-100 hover:bg-purple-200', textColor: 'text-purple-800' },
  L: { label: 'Leave', color: 'bg-yellow-100 hover:bg-yellow-200', textColor: 'text-yellow-800' },
  T: { label: 'Training', color: 'bg-green-100 hover:bg-green-200', textColor: 'text-green-800' },
  S: { label: 'Sick Leave', color: 'bg-red-100 hover:bg-red-200', textColor: 'text-red-800' },
};

export const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthStatuses, setMonthStatuses] = useState<DayStatus[]>([]);
  const [statusMenu, setStatusMenu] = useState<StatusMenuPosition | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    if (user?.email) {
      fetchMonthStatuses();
    }
  }, [currentDate, user?.email]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenu && !(event.target as Element).closest('.status-menu')) {
        setStatusMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [statusMenu]);

  const fetchMonthStatuses = async () => {
    if (!user?.email) return;

    try {
      const statusData = await db.getWorkStatus(
        user.email,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );

      const statuses = statusData.map((status) => ({
        date: new Date(status.date),
        status: status.status,
      }));

      setMonthStatuses(statuses);
    } catch (error) {
      console.error('Error fetching statuses:', error);
    }
  };

  const handleDateClick = (event: React.MouseEvent, date: Date) => {
    event.stopPropagation();
    const rect = (event.target as Element).getBoundingClientRect();
    setStatusMenu({
      x: rect.left,
      y: rect.bottom + window.scrollY,
      date,
    });
  };

  const handleStatusSelect = async (status: WorkStatus) => {
    if (!statusMenu || !user?.email || status === '') return;

    try {
      await db.updateWorkStatus({
        email: user.email,
        date: format(statusMenu.date, 'yyyy-MM-dd'),
        status: status as 'H' | 'O' | 'L' | 'T' | 'S',
      });

      await fetchMonthStatuses();
      setStatusMenu(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: WorkStatus) => {
    return status ? statusConfig[status].color : 'bg-white hover:bg-gray-50';
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleViewStatuses = () => {
    navigate('/status');
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-indigo-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Work Status Calendar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleViewStatuses}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Users className="h-4 w-4 mr-2" />
                View All Statuses
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <button onClick={goToPreviousMonth} className="p-2 hover:bg-gray-100 rounded-md">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
              <button onClick={goToNextMonth} className="p-2 hover:bg-gray-100 rounded-md">
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const status = monthStatuses.find((s) => isSameDay(s.date, day))?.status || '';
                return (
                  <button
                    key={day.toString()}
                    onClick={(e) => handleDateClick(e, day)}
                    className={`
                      p-4 text-center rounded-lg transition-colors relative
                      ${!isSameMonth(day, currentDate) ? 'text-gray-400' : 'text-gray-900'}
                      ${getStatusColor(status)}
                    `}
                  >
                    <div className="font-medium">{format(day, 'd')}</div>
                    {status && (
                      <div className={`text-xs font-semibold mt-1 ${statusConfig[status].textColor}`}>
                        {status}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {statusMenu && (
            <div
              className="status-menu fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[200px]"
              style={{
                left: `${statusMenu.x}px`,
                top: `${statusMenu.y}px`,
              }}
            >
              <div className="text-sm font-medium text-gray-600 mb-2 px-2">
                {format(statusMenu.date, 'MMMM d, yyyy')}
              </div>
              <div className="space-y-1">
                {Object.entries(statusConfig).map(([value, config]) => {
                  const currentStatus = monthStatuses.find(s => isSameDay(s.date, statusMenu.date))?.status;
                  const isSelected = currentStatus === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleStatusSelect(value as WorkStatus)}
                      className={`
                        w-full px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between
                        ${config.color} ${config.textColor}
                      `}
                    >
                      {config.label}
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* Display logged in user's email */}
        {user?.email && (
          <div className="mt-4 text-center text-gray-600">
            Logged in as: {user.email}
          </div>
        )}
      </div>
    </div>
  );
};