# NetzFlow

NetzFlow is a full-stack internal operations portal designed for managing network infrastructure, maintenance activities, and operational workflows.

The project was inspired by enterprise network operations environments and focuses on practical frontend/backend integration, dashboard visualization, and process management.

---

## Features

### Dashboard
- Device overview
- Infrastructure statistics
- Operational status indicators
- Open ticket monitoring

### Device Management
- View network devices
- Track device status
- Monitor infrastructure locations
- Device inventory overview

### Ticket Management
- View operational tickets
- Track issue status
- Priority management
- Assignment tracking

### Network Monitoring
- Online devices
- Warning states
- Maintenance tracking
- Infrastructure health overview

---

## Technology Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Django
- Django REST Framework

### Database
- SQLite (development)

---

## Architecture

```text
Frontend (Next.js)
        │
        ▼
REST API (Django REST Framework)
        │
        ▼
Database (SQLite)
```

---

## Project Structure

```text
NetzFlow
│
├── backend
│   ├── core
│   ├── operations
│   └── manage.py
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
└── README.md
```

---

## Dashboard Overview

Current dashboard provides:

- Total Devices
- Online Devices
- Warning Devices
- Devices in Maintenance
- Open Tickets

Additionally:

- Devices table
- Tickets table
- Enterprise-style sidebar navigation

---

## API Endpoints

### Devices

```http
GET    /api/devices/
POST   /api/devices/
PUT    /api/devices/{id}/
DELETE /api/devices/{id}/
```

### Tickets

```http
GET    /api/tickets/
POST   /api/tickets/
PUT    /api/tickets/{id}/
DELETE /api/tickets/{id}/
```

---

## Local Development Setup

### Backend

Navigate to backend:

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py migrate
```

Start server:

```bash
python manage.py runserver
```

Backend runs on:

```text
http://127.0.0.1:8000
```

---

### Frontend

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```


## Future Enhancements

Planned features:

- Device Search
- Device Filters
- Create/Edit/Delete Devices
- Ticket CRUD Operations
- Authentication & Authorization
- Activity Logging
- Dashboard Charts
- Device Details Pages
- Network Health Monitoring
- Legacy Data Import Module

## Motivation

The goal of NetzFlow is to simulate a modern internal enterprise operations portal similar to systems used by infrastructure, network, and operations teams.

The project focuses on:

- Frontend/Backend integration
- API-driven architecture
- Enterprise application design
- Operational workflow management
- Portal modernization concepts


## Screenshots

![Dashboard](/dashboard.png)
![Dashboard](/devices.png)
![Dashboard](/tickets.png)
![Dashboard](/details.png)

## Author

Built as a learning project to explore full-stack enterprise application development using React, Next.js, Django, and REST APIs.
