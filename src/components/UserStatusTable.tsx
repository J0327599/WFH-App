import React, { useState, useRef, useEffect } from 'react';
import { 
  format, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend
} from 'date-fns';
import { isHoliday } from '../data/holidays';
import { ChevronDown, ChevronRight } from 'lucide-react';
import userData from '../data/users.json';
import { statusService, StatusEntry } from '../services/statusService';

const statusConfig = {
  H: { label: 'Work From Home', color: 'bg-blue-100 text-blue-800' },
  O: { label: 'Off-site', color: 'bg-purple-100 text-purple-800' },
  L: { label: 'Leave', color: 'bg-yellow-100 text-yellow-800' },
  T: { label: 'Training', color: 'bg-green-100 text-green-800' },
  S: { label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
} as const;

interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
}

type WorkStatus = keyof typeof statusConfig | '';

interface StatusPopupProps {
  status: WorkStatus;
  comment?: string;
  onSelect: (status: WorkStatus, comment?: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

// Wrapper component to handle async status loading for popup
const StatusPopupWrapper: React.FC<{
  email: string;
  date: Date;
  onSelect: (status: WorkStatus, comment?: string) => void;
  onClose: () => void;
  position: { x: number; y: number };
}> = ({ email, date, onSelect, onClose, position }) => {
  const [status, setStatus] = useState<WorkStatus>('');
  const [comment, setComment] = useState<string>();

  useEffect(() => {
    const loadStatus = async () => {
      const newStatus = await statusService.getUserStatus(email, format(date, 'yyyy-MM-dd'));
      setStatus((newStatus?.status || '') as WorkStatus);
      setComment(newStatus?.comment);
    };
    loadStatus();
  }, [email, date]);

  return (
    <StatusPopup
      status={status}
      comment={comment}
      onSelect={onSelect}
      onClose={onClose}
      position={position}
    />
  );
};

const StatusPopup: React.FC<StatusPopupProps> = ({ status, comment, onSelect, onClose, position }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [newComment, setNewComment] = useState(comment || '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-2"
      style={{ top: position.y, left: position.x }}
    >
      <div className="grid grid-cols-1 gap-1">
        <div className="px-3 py-2">
          <textarea
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Add a comment (optional)"
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </div>
        {Object.entries(statusConfig).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onSelect(key as WorkStatus, newComment)}
            className={`flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-50 ${status === key ? 'bg-gray-100' : ''}`}
          >
            <div className={`w-4 h-4 rounded-full ${value.color} flex items-center justify-center text-[10px]`}>
              {key}
            </div>
            <span className="text-sm">{value.label}</span>
          </button>
        ))}
        <button
          onClick={() => onSelect('', newComment)}
          className={`flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-50 ${status === '' ? 'bg-gray-100' : ''}`}
        >
          <div className="w-4 h-4 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center text-[10px]">
            N
          </div>
          <span className="text-sm">Not Set</span>
        </button>
      </div>
    </div>
  );
};

