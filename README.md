# 🚀 Task Manager Application

A modern full-stack Task Manager application built with React, Node.js, Express, PostgreSQL, and Firebase Authentication. This application helps users organize tasks, track productivity, manage priorities, and stay focused through a clean and responsive user experience.

---

## 🌐 Live Demo

### Frontend
https://task-manager-blond-seven-67.vercel.app

### Backend API
https://task-manager-af3q.onrender.com

### GitHub Repository
https://github.com/vimalpravin-18/Task-Manager

---


## ✨ Features

### 🔐 Authentication
- User Registration
- User Login
- Google Authentication (Firebase)
- JWT Authentication
- Protected Routes

### ✅ Task Management
- Create Tasks
- Edit Tasks
- Delete Tasks
- Task Categories
- Task Priorities (High, Medium, Low)
- Task Status Tracking
- Due Dates
- Search Tasks

### 📊 Productivity Features
- Daily Productivity Goals
- Progress Tracking
- Task Analytics Dashboard
- Task Completion Statistics

### 👤 User Management
- Update Profile
- Change Password
- Delete Account
- User Preferences

### ⚙️ Settings
- Dark Mode / Light Mode
- Appearance Settings
- Task Default Status
- Task Default Priority
- Productivity Goals
- Privacy Settings

### 📧 Notifications
- Email Reminders
- Scheduled Task Notifications
- Automated Cron Jobs

### 📱 Responsive Design
- Mobile Friendly
- Tablet Friendly
- Desktop Friendly
- Progressive Web App (PWA)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Firebase Authentication
- React Hot Toast
- Recharts

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs
- Nodemailer
- node-cron
- Express Validator
- CORS

### Database
- PostgreSQL (Neon)

### Deployment
- Vercel (Frontend)
- Render (Backend)
- Neon PostgreSQL (Database)

---

## 🏗️ System Architecture

```text
User
 │
 ▼
React Frontend (Vercel)
 │
 ▼
Express API (Render)
 │
 ▼
PostgreSQL Database (Neon)
 │
 ▼
Firebase Authentication
```

---

## 📂 Project Structure

```text
Task-Manager
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── services
│   │   ├── context
│   │   ├── hooks
│   │   └── utils
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── backend
│   ├── routes
│   ├── middleware
│   ├── services
│   ├── database
│   ├── config
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── README.md
└── screenshots
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/vimalpravin-18/Task-Manager.git

cd Task-Manager
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|----------|----------|----------|
| POST | /api/auth/register | Register User |
| POST | /api/auth/login | Login User |
| POST | /api/auth/social-login | Google Login |
| GET | /api/auth/me | Get Current User |
| PUT | /api/auth/profile | Update User Profile |
| PUT | /api/auth/password | Change Password |
| DELETE | /api/auth/account | Delete Account |

---

### Tasks

| Method | Endpoint | Description |
|----------|----------|----------|
| GET | /api/tasks | Get All Tasks |
| GET | /api/tasks/:id | Get Task By ID |
| POST | /api/tasks | Create Task |
| PUT | /api/tasks/:id | Update Task |
| DELETE | /api/tasks/:id | Delete Task |

---

## 🎯 Key Learning Outcomes

This project helped me gain practical experience in:

- Full Stack Development
- REST API Development
- Authentication & Authorization
- PostgreSQL Database Design
- Firebase Authentication
- Frontend State Management
- Responsive UI Development
- Deployment using Vercel & Render
- Production Environment Configuration

---

## 🚀 Future Enhancements

- Drag & Drop Tasks
- Calendar View
- Team Collaboration
- Real-Time Notifications
- AI Productivity Assistant
- Mobile Application
- Advanced Analytics Dashboard

---
