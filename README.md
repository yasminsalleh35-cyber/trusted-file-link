# Client Portal System

A comprehensive role-based client portal built with React, TypeScript, and Tailwind CSS. This system enables administrators to manage clients and users, distribute files, and facilitate secure communication within a structured hierarchy.

## 🎯 **Project Overview**

This client portal implements a three-tier access control system:
- **Admin**: System administrator with full control
- **Client**: Company representatives managing their teams
- **User**: Individual team members with limited access

## 🏗️ **System Architecture**

### **Role-Based Access Control (Logic 1)**

```
Admin (1)
├── Manages up to 100 Clients
├── Controls all files and messages
├── System-wide permissions
│
├── Client (Multiple)
│   ├── Manages own Users only
│   ├── Views assigned files
│   ├── Communicates with Admin and own Users
│   │
│   └── User (Multiple per Client)
│       ├── Views assigned files only
│       ├── Communicates with Admin and Client
│       └── Read-only access to most features
```

### **Access Isolation Rules**

1. **Data Segregation**: Clients cannot see other clients' data
2. **Communication Boundaries**: No Client ↔ Client communication
3. **File Assignment**: Admin assigns files to clients or specific users
4. **User Management**: Clients manage only their own team members

## 📁 **Project Structure**

```
src/
├── components/              # React components organized by feature
│   ├── auth/               # Authentication components
│   │   └── LoginForm.tsx   # Role-based login form
│   ├── layout/             # Layout and navigation components
│   │   └── DashboardLayout.tsx  # Main dashboard wrapper
│   ├── admin/              # Admin-specific components
│   │   └── AdminDashboard.tsx   # Admin dashboard view
│   ├── client/             # Client-specific components
│   │   └── ClientDashboard.tsx  # Client dashboard view
│   ├── user/               # User-specific components
│   │   └── UserDashboard.tsx    # User dashboard view
│   └── ui/                 # Reusable UI components (shadcn/ui)
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication state management
│   └── use-mobile.tsx     # Mobile detection hook
├── lib/                    # Utility functions
│   └── utils.ts           # Common utilities and class merging
├── pages/                  # Main page components
│   ├── Index.tsx          # Main application entry point
│   └── NotFound.tsx       # 404 error page
├── index.css              # Global styles and design system
└── main.tsx               # Application bootstrap
```

## 🎨 **Design System**

### **Color Scheme**
- **Admin**: Professional Blue (`hsl(217 91% 60%)`)
- **Client**: Success Green (`hsl(142 71% 45%)`)
- **User**: Modern Purple (`hsl(262 83% 58%)`)

### **Key Features**
- Fully responsive design
- Dark mode support
- Role-based color coding
- Professional gradients and shadows
- Semantic color tokens for consistency

## 🔧 **Component Documentation**

### **Authentication System**

#### **LoginForm.tsx**
```typescript
// Purpose: Handle user authentication for all three roles
// Features: Email/password validation, role-based styling, error handling
// Props: onLogin callback, userType for role-specific UI
```

#### **useAuth.ts Hook**
```typescript
// Purpose: Manage authentication state across the application
// Features: Login/logout, user persistence, permission checking
// Returns: user object, authentication status, auth methods
```

### **Layout Components**

#### **DashboardLayout.tsx**
```typescript
// Purpose: Main layout wrapper for all dashboard pages
// Features: Responsive sidebar, header with user profile, role-based navigation
// Props: children, userRole, userEmail, navigation items, callbacks
```

### **Dashboard Components**

#### **AdminDashboard.tsx**
```typescript
// Purpose: Main dashboard view for Admin users
// Features: System overview, client/user management, file statistics
// Access: Full system control, all management functions
```

#### **ClientDashboard.tsx**
```typescript
// Purpose: Main dashboard view for Client users  
// Features: Team management, assigned files, client-scoped data
// Access: Own users only, assigned files, admin communication
```

#### **UserDashboard.tsx**
```typescript
// Purpose: Main dashboard view for regular Users
// Features: Assigned files, messages, simple focused interface
// Access: Personal files only, limited communication options
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Modern web browser

### **Installation**
```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd client-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Demo Access**
The application includes a demo mode with role switching:
- Click the role selector in the top-right corner
- Choose Admin, Client, or User
- Use any email format for login
- Password can be anything for demo purposes

## 🔗 **Backend Integration Plan**

### **STEP 1: Supabase Connection (REQUIRED FIRST)**

⚠️ **ACTION REQUIRED**: Click the green **Supabase** button in Lovable interface to connect your existing Supabase project:
- **Project ID**: `hodpwoqadtbgerfdcizq`
- **Project URL**: `https://hodpwoqadtbgerfdcizq.supabase.co`
- **Status**: ⏳ Pending Connection