// Status cell component to handle async status loading
const StatusCell: React.FC<{
  user: User;
  day: Date;
  onStatusClick: (event: React.MouseEvent, email: string, date: Date) => void;
}> = ({ user, day, onStatusClick }) => {
  const [status, setStatus] = useState<WorkStatus>('');
  const [comment, setComment] = useState<string>();
  const [statusColor, setStatusColor] = useState<string>('bg-gray-100 text-gray-800');

  useEffect(() => {
    const loadStatus = async () => {
      const newStatus = await statusService.getUserStatus(user.email, format(day, 'yyyy-MM-dd'));
      const currentStatus = (newStatus?.status || '') as WorkStatus;
      setStatus(currentStatus);
      setComment(newStatus?.comment);
      
      const color = isWeekend(day) ? 'bg-gray-100 text-gray-400' :
        isHoliday(day) ? 'bg-red-50 text-red-400' :
        !currentStatus ? 'bg-gray-100 text-gray-800' :
        statusConfig[currentStatus as keyof typeof statusConfig].color;
      setStatusColor(color);
    };
    loadStatus();
  }, [user.email, day]);

  const displayText = isWeekend(day) ? 'W' : 
    isHoliday(day) ? 'H' : 
    status || 'N';

  return (
    <div 
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${statusColor} ${!isWeekend(day) && !isHoliday(day) ? 'cursor-pointer hover:ring-2 hover:ring-gray-300' : ''}`}
      title={`${format(day, 'MMMM d')}: ${isWeekend(day) ? 'Weekend' : isHoliday(day) ? isHoliday(day)?.name : (status && status in statusConfig ? `${statusConfig[status as keyof typeof statusConfig].label}${comment ? ` - ${comment}` : ''}` : 'Not Set')}`}
      onClick={(e) => !isWeekend(day) && !isHoliday(day) && onStatusClick(e, user.email, day)}
    >
      {displayText}
    </div>
  );
};

const UserStatusTable: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [users] = useState<User[]>(userData.users);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);
  const [activePopup, setActivePopup] = useState<{ email: string; date: Date; position: { x: number; y: number } } | null>(null);

  // Function to check if a user is a manager
  const isManager = (userName: string): boolean => {
    return users.some(user => user.reportsTo === userName);
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

  // Toggle expand all
  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedUsers(new Set());
    } else {
      const allManagers = users
        .filter(user => isManager(user.fullName))
        .map(user => user.fullName);
      setExpandedUsers(new Set(allManagers));
    }
    setExpandAll(!expandAll);
  };

  // Render user row recursively
  const renderUserRow = (user: User, level: number = 0) => {
    const directReports = buildHierarchy(user.fullName);
    const hasReports = directReports.length > 0;
    const isExpanded = expandedUsers.has(user.fullName);
    const rows = [];

    rows.push(
      <div key={user.email} className="flex hover:bg-gray-50">
        <div className={`w-48 px-4 py-2 whitespace-nowrap text-sm flex items-center ${isManager(user.fullName) ? 'font-medium text-blue-900 bg-blue-50' : 'text-gray-900'}`}>
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
            {user.fullName}
          </div>
        </div>
        <div className="flex items-center">
          {days.map((day) => (
            <div key={day.toString()} className={`px-1 ${isWeekend(day) ? 'opacity-50' : ''}`}>
              <StatusCell 
                user={user}
                day={day}
                onStatusClick={handleStatusClick}
              />
            </div>
          ))}
        </div>
      </div>
    );

    if (hasReports && isExpanded) {
      directReports.forEach(report => {
        rows.push(...renderUserRow(report, level + 1));
      });
    }

    return rows;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  // Get all days in the month
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    return eachDayOfInterval({
      start: monthStart,
      end: monthEnd
    });
  };

  const days = getDaysInMonth();

  // Update user status
  const updateStatus = async (email: string, date: Date, status: WorkStatus, comment?: string) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const newStatus: StatusEntry = { email, date: formattedDate, status, comment };
    await statusService.updateStatus(newStatus);
  };



  // Handle status cell click
  const handleStatusClick = async (event: React.MouseEvent, email: string, date: Date) => {
    if (isWeekend(date) || isHoliday(date)) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setActivePopup({
      email,
      date,
      position: {
        x: rect.left,
        y: rect.bottom + window.scrollY
      }
    });
  };

  // Render header row with dates
  const HeaderRow = () => (
    <div className="flex">
      <div className="w-48 px-4 py-2 font-medium text-gray-900">
        <div className="flex items-center justify-between mb-1">
          <span>Name</span>
          <button
            onClick={toggleExpandAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <button
            onClick={goToPreviousMonth}
            className="text-gray-600 hover:text-gray-800"
          >
            ←
          </button>
          <span className="font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={goToNextMonth}
            className="text-gray-600 hover:text-gray-800"
          >
            →
          </button>
        </div>
      </div>
      <div className="flex items-center">
        {days.map((day) => (
          <div key={day.toString()} className={`px-1 ${isWeekend(day) ? 'opacity-50' : ''}`}>
            <div className="flex flex-col items-center">
              <div className={`text-[10px] leading-tight whitespace-nowrap text-gray-500 ${isWeekend(day) ? 'italic' : ''}`}>
                {format(day, 'EEE')}
              </div>
              <div className="text-[10px] leading-tight text-gray-500">
                {format(day, 'd')}
              </div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isWeekend(day) ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-800'}`}>
                {isWeekend(day) ? 'W' : 'N'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <div className="min-w-full">
              <HeaderRow />
              <div className="divide-y divide-gray-200">
                {renderUserRow({ fullName: findTopManager(), email: '', igg: '', jobTitle: '', area: '', reportsTo: '' })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
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
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-[8px]">
            H
          </div>
          <span>Holiday</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center text-[8px]">
            N
          </div>
          <span>Not Set</span>
        </div>
      </div>
      {activePopup && (
        <StatusPopupWrapper
          email={activePopup.email}
          date={activePopup.date}
          onSelect={async (status: WorkStatus, comment?: string) => {
            if (!activePopup) return;
            await updateStatus(activePopup.email, activePopup.date, status, comment);
            setActivePopup(null);
          }}
          onClose={() => setActivePopup(null)}
          position={activePopup.position}
        />
      )}
    </div>
  );
};

export default UserStatusTable;
