# Work From Home Status Dashboard

A modern, responsive web application built for TotalEnergies to manage and track employee work statuses, including work from home, off-site work, leave, training, and sick leave.

## 🌟 Features

### User Dashboard
- **Status Calendar View**
  - Monthly view of employee work statuses
  - Color-coded status indicators
  - Weekend highlighting
  - Easy navigation between months
  - Responsive design for all screen sizes

- **Hierarchical Organization View**
  - Display of complete organizational structure
  - Expandable/collapsible team views
  - Direct reports visualization
  - Quick status overview for each employee

### Admin Dashboard
- **High-Level Statistics**
  - Total user count
  - Current day status breakdown
  - Work from home statistics
  - Leave management overview

- **User Management**
  - Complete user list with details
  - Add/Edit/Delete user functionality
  - Search and filter capabilities
  - Export to Excel feature

- **Status Reporting**
  - Filter by department/area
  - Filter by status type
  - Date range selection
  - Custom search options

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation
1. Clone the repository:
   ```bash
   git clone [repository-url]
   ```

2. Install dependencies:
   ```bash
   cd project
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Technology Stack

- **Frontend Framework**: React with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Authentication**: Custom auth system
- **State Management**: React Context API

## 📱 Application Structure

```
src/
├── components/
│   ├── UserStatusDashboard.tsx   # Main dashboard view
│   ├── AdminDashboard.tsx        # Admin management interface
│   ├── Calendar.tsx              # Calendar component
│   └── Register.tsx              # User registration
├── context/
│   └── AuthContext.tsx           # Authentication context
├── data/
│   ├── users.json               # User data
│   └── workStatus.json          # Status records
└── App.tsx                      # Main application component
```

## 🎨 Status Types and Colors

| Status | Code | Description | Color |
|--------|------|-------------|--------|
| Work From Home | H | Working remotely | Blue |
| Off-site | O | Working at different location | Purple |
| Leave | L | On planned leave | Yellow |
| Training | T | In training/development | Green |
| Sick | S | On sick leave | Red |
| Weekend | W | Non-working days | Gray |

## 🔐 Authentication

The application uses a secure authentication system with protected routes:
- `/` - Main dashboard (protected)
- `/admin` - Admin dashboard (protected)
- `/login` - Login page
- `/register` - Registration page

## 🔄 Navigation

- Click the TotalEnergies logo to switch between Admin and User dashboards
- Use the back arrow for navigation
- Month navigation in calendar view
- Expandable/collapsible team structure

## 📊 Data Management

### User Data Structure
```typescript
interface User {
  igg: string;
  fullName: string;
  jobTitle: string;
  area: string;
  email: string;
  reportsTo: string;
}
```

### Status Data Structure
```typescript
interface StatusEntry {
  email: string;
  date: string;
  status: 'H' | 'O' | 'L' | 'T' | 'S' | '';
}
```

## 🛡️ Security Features

- Protected routes using PrivateRoute component
- Authentication state management
- Session handling
- Secure navigation

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices
- Various screen sizes and orientations

## 🔜 Future Enhancements

- Email notifications for status changes
- Bulk status updates
- Advanced reporting features
- Calendar integration
- Mobile application
- API integration

## 📄 License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.

## 👥 Support

For support or inquiries, please contact the IT support team.