**This connection will enable:**
- Real authentication with email/password
- PostgreSQL database operations
- File storage capabilities
- Real-time messaging system

### **STEP 2: Database Schema Implementation**
**Estimated Time: 30 minutes**

Once Supabase is connected, we'll create the following tables:

### **Database Schema (To Be Created)**
```sql
-- Users table with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'user')),
  client_id UUID REFERENCES clients(id),
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Files table with assignment tracking
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size_bytes INTEGER,
  assigned_to_client UUID REFERENCES clients(id),
  assigned_to_user UUID REFERENCES users(id),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table for communication
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  subject TEXT,
  content TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📋 **Features Implemented**

### ✅ **Current Features**
- [x] Role-based authentication system
- [x] Responsive dashboard layouts
- [x] Admin system overview and management
- [x] Client team management interface  
- [x] User file access interface
- [x] Professional design system
- [x] Dark mode support
- [x] Navigation and routing
- [x] Demo mode with role switching

### 🔄 **Pending Integration** (Requires Supabase)
- [ ] Real user authentication
- [ ] Database CRUD operations
- [ ] File upload and storage
- [ ] Message system
- [ ] User management
- [ ] Client management
- [ ] File assignment logic
- [ ] Permission enforcement

## 📱 **Mobile Support**

The application is built with responsive design principles:
- Mobile-friendly navigation
- Touch-optimized interactions
- Responsive grid layouts
- Collapsible sidebar on mobile

**Future Mobile App**: The structure supports React Native implementation for native mobile apps.

## 🔒 **Security Features**

### **Access Control**
- Role-based permission system
- Data isolation between clients
- Secure authentication hooks
- Protected routes by role

### **Data Privacy**
- Client data segregation
- User-specific file access
- Controlled communication channels
- Permission-based feature access

## 🛠️ **Development Guidelines**

### **Code Organization**
- Components are organized by feature and role
- Shared UI components in `/ui` directory
- Custom hooks for state management
- Utility functions for common operations

### **Styling Conventions**
- Use semantic color tokens from design system
- Never use direct colors (e.g., `text-white`)
- All colors defined in `index.css`
- Role-based styling with semantic classes

### **Component Structure**
```typescript
// Every component includes detailed JSDoc comments
/**
 * ComponentName
 * 
 * Purpose: Clear description of component function
 * Features: List of key features
 * Access Control: Role-based access rules (if applicable)
 * Props: Description of props and their types
 */
```

## ⏱️ **Timeline Estimate**

### **Current Status**: Frontend Complete (3 hours)
- ✅ Design system implementation
- ✅ Authentication structure
- ✅ Role-based dashboards
- ✅ Responsive layout
- ✅ Demo functionality

### **Next Phase**: Backend Integration (2-3 hours)

**STEP 3: Authentication Integration** (45 minutes)
- Replace mock authentication in `useAuth.ts` with Supabase Auth
- Implement email/password authentication 
- Add role-based access control with RLS policies
- Update login flow to use real authentication

**STEP 4: File Management System** (60 minutes)
- Implement file upload functionality using Supabase Storage
- Create file assignment system (Admin to Client/User)
- Add file download and viewing capabilities
- Implement access control for file operations

**STEP 5: Messaging System** (45 minutes)
- Create real-time messaging between roles
- Implement message notifications
- Add message history and read status
- Build message management interface

**STEP 6: Dashboard Data Integration** (30 minutes)
- Replace mock data with real database queries
- Add analytics and reporting for Admin
- Implement user management for Clients
- Add file and message counters for all roles

**STEP 7: Advanced Features** (Optional - 1-2 hours)
- File expiration and versioning
- Download logging and activity tracking
- Push notifications (future mobile app)
- Advanced analytics and reporting

### **Total Project**: 5-6 hours for complete system

## 💰 **Cost Breakdown**

### **Development**: FREE
- Lovable platform (free tier)
- Open source components
- No licensing fees

### **Hosting**: FREE
- Lovable hosting included
- Supabase free tier (up to 500MB)
- No additional hosting costs

### **Total Cost**: $0 for development and initial hosting

## 🤝 **Contributing**

This is a learning project with extensive documentation:
- Every component has detailed comments
- Business logic is clearly explained
- Code structure follows best practices
- README provides comprehensive guidance

## 📞 **Support**

For questions about the client portal system:
1. Review component documentation in code
2. Check this README for architecture details
3. Examine the demo functionality
4. Contact your administrator for access issues

---

**Built with ❤️ using Lovable, React, TypeScript, and Tailwind CSS**