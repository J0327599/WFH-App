import { format, eachDayOfInterval, isWeekend, addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { isHoliday } from '../data/holidays';
import userData from '../data/users.json';

type WorkStatus = 'H' | 'O' | 'L' | 'T' | 'S' | '';

interface StatusEntry {
  email: string;
  date: string;
  status: WorkStatus;
  comment?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  changes?: {
    date: string;
    oldStatus: WorkStatus;
    newStatus: WorkStatus;
    comment?: string;
  };
}

const statusTypes: WorkStatus[] = ['H', 'O', 'L', 'T', 'S'];
const statusComments = {
  H: [
    "Working on project documentation",
    "Team virtual meeting",
    "Development work",
    "Report writing",
    "Online training"
  ],
  O: [
    "Client meeting in Cape Town",
    "Site visit in Johannesburg",
    "Conference in Durban",
    "Customer presentation",
    "Field work"
  ],
  L: [
    "Annual leave",
    "Family vacation",
    "Personal time",
    "Long weekend",
    "Taking a break"
  ],
  T: [
    "Safety training",
    "Leadership workshop",
    "Technical certification",
    "Skills development",
    "Professional course"
  ],
  S: [
    "Not feeling well",
    "Doctor's appointment",
    "Medical leave",
    "Recovery day",
    "Health check-up"
  ]
};

function getRandomStatus(): WorkStatus {
  const randomIndex = Math.floor(Math.random() * statusTypes.length);
  return statusTypes[randomIndex];
}

function getRandomComment(status: WorkStatus): string {
  if (!status || !(status in statusComments)) return '';
  const comments = statusComments[status];
  const randomIndex = Math.floor(Math.random() * comments.length);
  return comments[randomIndex];
}

export function generateStatusData(startDate: Date, endDate: Date): {
  statusHistory: { [key: string]: { statuses: StatusEntry[] } };
  auditLog: { logs: AuditLog[] };
} {
  const statusHistory: { [key: string]: { statuses: StatusEntry[] } } = {};
  const auditLog: { logs: AuditLog[] } = { logs: [] };
  
  // Initialize months
  let currentDate = startDate;
  while (currentDate <= endDate) {
    const monthKey = format(currentDate, 'yyyy-MM');
    statusHistory[monthKey] = { statuses: [] };
    currentDate = addMonths(currentDate, 1);
  }

  // Generate status entries for each user
  userData.users.forEach(user => {
    // Generate login entries
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    days.forEach(day => {
      if (!isWeekend(day) && !isHoliday(day)) {
        const shouldHaveStatus = Math.random() > 0.2; // 80% chance of having a status
        
        if (shouldHaveStatus) {
          const status = getRandomStatus();
          const monthKey = format(day, 'yyyy-MM');
          const formattedDate = format(day, 'yyyy-MM-dd');
          
          // Add status entry
          statusHistory[monthKey].statuses.push({
            email: user.email,
            date: formattedDate,
            status,
            comment: getRandomComment(status)
          });

          // Add audit log entry
          auditLog.logs.push({
            id: uuidv4(),
            timestamp: `${formattedDate}T${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60)}:00Z`,
            userId: user.email,
            action: "STATUS_UPDATE",
            details: `Updated status to ${status}`,
            changes: {
              date: formattedDate,
              oldStatus: "",
              newStatus: status,
              comment: getRandomComment(status)
            }
          });

          // Add login entry
          auditLog.logs.push({
            id: uuidv4(),
            timestamp: `${formattedDate}T08:00:00Z`,
            userId: user.email,
            action: "LOGIN",
            details: "User logged in successfully"
          });
        }
      }
    });
  });

  // Sort audit logs by timestamp
  auditLog.logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return { statusHistory, auditLog };
}

// Generate data for January to March 2025
const startDate = new Date(2025, 0, 1); // January 1, 2025
const endDate = new Date(2025, 2, 31); // March 31, 2025
export const generatedData = generateStatusData(startDate, endDate);
