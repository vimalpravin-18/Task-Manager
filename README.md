<<<<<<< HEAD
# Task Manager Application

## Project Description

This is a full-stack Task Manager application designed to help users organize their daily tasks efficiently. It features user authentication, task creation, tracking, and management, along with reminders and personalized settings.

## Features

*   **User Authentication**: Register, Login, and secure access with JSON Web Tokens (JWT).
*   **Task Management**: Create, Read, Update, and Delete (CRUD) tasks.
*   **Task Prioritization**: Set priorities (high, medium, low) for tasks.
*   **Task Status Tracking**: Update task status (pending, in progress, completed).
*   **Task Categorization**: Organize tasks with custom categories.
*   **Due Dates**: Assign due dates to tasks.
*   **Task Reminders**: Email reminders for upcoming tasks via scheduled cron jobs.
*   **User Profiles**: Manage user profile information (bio, avatar).
*   **User Preferences**: Customize application theme, accent color, default view, and task goals.
*   **Responsive UI**: Modern and intuitive user interface built with React and Tailwind CSS.
*   **Dashboard**: Overview of tasks and progress (potentially with charts).
*   **Error Handling**: Robust error handling on both frontend and backend.

## Technologies Used

### Frontend

*   **React.js**: JavaScript library for building user interfaces.
*   **Vite**: Fast frontend build tool.
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **React Router DOM**: For declarative routing in React applications.
*   **Axios**: Promise-based HTTP client for the browser and Node.js.
*   **Firebase**: For client-side configuration (e.g., environment variables, potentially authentication helpers).
*   **React Hot Toast**: For elegant and responsive toast notifications.
*   **Recharts**: A composable charting library built with React and D3.

### Backend

*   **Node.js**: JavaScript runtime environment.
*   **Express.js**: Fast, unopinionated, minimalist web framework for Node.js.
*   **PostgreSQL**: Powerful, open-source object-relational database system.
*   **`pg`**: Node.js driver for PostgreSQL.
*   **Bcrypt.js**: Library for hashing passwords securely.
*   **JSON Web Token (JWT)**: For secure authentication and authorization.
*   **Dotenv**: To load environment variables from a `.env` file.
*   **CORS**: Middleware for enabling Cross-Origin Resource Sharing.
*   **Express Validator**: Middleware for request data validation.
*   **Node-Cron**: A tool for scheduling tasks in Node.js (e.g., task reminders).
*   **Nodemailer**: Module for sending emails from Node.js applications.

## Architecture

The application follows a client-server architecture. The React frontend communicates with the Node.js/Express backend via RESTful API calls. The backend interacts with a PostgreSQL database and handles authentication, task logic, and scheduled reminders.

```mermaid
graph TD
    User -->|Uses| Frontend[Frontend: React.js App]
    Frontend -->|API Requests| Backend[Backend: Node.js/Express.js API]
    Backend -->|Queries| PostgreSQL[Database: PostgreSQL]
    Backend -- sends -->|Email Notifications| EmailService[Email Service: Nodemailer]
    Backend -- schedules -->|Task Reminders| CronJob[Cron Job: node-cron]
```

## Installation

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or Yarn
*   PostgreSQL installed and running

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/task-manager.git
cd task-manager
```

### 2. Backend Setup

Navigate to the `backend` directory, install dependencies, and configure environment variables.

```bash
cd backend
npm install
```

#### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=5000
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your_jwt_secret_key"
EMAIL_SERVICE_HOST="your_email_host"
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_USER="your_email_username"
EMAIL_SERVICE_PASSWORD="your_email_password"
```

*   `PORT`: Port for the backend server.
*   `DATABASE_URL`: Connection string for your PostgreSQL database.
*   `JWT_SECRET`: A strong, secret key for signing JWTs.
*   `EMAIL_SERVICE_HOST`: SMTP host for your email service.
*   `EMAIL_SERVICE_PORT`: SMTP port (e.g., 587 for TLS).
*   `EMAIL_SERVICE_USER`: Your email address for sending reminders.
*   `EMAIL_SERVICE_PASSWORD`: Your email password or app-specific password.

#### Database Initialization

The backend server will automatically initialize the necessary tables (`users`, `tasks`, `user_preferences`) in your PostgreSQL database on startup if they don't already exist.

### 3. Frontend Setup

Navigate to the `frontend` directory, install dependencies, and configure environment variables.

```bash
cd ../frontend
npm install
```

#### Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_firebase_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
```

*   `VITE_API_BASE_URL`: The base URL for your backend API.
*   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.: Your Firebase project configuration details.

## Usage

### 1. Start the Backend Server

From the `backend` directory:

```bash
npm start
# or for development with hot-reloading
npm run dev
```

The backend server will start on the configured PORT (default: 5000).

### 2. Start the Frontend Application

From the `frontend` directory:

```bash
npm run dev
```

The frontend application will start, usually on `http://localhost:5173`.

Open your browser and navigate to the frontend URL. You can now register a new user, log in, and start managing your tasks!

## API Endpoints

### Authentication (`/api/auth`)

*   `POST /api/auth/register`: Register a new user.
*   `POST /api/auth/login`: Log in a user and get a JWT.
*   `GET /api/auth/me`: Get current user details (protected route).
*   `PUT /api/auth/profile`: Update user profile (protected route).

### Tasks (`/api/tasks`)

*   `GET /api/tasks`: Get all tasks for the authenticated user.
*   `GET /api/tasks/:id`: Get a specific task by ID.
*   `POST /api/tasks`: Create a new task.
*   `PUT /api/tasks/:id`: Update an existing task.
*   `DELETE /api/tasks/:id`: Delete a task.

## Frontend Routes

*   `/`: Dashboard (requires authentication)
*   `/login`: User Login page
*   `/register`: User Registration page
*   `/tasks`: View and manage all tasks (requires authentication)
*   `/tasks/create`: Create a new task (requires authentication)
*   `/profile`: View and edit user profile (requires authentication)
*   `/settings`: Manage user preferences and settings (requires authentication)

## Contributing

Contributions are welcome! Please feel free to fork the repository, make changes, and submit pull requests.

## License

This project is licensed under the MIT License.
=======
# Task-Manager
>>>>>>> b87291704d8f5133fee69407af95c9fdf5e6c9e2
