# Registros - Forms & Surveys Platform

> Functional framework for surveys, registrations, and forms. It accelerates development by providing a centralized management dashboard and data infrastructure out of the box. Developers only need to build the specific questionnaire UI and schema based on concrete specifications, drastically reducing time-to-market for new forms.

## 🚀 Key Features

- **Extensible Architecture:** Designed to easily add new forms by just creating a Zod schema, a Prisma model, and a React component.
- **Dynamic Admin Dashboard:** Automatically adapts to new form schemas. Features dynamic data tables with universal search, per-column filtering, and ISO date formatting.
- **Security First:** Includes secure JWT-based authentication for administrators, bcrypt password hashing, and optional "Password Walls" to protect public forms.
- **Advanced Exporting:** Export any form submission data to PDF or Excel directly from the dashboard.
- **Unified Docker Production:** The frontend and backend are seamlessly served by a single Docker container via Express static serving, completely bypassing CORS issues and optimizing resource usage.

## 🛠 Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Shadcn/UI
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL
- **Infrastructure:** Docker, Docker Compose

## 📦 Quick Start (Production)

The easiest way to run the platform is using Docker. Ensure you have Docker and Docker Compose installed.

1. **Clone the repository** (or download the source code).
2. **Start the containers**:
   ```bash
   docker compose up -d --build
   ```
3. **Access the application**:
   Open `http://localhost` in your browser.
4. **Initial Login**:
   If the database was just created, run the seed script to create the default administrator:
   ```bash
   docker exec registros-app-1 node seed.js
   ```
   *Default Credentials:* `admin@example.com` / `admin123`

## 📖 Documentation

For detailed instructions on how to create a new form or understand the architecture, please refer to the internal documentation:
- [Developer Guide (How to add forms)](docs/DEVELOPER_GUIDE.md)
- [Technical Architecture Annex](docs/TECHNICAL_ANNEX.md)
- [Docker Architecture Annex](docs/CONTAINERIZATION_ANNEX.md)
