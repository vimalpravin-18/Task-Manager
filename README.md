# 🚀 Task Manager Application

A full-stack productivity-focused Task Manager application built with React, Node.js, Express, and PostgreSQL. The application helps users organize tasks, track progress, manage priorities, set goals, and improve productivity through a clean and modern user experience.

---

## 🌐 Live Demo

Frontend: https://your-vercel-url.vercel.app

Backend API: https://your-render-url.onrender.com

---

## 📸 Screenshots

Add screenshots here after deployment.

* Dashboard
* Tasks Page
* Profile Page
* Settings Page
* Mobile View

---

## ✨ Features

### Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes

### Task Management

* Create Tasks
* Edit Tasks
* Delete Tasks
* Mark Tasks as Complete
* Task Categories
* Task Priorities
* Due Dates
* Task Status Tracking

### Productivity Features

* Daily Productivity Goals
* Task Progress Tracking
* Dashboard Overview
* Task Analytics

### User Features

* Profile Management
* Avatar Upload
* Bio and Personal Information
* Personalized Settings

### Settings

* Dark / Light Theme
* Accent Color Customization
* Default Task Preferences
* Productivity Goal Settings
* Privacy Settings

### Notifications

* Email Task Reminders
* Scheduled Reminder System
* Automated Cron Jobs

### User Experience

* Responsive Design
* Modern UI with Tailwind CSS
* Toast Notifications
* Loading States
* Error Handling
* PWA Support

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* Recharts
* Firebase
* React Hot Toast

### Backend

* Node.js
* Express.js
* PostgreSQL
* pg
* JWT
* bcryptjs
* Nodemailer
* Node-Cron
* Express Validator

### Database

* PostgreSQL

### Deployment

* Vercel (Frontend)
* Render (Backend)
* Neon PostgreSQL (Database)

---

## 📂 Project Structure

```text
TASK MANAGER
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── cron/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/vimalpravin-18/Task-Manager.git
cd Task-Manager
```

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_secret_key

EMAIL_USER=your_email

EMAIL_PASS=your_email_app_password
```

Run Backend

```bash
npm start
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:5000
```

Run Frontend

```bash
npm run dev
```

---

## 🔑 API Endpoints

### Authentication

| Method | Endpoint           | Description      |
| ------ | ------------------ | ---------------- |
| POST   | /api/auth/register | Register User    |
| POST   | /api/auth/login    | Login User       |
| GET    | /api/auth/me       | Get Current User |
| PUT    | /api/auth/profile  | Update Profile   |

### Tasks

| Method | Endpoint       | Description   |
| ------ | -------------- | ------------- |
| GET    | /api/tasks     | Get All Tasks |
| POST   | /api/tasks     | Create Task   |
| PUT    | /api/tasks/:id | Update Task   |
| DELETE | /api/tasks/:id | Delete Task   |

---

## 🎯 Future Improvements

* Drag & Drop Tasks
* Calendar View
* Team Collaboration
* Real-Time Notifications
* Mobile Application
* AI Productivity Insights

---

## 👨‍💻 Author

**Vimal Pravin**

LinkedIn: https://in.linkedin.com/in/vimal-pravin-v

GitHub: https://github.com/vimalpravin-18

---

## 📜 License

This project is licensed under the MIT License.
