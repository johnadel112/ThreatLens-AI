The goal of the project is to demonstrate how security events can be collected, analyzed, correlated, investigated, and reported in a professional cybersecurity platform.

Unlike a basic dashboard, ThreatLens AI focuses on the full security operations lifecycle: from event ingestion to incident investigation and final reporting.

Key Features
User Authentication
Secure registration and login
JWT-based authentication
Role-based access control for Admin and Analyst users
Live Security Event Generation
Automatic per-user live JSON security events
Events include authentication activity, suspicious logins, file downloads, admin actions, API activity, malware-style events, and attack-chain behavior
Rule-Based Detection Engine
Brute force detection
Suspicious login detection
Data exfiltration detection
Suspicious admin activity detection
Port scan / reconnaissance detection
Privilege escalation detection
Alerts and Incident Management
Automatic alert creation from detection rules
Related alerts grouped into incidents/cases
Incident timeline, evidence, severity, and status tracking
AI Agent Investigation Workflow
Triage Agent
Investigation Agent
Threat Classification Agent
Mitigation Agent
Report Agent
Reviewer Agent
SOAR-Style Playbook Actions
AI-recommended response actions
Human approval before execution
Simulated safe actions such as locking accounts, blocking IPs, forcing password resets, and escalating incidents
SOC Report Generation
Professional AI-assisted incident reports
Timeline, evidence, classification, root-cause analysis, impact assessment, mitigation recommendations, and reviewer notes
Security Dashboard
Live monitoring overview
Events, alerts, incidents, reports, audit logs, and detection rules
Futuristic cybersecurity UI with live status indicators and visual threat intelligence components
Tech Stack
Frontend
React
Vite
Tailwind CSS
Recharts
Three.js / React Three Fiber
Framer Motion
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT Authentication
Bcrypt password hashing
AI Service
Python
FastAPI
Multi-agent AI investigation workflow
LLM-based incident analysis and SOC report generation
DevOps / Deployment
Vercel for frontend deployment
Cloud backend deployment
MongoDB Atlas
GitHub version control
Why This Project Matters

ThreatLens AI was built to demonstrate practical skills across multiple areas of software engineering and cybersecurity:

Full-stack application development
Backend API design
Authentication and authorization
Cybersecurity detection logic
SOC/SIEM workflows
AI-assisted investigation
Safe automation and playbook approval
MongoDB data modeling
Real-time dashboard design
Professional UI/UX for security platforms

The project is designed as a flagship portfolio project that shows the ability to build a realistic, complex, and visually polished security operations platform.


Live Demo:https://threat-lens-ai-bay.vercel.app/login
