# UniResolve: Web-Based Issue Resolution Portal

This work proposes UniResolve: Web-Based Issue Resolution Portal, an intelligent and role-based web application designed to address the inefficiencies of traditional paper-based complaint management systems in educational institutions. The system provides a structured platform for reporting, assigning, tracking, and resolving campus-related issues such as infrastructure failures, technical faults, hostel maintenance requests, and academic resource shortages.

Developed using React.js for the frontend, Node.js with Express.js for the backend, and a relational database for persistent storage, the portal enables students to submit complaints with details including title, description, category, location, and priority level through an intuitive interface. The application incorporates AI-based category prediction and duplicate issue detection to improve reporting accuracy and reduce redundancy. 

Administrators manage complaints through a centralized dashboard that supports staff assignment, priority-based routing, real-time monitoring, and analytics-driven decision making. Additional features such as role-based access control, notification and escalation mechanisms, chatbot assistance, SLA compliance tracking, CSV export, and weekly trend analysis ensure transparency, accountability, and efficient resolution of issues. By providing a responsive and accessible platform in which most tasks can be completed within two user interactions, the system demonstrates how modern web technologies and intelligent automation can significantly improve campus management and institutional service delivery.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key. Also configure database connection details if necessary.
3. Run the app:
   `npm run dev`
