/**
 * Replace marketplace catalog with college-team developer projects.
 * Run: npm run seed:college-projects
 *
 * Currently seeds Ambikeshwar first — add more teammates one by one later.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Project = require('../models/Project');
const Category = require('../models/Category');
const User = require('../models/User');
const seedDevelopers = require('./seedDevelopers');

const SM_SERVICES_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789832504/sm-global-hub/projects/sm-services-login.jpg';

const SM_SERVICES_PDF =
  'https://res.cloudinary.com/luysen3q/raw/upload/v1789833537/sm-global-hub/docs/SM_Services_Project_Documentation.pdf';

const SM_SERVICES_GITHUB =
  'https://github.com/smserviceindore-a11y/SmHierankTask/tree/main/Ambikeshwar/invoice_app';

/** Rich HTML description (frontend uses dangerouslySetInnerHTML + .prose-project) */
const SM_SERVICES_DESCRIPTION = [
  '<h1>SM SERVICES — Invoice &amp; Billing System</h1>',
  '<p><em>Comprehensive Technical &amp; System Documentation | Enterprise Release 2026</em></p>',
  '<p>The SM SERVICES Invoice &amp; Billing Automation System is a full-stack, enterprise-grade web application designed to streamline billing operations, receipt data extractions, and financial reporting. Built with a high-performance Flask architecture and styled in a customized <strong>Cyan Slate Neon UI Theme</strong>, it delivers an intuitive interface alongside robust PDF generation capabilities.</p>',

  '<h2>1. Executive Overview</h2>',
  '<p>SM SERVICES centralizes invoice creation, OCR-based receipt capture, PDF tax invoice generation, UPI payment QR codes, and live sales reporting in one secure web console.</p>',

  '<h2>2. Technology Stack &amp; Dependencies</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Component</th><th>Technology / Library</th><th>Purpose &amp; Role</th></tr></thead>',
  '<tbody>',
  '<tr><td>Backend Framework</td><td>Flask 3.x (Python)</td><td>Application routing, session management, RESTful endpoints.</td></tr>',
  '<tr><td>Database</td><td>SQLite3</td><td>Relational data storage for invoices and user credentials.</td></tr>',
  '<tr><td>Authentication</td><td>Flask-Login &amp; Werkzeug</td><td>Session persistence, route security, password hashing.</td></tr>',
  '<tr><td>PDF Engine</td><td>ReportLab Engine</td><td>Dynamic generation of corporate-styled PDF tax invoices.</td></tr>',
  '<tr><td>OCR Processing</td><td>Pytesseract &amp; PIL</td><td>Extracting text data from uploaded physical receipt images.</td></tr>',
  '<tr><td>Document Scanning</td><td>pdfplumber &amp; python-docx</td><td>Scanning digital PDF and Word documents for data pre-fill.</td></tr>',
  '<tr><td>Payment Integration</td><td>qrcode Engine</td><td>Generating dynamic UPI payment QR codes on-the-fly.</td></tr>',
  '<tr><td>Frontend UI / UX</td><td>Bootstrap 5 &amp; Custom CSS3</td><td>Dark slate / neon responsive user interface.</td></tr>',
  '</tbody></table></div>',

  '<h2>3. Core System Features</h2>',
  '<ul>',
  '<li><strong>Authentication &amp; Access Control:</strong> Secured user sessions via Flask-Login. Passwords stored using PBKDF2 hashing with Werkzeug security tools.</li>',
  '<li><strong>Automated Invoice Counter:</strong> Sequential, structured invoice number generation formatted as <code>YYYY-YY/SM/DIC/XX</code>.</li>',
  '<li><strong>Multi-Format OCR Scanner:</strong> Extracts structured text from receipt images (.png, .jpg), PDFs, and Word documents (.docx).</li>',
  '<li><strong>Dynamic Itemization Table:</strong> Interactive DOM manipulation allowing users to add/delete line items with automatic tax calculations.</li>',
  '<li><strong>Dynamic UPI QR Generator:</strong> Auto-embeds merchant UPI payment QR codes directly into generated PDF receipts.</li>',
  '<li><strong>Dark Slate Neon UI Design:</strong> Modern, high-contrast dark theme utilizing <code>#0B132B</code> (Slate) and <code>#00F5D4</code> (Neon Cyan) palette.</li>',
  '<li><strong>Real-time Sales Dashboard:</strong> Track total revenue generated, pending invoice counts, and instant live table search filtering.</li>',
  '</ul>',

  '<h2>4. Route Map &amp; Application Endpoints</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Endpoint</th><th>HTTP Method</th><th>Auth Required</th><th>Description</th></tr></thead>',
  '<tbody>',
  '<tr><td><code>/</code></td><td>GET</td><td>No</td><td>Public Landing / Marketing Page.</td></tr>',
  '<tr><td><code>/login</code></td><td>GET / POST</td><td>No</td><td>User authentication &amp; credential validation.</td></tr>',
  '<tr><td><code>/logout</code></td><td>GET</td><td>Yes</td><td>Terminates active session and clears cookies.</td></tr>',
  '<tr><td><code>/app</code></td><td>GET</td><td>Yes</td><td>Main Invoice Generator workspace UI.</td></tr>',
  '<tr><td><code>/scan_receipt</code></td><td>POST</td><td>Yes</td><td>OCR receipt image &amp; file scanner API.</td></tr>',
  '<tr><td><code>/generate_pdf</code></td><td>POST</td><td>Yes</td><td>Builds PDF invoice and updates database.</td></tr>',
  '<tr><td><code>/dashboard</code></td><td>GET</td><td>Yes</td><td>Analytics dashboard and invoice database.</td></tr>',
  '</tbody></table></div>',

  '<h2>5. Database Architecture (database.db)</h2>',
  '<p><strong>Table: users</strong></p>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>',
  '<tbody>',
  '<tr><td><code>id</code></td><td>INTEGER</td><td>Primary Key, Auto-increment</td></tr>',
  '<tr><td><code>username</code></td><td>TEXT</td><td>Unique, Not Null</td></tr>',
  '<tr><td><code>password</code></td><td>TEXT</td><td>Hashed password string</td></tr>',
  '</tbody></table></div>',
  '<p><strong>Table: invoices</strong></p>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Column</th><th>Type</th><th>Notes</th></tr></thead>',
  '<tbody>',
  '<tr><td><code>id</code></td><td>INTEGER</td><td>Primary Key</td></tr>',
  '<tr><td><code>invoice_no</code></td><td>TEXT</td><td>Unique</td></tr>',
  '<tr><td><code>date</code> / <code>supplier_name</code> / <code>client_name</code></td><td>TEXT</td><td>Invoice meta fields</td></tr>',
  '<tr><td><code>gross_amount</code> / <code>tax_amount</code> / <code>total_amount</code></td><td>REAL</td><td>Amount fields</td></tr>',
  '<tr><td><code>status</code></td><td>TEXT</td><td>Default: Pending</td></tr>',
  '</tbody></table></div>',

  '<h2>6. Setup &amp; Execution Guide</h2>',
  '<ul>',
  '<li><strong>Install Dependencies:</strong> <code>pip install flask flask-login py-tesseract pdfplumber python-docx qrcode reportlab pillow werkzeug</code></li>',
  '<li><strong>Install OCR Engine:</strong> Install Tesseract OCR on the system path for receipt image scanning capabilities.</li>',
  '<li><strong>Initialize &amp; Run App:</strong> Run <code>python app.py</code>. The app automatically provisions <code>database.db</code> and default credentials (<code>admin</code> / <code>admin123</code>).</li>',
  '</ul>',

  '<h2>Demo Access</h2>',
  '<p>Live preview: <a href="https://invoice-app-9.onrender.com/" target="_blank" rel="noopener noreferrer">https://invoice-app-9.onrender.com/</a></p>',
  '<p><strong>Default demo login:</strong> Username <code>admin</code> · Password <code>admin123</code></p>',
].join('\n');

const YASH_HEALTH_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789834138/sm-global-hub/projects/yash-health-connect-login.jpg';

const YASH_HEALTH_GITHUB =
  'https://github.com/smserviceindore-a11y/SmHierankTask/tree/main/Yash/Health';

const YASH_HEALTH_DEMO = 'https://yash-health-connect-frontend.vercel.app/';

const YASH_HEALTH_DESCRIPTION = [
  '<h1>Yash Health Connect — Hospital Management System</h1>',
  '<p><em>Smart Healthcare Platform · Multi-role HMS SaaS</em></p>',
  '<p><strong>Smarter care. Stronger management.</strong> Yash Health Connect is a full-stack hospital management platform that lets hospitals manage appointments, medical reports, billing, doctors, patients and day-to-day operations from one secure place — with role-based login for Super Admin, Hospital Admin, Doctor and Patient.</p>',

  '<h2>1. Executive Overview</h2>',
  '<p>Built as a modern healthcare SaaS, the product combines a React + Vite frontend with a Node.js / Express / MongoDB API. Hospitals can register, subscribe to plans, manage doctors and appointments, collect payments via Razorpay, generate clinical reports, run video consultations, and use AI-assisted workflows — all behind JWT role-based authentication.</p>',

  '<h2>2. Technology Stack &amp; Dependencies</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Component</th><th>Technology / Library</th><th>Purpose &amp; Role</th></tr></thead>',
  '<tbody>',
  '<tr><td>Frontend</td><td>React 18, Vite, Tailwind CSS, Lucide</td><td>Responsive dashboards, auth screens, role-based UI.</td></tr>',
  '<tr><td>Routing / HTTP</td><td>React Router, Axios</td><td>Client navigation and API communication.</td></tr>',
  '<tr><td>Backend</td><td>Node.js, Express 5</td><td>REST API, middleware, multi-tenant hospital logic.</td></tr>',
  '<tr><td>Database</td><td>MongoDB + Mongoose</td><td>Users, hospitals, appointments, payments, care rooms.</td></tr>',
  '<tr><td>Auth</td><td>JWT + bcryptjs</td><td>Secure login with role selection (4 roles).</td></tr>',
  '<tr><td>Realtime</td><td>Socket.io</td><td>Live care-room messaging and consultation updates.</td></tr>',
  '<tr><td>Payments</td><td>Razorpay</td><td>Appointment fees and hospital subscription billing.</td></tr>',
  '<tr><td>Media / Docs</td><td>Cloudinary, Multer, PDFKit</td><td>Report uploads, branding assets, PDF outputs.</td></tr>',
  '</tbody></table></div>',

  '<h2>3. Core System Features</h2>',
  '<ul>',
  '<li><strong>Role-based access:</strong> Super Admin, Hospital Admin, Doctor and Patient — each with a dedicated workspace.</li>',
  '<li><strong>Smart appointments:</strong> Book, approve and track slots with doctor specialty, fees and payment status.</li>',
  '<li><strong>Secure medical records:</strong> Patient reports and clinical documents stored per hospital tenant.</li>',
  '<li><strong>Video consultation:</strong> Dedicated consultation room route for remote care sessions.</li>',
  '<li><strong>AI assistance:</strong> Dedicated AI API routes for healthcare assistance workflows.</li>',
  '<li><strong>Care Connect rooms:</strong> Post-visit care plans, patient check-ins, doctor messages and update requests.</li>',
  '<li><strong>Hospital SaaS subscriptions:</strong> Basic / Professional / Enterprise plans with Razorpay checkout.</li>',
  '<li><strong>Analytics &amp; billing:</strong> Revenue, appointment and hospital operations dashboards.</li>',
  '</ul>',

  '<h2>4. User Roles &amp; Access</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Role</th><th>Who</th><th>Key capabilities</th></tr></thead>',
  '<tbody>',
  '<tr><td>Super Admin</td><td>Platform owner</td><td>Approve hospitals, platform settings, cross-hospital oversight.</td></tr>',
  '<tr><td>Hospital Admin</td><td>Hospital operator</td><td>Doctors, branding, subscriptions, appointments, staff ops.</td></tr>',
  '<tr><td>Doctor</td><td>Clinician</td><td>Schedule, prescriptions, care rooms, consultations.</td></tr>',
  '<tr><td>Patient</td><td>End user</td><td>Book appointments, pay fees, view reports, care check-ins.</td></tr>',
  '</tbody></table></div>',

  '<h2>5. API Surface (Backend Routes)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Route prefix</th><th>Module</th><th>Description</th></tr></thead>',
  '<tbody>',
  '<tr><td><code>/api/auth</code></td><td>Authentication</td><td>Login, signup, role-aware doctor discovery.</td></tr>',
  '<tr><td><code>/api/hospitals</code></td><td>Hospitals</td><td>Hospital registration, approval and tenant data.</td></tr>',
  '<tr><td><code>/api/doctors</code></td><td>Doctors</td><td>Doctor profiles, availability and specialty.</td></tr>',
  '<tr><td><code>/api/appointments</code></td><td>Appointments</td><td>Booking, approval workflow and slot management.</td></tr>',
  '<tr><td><code>/api/payments</code></td><td>Payments</td><td>Razorpay orders and appointment fee collection.</td></tr>',
  '<tr><td><code>/api/subscriptions</code></td><td>Subscriptions</td><td>Hospital SaaS plan billing.</td></tr>',
  '<tr><td><code>/api/reports</code></td><td>Reports</td><td>Medical report metadata and file links.</td></tr>',
  '<tr><td><code>/api/clinical</code></td><td>Clinical</td><td>Prescriptions and clinical workflows.</td></tr>',
  '<tr><td><code>/api/care</code></td><td>Care Connect</td><td>Care rooms, check-ins and messaging.</td></tr>',
  '<tr><td><code>/api/ai</code></td><td>AI Assistance</td><td>AI helper endpoints for care support.</td></tr>',
  '<tr><td><code>/api/analytics</code></td><td>Analytics</td><td>Operational and revenue insights.</td></tr>',
  '<tr><td><code>/api/settings</code></td><td>Settings</td><td>Platform / system configuration.</td></tr>',
  '</tbody></table></div>',

  '<h2>6. Data Model Highlights (MongoDB)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Collection</th><th>Key fields</th><th>Notes</th></tr></thead>',
  '<tbody>',
  '<tr><td>User</td><td>name, email, role, hospitalId</td><td>Roles: super_admin, hospital_admin, doctor, patient, staff.</td></tr>',
  '<tr><td>Hospital</td><td>name, status, plan, branding</td><td>Tenant with approval + subscription state.</td></tr>',
  '<tr><td>Doctor</td><td>specialty, fees, availability</td><td>Linked to user + hospital.</td></tr>',
  '<tr><td>Appointment</td><td>date, time, fee, paymentStatus</td><td>Indexed for hospital / doctor / patient queries.</td></tr>',
  '<tr><td>Payment / Subscription</td><td>Razorpay IDs, amount, plan</td><td>Fees and SaaS billing records.</td></tr>',
  '<tr><td>CareRoom</td><td>carePlan, checkIns, messages</td><td>Post-visit recovery collaboration.</td></tr>',
  '<tr><td>Prescription / Report</td><td>medicines, fileUrl</td><td>Clinical output and medical files.</td></tr>',
  '</tbody></table></div>',

  '<h2>7. Demo Access</h2>',
  `<p>Live frontend: <a href="${YASH_HEALTH_DEMO}" target="_blank" rel="noopener noreferrer">${YASH_HEALTH_DEMO}</a></p>`,
  `<p>Source code: <a href="${YASH_HEALTH_GITHUB}" target="_blank" rel="noopener noreferrer">${YASH_HEALTH_GITHUB}</a></p>`,
  '<p>On the login screen, select a role (Super Admin / Hospital Admin / Doctor / Patient), then sign in with the credentials configured for that environment. The UI includes a Test Mode banner for demo usage.</p>',
].join('\n');

const CLIENT_MATRIX_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789835161/sm-global-hub/projects/client-matrix-hero.jpg';

const CLIENT_MATRIX_PDF =
  'https://res.cloudinary.com/luysen3q/raw/upload/v1789835163/sm-global-hub/docs/Client_Matrix_College_Project_Report.pdf';

const CLIENT_MATRIX_GITHUB =
  'https://github.com/smserviceindore-a11y/SmHierankTask/tree/main/Shubham/Client-Matrix-main';

const CLIENT_MATRIX_DEMO = 'https://client-matrix-beryl.vercel.app/';

const CLIENT_MATRIX_DESCRIPTION = [
  '<h1>Client Matrix — Multi-Tenant Social Analytics &amp; Growth SaaS</h1>',
  '<p><em>Full-stack multi-tenant SaaS platform · College / academic demonstration · 2026</em></p>',
  '<p><strong>Scale all your clients &amp; socials with real-time growth analytics.</strong> Client Matrix empowers digital agencies with secure KYC validation, automated Razorpay subscriptions, content-manager task pipelines, and direct social media publishing — so clients can track overall progress of all social accounts in one place.</p>',

  '<h2>1. Project Overview</h2>',
  '<ul>',
  '<li><strong>Clients</strong> see overall progress of all social media accounts in a single portal.</li>',
  '<li><strong>Super Admin</strong> manages approvals, KYC document verification, subscriptions and funds operations.</li>',
  '<li><strong>Admin (Manager)</strong> manages tasks, assigns work to Content Managers, and mediates between clients and creatives.</li>',
  '<li><strong>Content Manager</strong> builds client-ready content using AI-assisted creative tools.</li>',
  '<li><strong>Support</strong> treats complaints and tickets raised by clients individually.</li>',
  '</ul>',
  '<p>The system is built end-to-end as a college project / demo product with role-based dashboards, payments (test/demo), reports and a local database — runnable for viva / presentation.</p>',

  '<h2>2. Problem Statement &amp; Solution</h2>',
  '<p>Digital marketing agencies often struggle with fragmented tools, manual tracking, and weak access control when managing multiple clients’ social channels, subscriptions and creative workflows.</p>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Solution pillar</th><th>What it delivers</th></tr></thead>',
  '<tbody>',
  '<tr><td>Unified Multi-Tenant Dashboard</td><td>Centralizes cross-platform social analytics (Instagram, YouTube, X, Facebook, LinkedIn) for agencies and enterprise clients.</td></tr>',
  '<tr><td>Strict KYC &amp; Access Control</td><td>Keeps client accounts locked until compliance documents are manually verified by Super Admin.</td></tr>',
  '<tr><td>Automated Global Billing</td><td>Razorpay subscription tiers with multi-currency support (INR, USD, EUR, GBP, JPY).</td></tr>',
  '<tr><td>Creative Workflow Pipeline</td><td>Graphic designer workspace with AI 4-grid prompt generation and asset submission workflow.</td></tr>',
  '</tbody></table></div>',

  '<h2>3. Objectives</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Objective</th><th>Status</th></tr></thead>',
  '<tbody>',
  '<tr><td>Public marketplace (browse, detail, contact, customize)</td><td>Done</td></tr>',
  '<tr><td>Multi-role session-based authentication</td><td>Done</td></tr>',
  '<tr><td>Admin / Super Admin operations</td><td>Done</td></tr>',
  '<tr><td>Support and raising tickets</td><td>Done</td></tr>',
  '<tr><td>Client operations</td><td>Done</td></tr>',
  '<tr><td>Seeded demo data for viva / presentation</td><td>Not Done</td></tr>',
  '</tbody></table></div>',

  '<h2>4. Technology Stack</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr></thead>',
  '<tbody>',
  '<tr><td>Frontend</td><td>HTML, Tailwind CSS, JavaScript</td><td>Marketing site, portals and role dashboards.</td></tr>',
  '<tr><td>Backend</td><td>Python (Django)</td><td>API, auth, business workflows.</td></tr>',
  '<tr><td>Database</td><td>SQLite</td><td>Local relational storage for demo / college run.</td></tr>',
  '<tr><td>Auth</td><td>Django session-based auth</td><td>Role-aware sign-in and access control.</td></tr>',
  '<tr><td>Payments</td><td>Razorpay (test) + demo pay path</td><td>Subscription billing for college demo.</td></tr>',
  '<tr><td>Exports</td><td>Excel / PDF tooling</td><td>Reports and document outputs.</td></tr>',
  '</tbody></table></div>',

  '<h2>5. User Roles</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Role</th><th>What they can do</th></tr></thead>',
  '<tbody>',
  '<tr><td>Super Admin</td><td>Full platform control: users, settings, payment reports, audit / ops modules, KYC approvals.</td></tr>',
  '<tr><td>Agency Staff Admin</td><td>Administrative operations within the agency; task mediation.</td></tr>',
  '<tr><td>Client</td><td>KYC-verified custom portal for multi-channel social performance and billing.</td></tr>',
  '<tr><td>Content Manager</td><td>Assigned creative deliverables and AI prompt generation workspace.</td></tr>',
  '</tbody></table></div>',

  '<h2>6. Major Modules / Features</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Module</th><th>Description</th></tr></thead>',
  '<tbody>',
  '<tr><td>Authentication &amp; KYC Registration</td><td>Role-based sign-in plus client registration with compliance uploads (PAN/GST), locked until Super Admin approval.</td></tr>',
  '<tr><td>Super Admin Dashboard</td><td>Review pending tenant KYC, monitor subscriptions, and view revenue metrics.</td></tr>',
  '<tr><td>Client Portal &amp; Analytics</td><td>OAuth-style social connections (Instagram, YouTube, Facebook, X) and cross-platform performance metrics.</td></tr>',
  '<tr><td>Multi-Currency Razorpay Engine</td><td>Silver / Gold / Diamond plans with dynamic currency switching and feature comparison grids.</td></tr>',
  '<tr><td>Designer Workspace &amp; AI Generator</td><td>4-variation AI prompt image generator and creative task tracking pipeline.</td></tr>',
  '<tr><td>Support Helpdesk</td><td>Ticketing for social integrations, billing, or KYC compliance issues.</td></tr>',
  '</tbody></table></div>',

  '<h2>7. Connected Channels &amp; Safety</h2>',
  '<ul>',
  '<li>Integrated platforms: Instagram, Facebook, YouTube, X (Twitter), LinkedIn, Google Business + Razorpay.</li>',
  '<li>Role-based access control across Super Admin, Staff, Clients and Content Manager.</li>',
  '<li>Encrypted OAuth sessions and verified auto-publishing pipelines.</li>',
  '<li>Subscription safety — dashboard access tied to verified payment status.</li>',
  '</ul>',

  '<h2>8. Team Contribution (from project report)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Name</th><th>Role</th><th>Contribution</th></tr></thead>',
  '<tbody>',
  '<tr><td>Shubham Gupta</td><td>Lead + Frontend</td><td>Frontend dashboards, payments / invoices, documentation, project planning.</td></tr>',
  '<tr><td>Yash Srivastava</td><td>Frontend &amp; Support</td><td>Admin-Manager dashboard and support flows.</td></tr>',
  '<tr><td>Ayush Kumar</td><td>Backend</td><td>Backend API + database / seed work.</td></tr>',
  '</tbody></table></div>',

  '<h2>9. Demo Access</h2>',
  `<p>Live demo: <a href="${CLIENT_MATRIX_DEMO}" target="_blank" rel="noopener noreferrer">${CLIENT_MATRIX_DEMO}</a></p>`,
  `<p>GitHub: <a href="${CLIENT_MATRIX_GITHUB}" target="_blank" rel="noopener noreferrer">${CLIENT_MATRIX_GITHUB}</a></p>`,
  `<p>Project report PDF: <a href="${CLIENT_MATRIX_PDF}" target="_blank" rel="noopener noreferrer">${CLIENT_MATRIX_PDF}</a></p>`,
  '<p>Use <strong>Portal Login</strong> and select a role (Super Admin, Agency Staff Admin, Client, Content Manager) with the demo credentials configured for that environment.</p>',
].join('\n');

const AB_SCHOOL_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789835808/sm-global-hub/projects/ab-school-portal-login.jpg';

const AB_SCHOOL_GITHUB =
  'https://github.com/smserviceindore-a11y/SmHierankTask/tree/main/Shubham/AB-School-Portal-main';

const AB_SCHOOL_DEMO = 'https://abschoolportal.vercel.app/login';

const AB_SCHOOL_DESCRIPTION = [
  '<h1>AB Public School — Institutional ERP Portal</h1>',
  '<p><em>Empowering Minds • Shaping Future · School Management System</em></p>',
  '<p>AB Public School Portal is a full-stack institutional ERP that brings admissions, academics, fees, exams, library, payroll, parent communication and AI tutoring into one secure dark-themed portal. Staff and families sign in with role-based access and land on dedicated dashboards for Super Admin, Principal / School Admin, Teacher, Student and Parent.</p>',

  '<h2>1. Executive Overview</h2>',
  '<p>Built with a React + Vite frontend and a Node.js / Express / MongoDB API, the portal covers day-to-day school operations — from online admission applications to attendance, homework, marks, fee collection, library books, leave workflows and AI-assisted learning widgets.</p>',

  '<h2>2. Technology Stack</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr></thead>',
  '<tbody>',
  '<tr><td>Frontend</td><td>React 19, Vite, Tailwind CSS, Lucide</td><td>Login, role dashboards, admissions UI.</td></tr>',
  '<tr><td>Routing / HTTP</td><td>React Router, Axios</td><td>Client navigation and API calls.</td></tr>',
  '<tr><td>PDF exports</td><td>jsPDF + autotable</td><td>Reports and printable tables.</td></tr>',
  '<tr><td>Backend</td><td>Node.js, Express</td><td>REST API for school modules.</td></tr>',
  '<tr><td>Database</td><td>MongoDB + Mongoose</td><td>Users, students, fees, marks, library, payroll.</td></tr>',
  '<tr><td>Auth</td><td>JWT + bcrypt</td><td>Secure sign-in with multi-role accounts.</td></tr>',
  '<tr><td>Hosting</td><td>Vercel (frontend) + API routes</td><td>Deployed institutional portal.</td></tr>',
  '</tbody></table></div>',

  '<h2>3. User Roles</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Role</th><th>Dashboard / access</th></tr></thead>',
  '<tbody>',
  '<tr><td>SUPER_ADMIN</td><td>Full institutional control via Admin Dashboard.</td></tr>',
  '<tr><td>SCHOOL_ADMIN / PRINCIPAL</td><td>Principal Dashboard for school-level operations.</td></tr>',
  '<tr><td>TEACHER</td><td>Teacher Dashboard — classes, attendance, homework, exams.</td></tr>',
  '<tr><td>STUDENT</td><td>Student Dashboard — academics, notices, AI tutor widgets.</td></tr>',
  '<tr><td>PARENT</td><td>Parent Dashboard — fees, progress, teacher queries.</td></tr>',
  '<tr><td>ACCOUNTANT / TRANSPORT_MANAGER</td><td>Supported in user model for finance and transport ops.</td></tr>',
  '</tbody></table></div>',

  '<h2>4. Core Modules</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Module</th><th>API / UI</th><th>What it covers</th></tr></thead>',
  '<tbody>',
  '<tr><td>Authentication</td><td><code>/api/auth</code> · Login</td><td>Email/password sign-in with role-based redirect.</td></tr>',
  '<tr><td>Admissions</td><td><code>/api/admissions</code> · Apply Online</td><td>New student admission applications from the login screen.</td></tr>',
  '<tr><td>Fees</td><td><code>/api/fees</code></td><td>Fee structures, collection and parent fee views.</td></tr>',
  '<tr><td>Academics</td><td><code>/api/academic</code></td><td>Classes, timetable, homework, attendance, notices.</td></tr>',
  '<tr><td>Teachers</td><td><code>/api/teacher</code></td><td>Teacher profiles, assigned classes and classroom ops.</td></tr>',
  '<tr><td>Exams &amp; Marks</td><td><code>/api/exams</code></td><td>Exam cycles and mark entry / reporting.</td></tr>',
  '<tr><td>Parents</td><td><code>/api/parent</code></td><td>Parent portal, queries and student linkage.</td></tr>',
  '<tr><td>Library</td><td><code>/api/library</code></td><td>Book catalog and issue / return flows.</td></tr>',
  '<tr><td>AI Tutor</td><td><code>/api/ai-tutor</code></td><td>AI tutor and quiz bot widgets for students.</td></tr>',
  '</tbody></table></div>',

  '<h2>5. Key Product Features</h2>',
  '<ul>',
  '<li>Dark institutional ERP login with school branding (gold + blue).</li>',
  '<li>Online admission entry point: <em>New Student Admission? Apply Online</em>.</li>',
  '<li>Role-specific dashboards for admin, principal, teacher, student and parent.</li>',
  '<li>Academic toolkit: timetable, attendance, homework, leave and notices.</li>',
  '<li>Fee management and payroll / salary seed workflows for staff.</li>',
  '<li>Library management and exam / marks pipelines.</li>',
  '<li>AI Tutor and AI Quiz Bot widgets for learning support.</li>',
  '<li>Analytics charts for operational insights.</li>',
  '<li>Parent–teacher query box for communication.</li>',
  '</ul>',

  '<h2>6. Data Model Highlights</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Model</th><th>Notes</th></tr></thead>',
  '<tbody>',
  '<tr><td>User</td><td>Multi-role accounts (SUPER_ADMIN → PARENT / ACCOUNTANT / TRANSPORT_MANAGER).</td></tr>',
  '<tr><td>Student</td><td>Student profiles linked to academic and parent flows.</td></tr>',
  '<tr><td>Fee / Payroll</td><td>Fee records and staff salary data.</td></tr>',
  '<tr><td>Attendance / Homework / Leave / Notice</td><td>Daily academic operations.</td></tr>',
  '<tr><td>Mark</td><td>Examination scores.</td></tr>',
  '<tr><td>Library</td><td>Library inventory and circulation.</td></tr>',
  '</tbody></table></div>',

  '<h2>7. Demo Access</h2>',
  `<p>Live portal: <a href="${AB_SCHOOL_DEMO}" target="_blank" rel="noopener noreferrer">${AB_SCHOOL_DEMO}</a></p>`,
  `<p>GitHub: <a href="${AB_SCHOOL_GITHUB}" target="_blank" rel="noopener noreferrer">${AB_SCHOOL_GITHUB}</a></p>`,
  '<p><strong>Seeded admin (from project seed script):</strong> Email <code>admin@school.com</code> · Password <code>admin12345</code> (SUPER_ADMIN). Other roles can be seeded via the project’s teacher / parent / fee seed scripts.</p>',
].join('\n');

const SMARTJOBS_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789837160/sm-global-hub/projects/smartjobs-login.jpg';

const SMARTJOBS_GITHUB =
  'https://github.com/smserviceindore-a11y/SmHierankTask/tree/main/Ayush/smartjob';

const SMARTJOBS_DEMO = 'https://ayushsingh18.pythonanywhere.com/login/?next=/';

const SMARTJOBS_DESCRIPTION = [
  '<h1>SmartJobs — Professional Career Network</h1>',
  '<p><em>Django job marketplace for job seekers &amp; employers · AI-assisted hiring toolkit</em></p>',
  '<p>SmartJobs is a full-stack career platform where job seekers build profiles, apply to roles and use AI resume/cover-letter tools, while employers post jobs, manage applications, purchase subscription plans via Razorpay, and generate AI job descriptions. Admins get CMS, ads, analytics, messaging, notifications and support modules in one Django product hosted on PythonAnywhere.</p>',

  '<h2>1. Executive Overview</h2>',
  '<p>Built on <strong>Django 5.2</strong> with SQLite, custom user roles, SEO-ready job/blog CMS, Gemini-powered AI helpers, and Razorpay billing — SmartJobs is designed as a professional career network with separate experiences for job seekers, employers and platform admins.</p>',

  '<h2>2. Technology Stack</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr></thead>',
  '<tbody>',
  '<tr><td>Backend framework</td><td>Django 5.2</td><td>Apps, auth, admin, templates and URL routing.</td></tr>',
  '<tr><td>Database</td><td>SQLite</td><td>Local / hosted relational storage.</td></tr>',
  '<tr><td>Auth</td><td>Custom <code>accounts.User</code> (AbstractUser)</td><td>Roles: job_seeker, employer, admin + email OTP fields.</td></tr>',
  '<tr><td>Payments</td><td>Razorpay</td><td>Subscription plans, orders and payment history.</td></tr>',
  '<tr><td>AI</td><td>Gemini API (via <code>ai_services</code>)</td><td>Resume analysis, cover letters, JD generation.</td></tr>',
  '<tr><td>Docs parsing</td><td>pypdf, python-docx</td><td>Extract resume text from PDF/DOCX uploads.</td></tr>',
  '<tr><td>SEO</td><td>Django sitemaps + robots.txt</td><td>Jobs, blogs and static pages indexing.</td></tr>',
  '<tr><td>Hosting</td><td>PythonAnywhere</td><td>Public demo at ayushsingh18.pythonanywhere.com.</td></tr>',
  '</tbody></table></div>',

  '<h2>3. User Roles</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Role</th><th>Capabilities</th></tr></thead>',
  '<tbody>',
  '<tr><td>Job Seeker</td><td>Register/login, profile, skills, education, experience, AI resume tools, applications.</td></tr>',
  '<tr><td>Employer</td><td>Company hiring workflows, job posts, AI JD generator, subscriptions and resume downloads.</td></tr>',
  '<tr><td>Admin</td><td>Platform CMS, ads, analytics, billing oversight, support and Django admin.</td></tr>',
  '</tbody></table></div>',

  '<h2>4. Major Modules (Django Apps)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>App</th><th>URL prefix</th><th>What it does</th></tr></thead>',
  '<tbody>',
  '<tr><td><code>accounts</code></td><td><code>/</code> (auth + dashboards)</td><td>Sign in/register, profiles, role dashboards, OTP verification fields.</td></tr>',
  '<tr><td><code>cms</code></td><td><code>/cms/</code></td><td>Jobs + blog posts with SEO meta, OG tags and sitemaps.</td></tr>',
  '<tr><td><code>billing</code></td><td><code>/billing/</code></td><td>Subscription plans, usage limits, Razorpay gateways, payment history.</td></tr>',
  '<tr><td><code>ai_jobseeker</code></td><td><code>/ai/jobseeker/</code></td><td>Resume analysis and AI cover-letter generation.</td></tr>',
  '<tr><td><code>ai_employer</code></td><td><code>/ai/employer/</code></td><td>AI job-description generation from title/skills/experience.</td></tr>',
  '<tr><td><code>messaging</code></td><td><code>/messages/</code></td><td>In-platform messaging between users.</td></tr>',
  '<tr><td><code>notifications</code></td><td><code>/notifications/</code></td><td>User notification centre.</td></tr>',
  '<tr><td><code>support</code></td><td><code>/support/</code></td><td>Helpdesk / support tickets.</td></tr>',
  '<tr><td><code>ads</code></td><td><code>/ads/</code></td><td>Banner / promotional ad placements.</td></tr>',
  '<tr><td><code>analytics</code></td><td><code>/analytics/</code></td><td>Platform usage and performance insights.</td></tr>',
  '<tr><td><code>integrations</code></td><td><code>/api/v1/integrations/</code></td><td>External integration endpoints.</td></tr>',
  '</tbody></table></div>',

  '<h2>5. Billing &amp; Subscriptions</h2>',
  '<ul>',
  '<li>Tiered <strong>SubscriptionPlan</strong> with price, job-post limits and resume-download limits (0 = unlimited).</li>',
  '<li>Feature flags: featured jobs, company branding, priority support.</li>',
  '<li><strong>SubscriptionUsage</strong> tracks jobs posted and resumes downloaded.</li>',
  '<li><strong>PaymentHistory</strong> stores Razorpay order / payment / signature for each checkout.</li>',
  '</ul>',

  '<h2>6. AI Features</h2>',
  '<ul>',
  '<li><strong>Job seeker:</strong> upload PDF/DOCX resume (or paste text), analyze against a job description, generate cover letters.</li>',
  '<li><strong>Employer:</strong> generate professional job descriptions from title, skills and experience level using Gemini models.</li>',
  '<li>Shared <code>ai_services</code> client abstracts AI provider calls for both sides.</li>',
  '</ul>',

  '<h2>7. Demo Access</h2>',
  `<p>Live login: <a href="${SMARTJOBS_DEMO}" target="_blank" rel="noopener noreferrer">${SMARTJOBS_DEMO}</a></p>`,
  `<p>GitHub: <a href="${SMARTJOBS_GITHUB}" target="_blank" rel="noopener noreferrer">${SMARTJOBS_GITHUB}</a></p>`,
  '<p>Create a Job Seeker or Employer account via <strong>Register</strong>, or sign in with existing demo credentials if configured on the PythonAnywhere deployment.</p>',
].join('\n');

const SM_HUB_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789837938/sm-global-hub/projects/sm-global-hub-home.jpg';

const SM_HUB_PDF =
  'https://res.cloudinary.com/luysen3q/raw/upload/v1789867208/sm-global-hub/docs/SM_Global_Hub_College_Project_Report_viva.pdf';

const SM_HUB_GITHUB =
  'https://github.com/smserviceindore-a11y/SmHierankTask/tree/main/Sagar/SM%20Digital';

const SM_HUB_DEMO = 'https://smpanel.sagartiwari.net/';

const SM_HUB_DESCRIPTION = [
  '<h1>SM Global Solution Hub — College Project Report</h1>',
  '<p><em>Project type: Full-stack digital marketplace (college / academic demonstration)</em></p>',
  '<p><strong>Working application:</strong> React frontend (<code>preview/</code>) + Node.js/Express API (<code>backend/</code>) + MongoDB</p>',
  '<p><strong>Local demo:</strong> Frontend <code>http://localhost:5173</code> · API <code>http://localhost:5001</code></p>',
  `<p><strong>Live demo:</strong> <a href="${SM_HUB_DEMO}" target="_blank" rel="noopener noreferrer">${SM_HUB_DEMO}</a></p>`,

  '<h2>1. Project Overview</h2>',
  '<p>SM Global Solution Hub is a web platform where:</p>',
  '<ul>',
  '<li>Buyers discover ready-made digital projects / products</li>',
  '<li>Developers list and sell projects on the marketplace</li>',
  '<li>Clients can request custom work or buy existing products</li>',
  '<li>Admins manage approvals, leads, quotations, payments, settlements, and reports</li>',
  '<li>Support / ops staff handle live chat, contact messages, and follow-up reminders</li>',
  '</ul>',
  '<p>The system is built end-to-end as a college project / demo product (not a production commercial launch). Core marketplace, role-based dashboards, payments (test/demo), reports, and live chat are implemented and runnable locally.</p>',

  '<h2>2. Problem Statement</h2>',
  '<p>Small agencies and freelancers often sell digital projects through scattered WhatsApp chats, static websites, and manual Excel tracking. There is no single place for:</p>',
  '<ul>',
  '<li>Project catalogue + live demos</li>',
  '<li>Role-based staff and seller panels</li>',
  '<li>Lead capture and CRM-style follow-ups</li>',
  '<li>Quotations → payment → invoice → developer wallet / payout</li>',
  '</ul>',
  '<p>This project demonstrates a unified hub that covers discovery, sales ops, and support in one application.</p>',

  '<h2>3. Objectives</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Objective</th><th>Status</th></tr></thead>',
  '<tbody>',
  '<tr><td>Public marketplace (browse, detail, contact, customize)</td><td>Done</td></tr>',
  '<tr><td>Multi-role authentication (JWT)</td><td>Done</td></tr>',
  '<tr><td>Admin / Super Admin operations</td><td>Done</td></tr>',
  '<tr><td>Developer listing + wallet / payouts</td><td>Done</td></tr>',
  '<tr><td>Client buy / quotations / invoices</td><td>Done</td></tr>',
  '<tr><td>Contact inbox + live chat support</td><td>Done</td></tr>',
  '<tr><td>CRM follow-ups &amp; reminders</td><td>Done</td></tr>',
  '<tr><td>Reports, charts, Excel / PDF exports</td><td>Done</td></tr>',
  '<tr><td>Seeded demo data for viva / presentation</td><td>Done</td></tr>',
  '</tbody></table></div>',

  '<h2>4. Tech Stack</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Layer</th><th>Technology</th></tr></thead>',
  '<tbody>',
  '<tr><td>Frontend</td><td>React, Vite, Tailwind CSS, React Router, TanStack Query, Zustand</td></tr>',
  '<tr><td>Backend</td><td>Node.js, Express.js</td></tr>',
  '<tr><td>Database</td><td>MongoDB Atlas + Mongoose</td></tr>',
  '<tr><td>Auth</td><td>JWT with roles</td></tr>',
  '<tr><td>Payments</td><td>Razorpay (test) + demo pay path for college demo</td></tr>',
  '<tr><td>Media</td><td>Cloudinary (configurable in Super Admin settings)</td></tr>',
  '<tr><td>Exports</td><td>ExcelJS, PDFKit</td></tr>',
  '</tbody></table></div>',

  '<h2>5. User Roles in the System</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Role</th><th>What they can do</th></tr></thead>',
  '<tbody>',
  '<tr><td>Super Admin</td><td>Full platform control: users, settings (Razorpay/Cloudinary/GST), payment reports, audit log, all ops modules</td></tr>',
  '<tr><td>Admin</td><td>Day-to-day ops: projects, approvals, leads, quotations, invoices, settlements, coupons, reports, live chat, follow-ups</td></tr>',
  '<tr><td>Support Agent</td><td>Live chat inbox, leads/requirements, contact inbox, clients/developers directory, follow-ups</td></tr>',
  '<tr><td>Developer</td><td>Submit projects, manage requests, wallet &amp; payouts, coupons</td></tr>',
  '<tr><td>Client / Buyer</td><td>Requirements, customizations, quotations &amp; pay, invoices; help via Live Chat on the site</td></tr>',
  '</tbody></table></div>',

  '<h2>6. Major Modules / Features</h2>',
  '<h2>6.1 Public Website</h2>',
  '<ul>',
  '<li>Home / branding pages</li>',
  '<li>Projects gallery + project detail (including demo links where seeded)</li>',
  '<li>Developer marketplace / storefront</li>',
  '<li>Submit requirement &amp; customize project flows</li>',
  '<li>Contact form → Contact Inbox for staff</li>',
  '<li>Floating Live Chat widget (guest must share name, email, phone before chat)</li>',
  '</ul>',
  '<h2>6.2 Authentication &amp; Users</h2>',
  '<ul>',
  '<li>Login / register flows for demo</li>',
  '<li>Role-protected dashboards</li>',
  '<li>Staff can create users (as per role rules)</li>',
  '<li>Users / Clients / Developers directories with detail profiles</li>',
  '</ul>',
  '<h2>6.3 Marketplace &amp; Catalogue</h2>',
  '<ul>',
  '<li>Categories &amp; project CRUD (admin / developer submission)</li>',
  '<li>Approval workflow for listings</li>',
  '<li>Curation / reviews (admin modules)</li>',
  '</ul>',
  '<h2>6.4 Sales &amp; Money Flow</h2>',
  '<ul>',
  '<li>Quotations (create, send, PDF)</li>',
  '<li>Client payment (Razorpay test / demo)</li>',
  '<li>Invoices (PDF)</li>',
  '<li>Settlements &amp; developer wallet (hold → available → payout request)</li>',
  '<li>Admin approve / mark payout paid</li>',
  '<li>Coupons</li>',
  '<li>Super Admin payment reports</li>',
  '</ul>',
  '<h2>6.5 Leads &amp; CRM-style Ops</h2>',
  '<ul>',
  '<li>Leads / Requirements list (from requirement &amp; customization forms)</li>',
  '<li>Contact Inbox — one-time contact form messages</li>',
  '<li>Follow-ups — staff-logged call/email/chat notes + next reminder (from client/developer profile)</li>',
  '<li>Live Chat — real-time visitor ↔ team conversation with limited auto-replies; staff can take over</li>',
  '</ul>',
  '<h2>6.6 Reports &amp; Analytics</h2>',
  '<ul>',
  '<li>Ops reports with filters, pagination, Excel export</li>',
  '<li>Master / platform reports with charts and multi-sheet Excel</li>',
  '<li>Dashboard KPIs for roles</li>',
  '</ul>',
  '<h2>6.7 Demo / College Presentation Support</h2>',
  '<ul>',
  '<li>Seed scripts (<code>npm run seed</code>, <code>npm run seed:money</code>)</li>',
  '<li>Demo credentials (see <code>CREDENTIALS.md</code>)</li>',
  '<li>Walkthrough docs under <code>docs/</code></li>',
  '</ul>',

  '<h2>7. System Architecture (Simple)</h2>',
  '<p>Browser (React · <code>preview/</code>) → REST / JWT → Express API (<code>backend/</code> · port 5001) → MongoDB Atlas + Razorpay (test) · Cloudinary · Excel/PDF generation.</p>',

  '<h2>8. Project Structure</h2>',
  '<ul>',
  '<li><code>Smm Digital/backend/</code> — Express API, models, controllers, seeds</li>',
  '<li><code>preview/</code> — Live React UI used for demo</li>',
  '<li><code>docs/</code> — API, demo walkthrough, checklists, this report</li>',
  '<li><code>CREDENTIALS.md</code> — Demo logins (college only)</li>',
  '<li><code>PROJECT_PLAN.md</code>, <code>FRONTEND_PLAN.md</code>, <code>TRACKER.md</code>, <code>README.md</code></li>',
  '</ul>',
  '<p>The production UI for presentation is <code>preview/</code>. Early teammate HTML / incomplete frontend drafts were not used as the final product.</p>',

  '<h2>9. How to Run (for Viva / Lab)</h2>',
  '<ul>',
  '<li><strong>Terminal 1 — API:</strong> <code>cd backend && npm install && npm run seed && npm run dev</code> → <code>http://localhost:5001</code></li>',
  '<li><strong>Terminal 2 — UI:</strong> <code>cd preview && npm install && npm run dev</code> → <code>http://localhost:5173</code></li>',
  '<li>Demo accounts: see <code>CREDENTIALS.md</code></li>',
  '<li>Suggested 2-minute money demo: <code>docs/DEMO_WALKTHROUGH.md</code></li>',
  '</ul>',

  '<h2>10. Team Contribution &amp; Work Division</h2>',
  '<p>This section is included for college evaluation honesty: who contributed what, and what was actually shipped in the final project.</p>',
  '<h2>10.1 Team Members</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Name</th><th>Claimed / intended role</th><th>Actual contribution to final project</th></tr></thead>',
  '<tbody>',
  '<tr><td>Sagar Tiwari</td><td>Lead + full-stack</td><td>~99–100% of the working project</td></tr>',
  '<tr><td>Ambikeshwar</td><td>Frontend (early)</td><td>Very basic HTML-only page(s); not usable as product UI</td></tr>',
  '<tr><td>Aadrika</td><td>Frontend</td><td>Partial frontend draft; improvement requested but not delivered</td></tr>',
  '</tbody></table></div>',
  '<h2>10.2 Sagar Tiwari — Primary Author (≈ 99–100%)</h2>',
  '<p>Almost the entire final system was designed, implemented, integrated, tested, and documented by Sagar, including:</p>',
  '<ul>',
  '<li>Backend architecture (Express, MongoDB models, APIs, auth, roles, middleware)</li>',
  '<li>Complete working frontend in <code>preview/</code> (React + Vite + Tailwind + dashboards)</li>',
  '<li>Marketplace, admin / super-admin / support / developer / client panels</li>',
  '<li>Payments, invoices, wallet, payouts, coupons, settings</li>',
  '<li>Contact inbox, live chat (guest capture + staff inbox + auto-reply rules)</li>',
  '<li>Follow-ups / reminders CRM notes</li>',
  '<li>Reports, charts, Excel &amp; PDF exports</li>',
  '<li>Seed data, credentials, walkthrough docs, and demo readiness for college</li>',
  '</ul>',
  '<p>Without this work, the project would not run as a coherent full-stack product.</p>',
  '<h2>10.3 Ambikeshwar — Early HTML Attempt (Not Used)</h2>',
  '<ul>',
  '<li>Shared a very basic HTML-based frontend</li>',
  '<li>Quality was below even a basic usable UI (static / incomplete; not aligned with the real product)</li>',
  '<li>Not suitable for the marketplace, role dashboards, or API integration</li>',
  '<li>Not part of the final delivered application (<code>preview/</code> was built instead)</li>',
  '</ul>',
  '<h2>10.4 Aadrika — Frontend Draft (Incomplete / Not Improved)</h2>',
  '<ul>',
  '<li>Provided a frontend that was somewhat better than the basic HTML attempt</li>',
  '<li>Was asked to improve and complete the frontend to product / demo standard</li>',
  '<li>Did not deliver the requested improvements</li>',
  '<li>Final UI is the independently completed React app under <code>preview/</code>, not that unfinished draft</li>',
  '</ul>',
  '<h2>10.5 Summary Table (for Evaluators)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Area</th><th>Who delivered the final working version</th></tr></thead>',
  '<tbody>',
  '<tr><td>Project idea / planning docs</td><td>Sagar (primary)</td></tr>',
  '<tr><td>Backend API + database</td><td>Sagar</td></tr>',
  '<tr><td>Final React UI (<code>preview/</code>)</td><td>Sagar</td></tr>',
  '<tr><td>Role dashboards &amp; ops features</td><td>Sagar</td></tr>',
  '<tr><td>Payments / invoices / wallet</td><td>Sagar</td></tr>',
  '<tr><td>Live chat + contact + follow-ups</td><td>Sagar</td></tr>',
  '<tr><td>Reports / Excel / PDF</td><td>Sagar</td></tr>',
  '<tr><td>Demo seed + documentation</td><td>Sagar</td></tr>',
  '<tr><td>Early basic HTML pages</td><td>Ambikeshwar (discarded)</td></tr>',
  '<tr><td>Early incomplete frontend draft</td><td>Aadrika (not improved; not final)</td></tr>',
  '</tbody></table></div>',
  '<p>Overall estimate: Sagar ≈ 99–100% of the working college project. Teammate inputs were early / incomplete frontend attempts that were not the basis of the submitted demo.</p>',

  '<h2>11. What Was Intentionally Kept Simple (College Scope)</h2>',
  '<ul>',
  '<li>Treated as college / demo project (not full commercial launch)</li>',
  '<li>Live Razorpay production, full KYC, legal pages, and production deploy are out of scope for this submission (see <code>docs/LAUNCH_CHECKLIST.md</code> if asked)</li>',
  '<li>Ticket-style “Support” module was dropped in favour of Live Chat for a clearer demo</li>',
  '</ul>',

  '<h2>12. Learning Outcomes</h2>',
  '<ul>',
  '<li>Full-stack product thinking (roles, marketplace, money flow)</li>',
  '<li>REST API design with JWT and role middleware</li>',
  '<li>React SPA structure with protected routes and dashboard UX</li>',
  '<li>MongoDB modelling for catalogue, CRM, chat, and finance</li>',
  '<li>Reporting / export (Excel, PDF) and operational UI (inbox, follow-ups, live chat)</li>',
  '<li>Honest team contribution documentation for academic evaluation</li>',
  '</ul>',

  '<h2>13. Conclusion</h2>',
  '<p>SM Global Solution Hub is a working full-stack marketplace demo suitable for college presentation: public catalogue, multi-role panels, sales ops, live chat, and reports.</p>',
  '<p>The final runnable product was built almost entirely by Sagar Tiwari. Teammates Ambikeshwar and Aadrika provided early frontend material that was either too basic or left unfinished after improvement was requested; that material is not the submitted UI.</p>',
  '<p><em>Document prepared for college viva / project file · SM Global Solution Hub · 2026</em></p>',

  '<h2>Demo Access</h2>',
  `<p>Live site: <a href="${SM_HUB_DEMO}" target="_blank" rel="noopener noreferrer">${SM_HUB_DEMO}</a></p>`,
  `<p>GitHub: <a href="${SM_HUB_GITHUB}" target="_blank" rel="noopener noreferrer">${SM_HUB_GITHUB}</a></p>`,
  `<p>College project report PDF: <a href="${SM_HUB_PDF}" target="_blank" rel="noopener noreferrer">${SM_HUB_PDF}</a></p>`,
].join('\n');

const SMM_PORTAL_SCREENSHOT =
  'https://res.cloudinary.com/luysen3q/image/upload/v1789870954/sm-global-hub/projects/smm-portal-home.png';

const SMM_PORTAL_PDF =
  'https://res.cloudinary.com/luysen3q/raw/upload/v1789871022/sm-global-hub/docs/SMM_Portal_Project_Overview.pdf';

const SMM_PORTAL_DEMO = 'https://smservice.co.in/';

const SMM_PORTAL_DESCRIPTION = [
  '<h1>SMM Portal — Internship &amp; Training Management System</h1>',
  '<p><em>Project Overview · Features · Users · Permissions · Document date: 20 Sep 2026</em></p>',
  `<p><strong>Live:</strong> <a href="${SMM_PORTAL_DEMO}" target="_blank" rel="noopener noreferrer">${SMM_PORTAL_DEMO}</a></p>`,
  '<p>Yeh document batata hai ki portal mein kya ho raha hai, kaun‑kaun se features hain, kitne type ke users hain, aur har role ke paas kis tarah ki permissions hain.</p>',

  '<h2>1. Project Kya Hai?</h2>',
  '<p>SMM Portal (SM Service) ek web-based internship / training management system hai. Isme colleges se interns register hote hain, training groups mein assign hote hain, daily attendance lagti hai, tasks assign / submit / review hote hain, aur Admin–HR–Trainer performance analytics dekh sakte hain.</p>',
  '<p><strong>Tech stack:</strong> React + Vite (frontend), Express + Prisma (backend), MySQL (database).</p>',
  '<h2>1.1 Main Goals</h2>',
  '<ul>',
  '<li>College-wise intern registration (invite link + Excel upload + Admin/HR approval)</li>',
  '<li>Training groups banana, trainer assign karna, members add karna</li>',
  '<li>Daily attendance (Present / Absent / Leave / Week off)</li>',
  '<li>Task library + group / individual assign + intern submit + staff review</li>',
  '<li>Score / attendance / task completion analytics with drill-down</li>',
  '<li>Internship COMPLETED vs HIRED — alag-alag status</li>',
  '</ul>',

  '<h2>2. User Types (5 Roles)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Role</th><th>Kaun hai?</th><th>Portal path</th></tr></thead>',
  '<tbody>',
  '<tr><td>ADMIN</td><td>Full system owner / master admin</td><td><code>/admin/…</code></td></tr>',
  '<tr><td>HR</td><td>HR operations — almost Admin jaisa</td><td><code>/hr/…</code></td></tr>',
  '<tr><td>TRAINER</td><td>Apne groups ke training in-charge</td><td><code>/trainer/…</code></td></tr>',
  '<tr><td>COLLEGE</td><td>College login — apne students</td><td><code>/college/…</code></td></tr>',
  '<tr><td>INTERN</td><td>Student / trainee</td><td><code>/intern/…</code></td></tr>',
  '</tbody></table></div>',

  '<h2>3. Permissions Matrix</h2>',
  '<p>Yes = allowed · Scope = sirf apna data · No = allowed nahi</p>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Feature / Module</th><th>Admin</th><th>HR</th><th>Trainer</th><th>College</th><th>Intern</th></tr></thead>',
  '<tbody>',
  '<tr><td>Dashboard</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>',
  '<tr><td>Users create / manage</td><td>Yes</td><td>Yes*</td><td>No</td><td>No</td><td>No</td></tr>',
  '<tr><td>Colleges add / edit / delete</td><td>Yes</td><td>Yes</td><td>View≈</td><td>Own view</td><td>No</td></tr>',
  '<tr><td>Registrations / invites</td><td>Yes</td><td>Yes</td><td>No</td><td>Submit≈</td><td>No</td></tr>',
  '<tr><td>Approve / reject interns</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr>',
  '<tr><td>Direct hire intern</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr>',
  '<tr><td>Groups create / edit</td><td>Yes</td><td>Yes</td><td>Own≈</td><td>View≈</td><td>Own view</td></tr>',
  '<tr><td>Mark group complete</td><td>Yes</td><td>Yes</td><td>Own≈</td><td>No</td><td>No</td></tr>',
  '<tr><td>Tasks assign &amp; review</td><td>Yes</td><td>Yes</td><td>Own≈</td><td>View≈</td><td>Submit own</td></tr>',
  '<tr><td>Task library manage</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>',
  '<tr><td>Attendance mark</td><td>Yes</td><td>Yes</td><td>Own≈</td><td>View≈</td><td>Own view</td></tr>',
  '<tr><td>Analytics / reports</td><td>Yes</td><td>Yes</td><td>Own≈</td><td>Own≈</td><td>Own perf</td></tr>',
  '<tr><td>Intern complete status</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>',
  '<tr><td>Mark as Hired</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td></tr>',
  '<tr><td>Profile change approve</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Request</td><td>No</td></tr>',
  '<tr><td>Export Excel</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>',
  '</tbody></table></div>',
  '<p>* HR: trainer / intern / college / HR accounts. Admin: Admins bhi manage kar sakta hai.<br/>≈ Trainer / College sirf apne scope (apne groups / apna college) ka data dekh/edit karte hain.</p>',

  '<h2>4. Role-wise Detail</h2>',
  '<h2>4.1 ADMIN</h2>',
  '<ul>',
  '<li>Sab modules: Users, Colleges, Registrations, Groups, Tasks, Attendance, Analytics, Profile changes</li>',
  '<li>Koi bhi user create / edit / delete (including other Admins)</li>',
  '<li>College invite links, pending registrations approve/reject, direct-hire</li>',
  '<li>Group complete / intern complete / hired — full control</li>',
  '</ul>',
  '<h2>4.2 HR</h2>',
  '<ul>',
  '<li>Admin jaisa operational control (day-to-day running)</li>',
  '<li>Users, Colleges, Registrations, Groups, Tasks, Attendance, Analytics</li>',
  '<li>Internship complete + hired actions</li>',
  '</ul>',
  '<h2>4.3 TRAINER</h2>',
  '<ul>',
  '<li>Sirf apne assigned training groups</li>',
  '<li>Members add, tasks assign (group ya individual), submissions review</li>',
  '<li>Apne group ki attendance mark (completed interns list se auto-hide)</li>',
  '<li>Analytics apne scope mein</li>',
  '<li>Users / Colleges create / Registrations approve — nahi</li>',
  '</ul>',
  '<h2>4.4 COLLEGE</h2>',
  '<ul>',
  '<li>Apne college ke interns / groups / tasks / attendance / analytics (mostly view)</li>',
  '<li>Invite link se Excel/list submit → Admin/HR approval wait</li>',
  '<li>Student profile change request bhej sakta hai (approval chahiye)</li>',
  '<li>Attendance mark / task assign / group complete — nahi</li>',
  '</ul>',
  '<h2>4.5 INTERN</h2>',
  '<ul>',
  '<li>Apna dashboard, performance, tasks, attendance history, profile</li>',
  '<li>Assigned tasks submit (max 2 submits per review cycle; Needs improvement ke baad dubara)</li>',
  '<li>Dusre students / groups manage — nahi</li>',
  '<li>Pending approval accounts login block; Rejected accounts login nahi</li>',
  '</ul>',

  '<h2>5. Feature Modules</h2>',
  '<h2>5.1 Registrations</h2>',
  '<ul>',
  '<li>Admin/HR college-bound invite link banate hain (one-time use)</li>',
  '<li>College Excel/template se students submit karta hai</li>',
  '<li>Pending → Approve / Reject</li>',
  '<li>Direct hire: Admin/HR seedha intern account bana sakte hain</li>',
  '</ul>',
  '<h2>5.2 Colleges</h2>',
  '<ul>',
  '<li>College master list (name, code)</li>',
  '<li>College name click → analytics drill-down (Overview/charts, Students, Groups, Recent work)</li>',
  '</ul>',
  '<h2>5.3 Groups (Training Groups)</h2>',
  '<ul>',
  '<li>Unique group name, batch label, trainer(s), members</li>',
  '<li>Multi-group membership supported</li>',
  '<li>New member join → existing group tasks auto-sync (completed interns skip)</li>',
  '<li>Mark group complete → saare active members COMPLETED (Hired nahi — alag action)</li>',
  '</ul>',
  '<h2>5.4 Tasks</h2>',
  '<ul>',
  '<li>Library templates + Assign &amp; Library + Manage assignments</li>',
  '<li>Assign to whole group OR selected individuals (searchable picker)</li>',
  '<li>Statuses: Assigned → Submitted → Needs improvement / Done</li>',
  '<li>Intern search suggestions (name, email, group, Active/Completed)</li>',
  '<li>Excel export with filters</li>',
  '</ul>',
  '<h2>5.5 Attendance</h2>',
  '<ul>',
  '<li>Date + group select → Present / Absent / Leave / Week off</li>',
  '<li>Completed interns attendance list se hide; unke wajah se pura group lock nahi</li>',
  '<li>Poora group COMPLETED ho to group-level attendance lock</li>',
  '<li>Reports: day roster, intern history, exports</li>',
  '</ul>',
  '<h2>5.6 Analytics</h2>',
  '<ul>',
  '<li>Overview gauges, colleges, groups, leaderboard, attendance trends</li>',
  '<li>Drill-down: College / Group / Intern / Day</li>',
  '<li>Lazy tabs — pehle summary/charts, Students/Work on demand (fast load)</li>',
  '<li>Excel dashboard export</li>',
  '</ul>',
  '<h2>5.7 Profile &amp; Profile Changes</h2>',
  '<ul>',
  '<li>Student tree / profile view by role scope</li>',
  '<li>College requests profile edits → Admin/HR/Trainer approve/reject</li>',
  '<li>Completed internship sensitive edits — mainly Admin/HR</li>',
  '</ul>',

  '<h2>6. Important Statuses</h2>',
  '<h2>6.1 Internship Status (per Intern)</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Status</th><th>Meaning</th></tr></thead>',
  '<tbody>',
  '<tr><td>ACTIVE</td><td>Internship chal rahi hai — attendance + new tasks mil sakte hain</td></tr>',
  '<tr><td>COMPLETED</td><td>Internship khatam — us intern ki attendance lock; new group tasks nahi milte</td></tr>',
  '</tbody></table></div>',
  '<h2>6.2 Hired (Alag Flag)</h2>',
  '<p>Completed ≠ Hired. Complete sirf internship band karta hai. Hired alag button se sirf usi intern par lagta hai. Group complete karne se members Completed hote hain, auto-Hired nahi.</p>',
  '<h2>6.3 Task Status</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Status</th><th>Meaning</th></tr></thead>',
  '<tbody>',
  '<tr><td>ASSIGNED</td><td>Task diya gaya, submit pending</td></tr>',
  '<tr><td>SUBMITTED</td><td>Intern ne submit kiya, review pending</td></tr>',
  '<tr><td>NEEDS_IMPROVEMENT</td><td>Reviewer ne improve maanga — submit counter reset</td></tr>',
  '<tr><td>DONE</td><td>Task complete / accepted</td></tr>',
  '</tbody></table></div>',
  '<h2>6.4 Attendance Status</h2>',
  '<p>PRESENT · ABSENT · LEAVE · WEEK_OFF</p>',
  '<h2>6.5 Registration Approval</h2>',
  '<p>PENDING → APPROVED / REJECTED</p>',

  '<h2>7. Typical Flows</h2>',
  '<p><strong>A) College registration flow:</strong> Admin/HR invite → College submit list → Admin/HR approve → Intern login → Group assign → Tasks + Attendance → Complete / optionally Hire</p>',
  '<p><strong>B) Daily ops (Trainer):</strong> Group select → Attendance save (active only) → Assign tasks → Review submissions → Analytics check</p>',
  '<p><strong>C) Complete one non-working intern:</strong> Intern drill-down → Mark internship complete → woh attendance/task assign se hat jata hai; baaki group chalata rehta hai. Alag se Mark as hired jab offer ho.</p>',

  '<h2>8. Security &amp; Data Scope</h2>',
  '<ul>',
  '<li>Login + role-protected routes (frontend) aur <code>requireRole</code> (APIs)</li>',
  '<li>Trainer dusre trainers ke groups access nahi kar sakta</li>',
  '<li>College sirf apne college ke students dekhta hai</li>',
  '<li>Intern sirf apna data dekhta hai</li>',
  '<li>Completed internship history review ke liye available; marking us intern ke liye lock</li>',
  '<li>Secrets (<code>.env</code>, credentials, deploy notes) GitHub pe commit nahi hote</li>',
  '</ul>',

  '<h2>9. Menu Checklist</h2>',
  '<div class="table-wrap"><table>',
  '<thead><tr><th>Menu</th><th>Admin</th><th>HR</th><th>Trainer</th><th>College</th><th>Intern</th></tr></thead>',
  '<tbody>',
  '<tr><td>Dashboard</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>',
  '<tr><td>Users</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr>',
  '<tr><td>Colleges</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr>',
  '<tr><td>Registrations</td><td>Yes</td><td>Yes</td><td>No</td><td>No</td><td>No</td></tr>',
  '<tr><td>Groups</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>',
  '<tr><td>Tasks</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>',
  '<tr><td>Attendance</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>',
  '<tr><td>Analytics</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>',
  '<tr><td>Performance</td><td>No</td><td>No</td><td>No</td><td>No</td><td>Yes</td></tr>',
  '<tr><td>Profile</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>',
  '<tr><td>Profile changes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td><td>No</td></tr>',
  '</tbody></table></div>',

  '<h2>10. Short Summary</h2>',
  '<p>SMM Portal colleges, trainers aur HR/Admin ko ek jagah milata hai jahan interns register hote hain, groups mein training chalti hai, attendance aur tasks track hote hain, aur reports/analytics se performance clear dikhti hai.</p>',
  '<p>Admin aur HR almost poora system chalaten hain. Trainer apne groups par focus karta hai. College apne students submit/view karta hai. Intern apna kaam submit karta hai aur apni attendance/performance dekhta hai.</p>',
  '<p>Completed aur Hired alag hain — kisi ko complete karne se poora group band nahi hota; sirf woh student attendance/new tasks se hat jata hai.</p>',
  '<p><em>— End of document —</em></p>',

  '<h2>Demo Access</h2>',
  `<p>Live portal: <a href="${SMM_PORTAL_DEMO}" target="_blank" rel="noopener noreferrer">${SMM_PORTAL_DEMO}</a></p>`,
  `<p>Project overview PDF: <a href="${SMM_PORTAL_PDF}" target="_blank" rel="noopener noreferrer">${SMM_PORTAL_PDF}</a></p>`,
].join('\n');

const collegeProjects = [
  {
    developerEmail: 'ambikeshwar.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built SM SERVICES — Flask invoice & billing automation with OCR, PDF invoices, and UPI QR.',
      skills: ['Python', 'Flask', 'SQLite', 'OCR', 'Bootstrap', 'ReportLab'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack (Python)',
    },
    title: 'SM SERVICES — Invoice & Billing System',
    shortDescription:
      'Flask invoice & billing suite with OCR receipt scan, PDF tax invoices, UPI QR, and neon dark dashboard.',
    description: SM_SERVICES_DESCRIPTION,
    categoryName: 'SaaS',
    industry: 'Finance / Billing',
    projectType: 'Invoice & Billing',
    technologies: [
      'Python',
      'Flask',
      'SQLite',
      'ReportLab',
      'Pytesseract',
      'Bootstrap 5',
      'OCR',
    ],
    features: [
      'Secure authentication (Flask-Login)',
      'Automated invoice numbering',
      'OCR receipt & document scanner',
      'Dynamic line items + tax calculation',
      'PDF tax invoice generation',
      'UPI payment QR on invoices',
      'Sales analytics dashboard',
      'Dark Slate Neon UI',
    ],
    screenshots: [
      {
        url: SM_SERVICES_SCREENSHOT,
        caption: 'SM SERVICES — Account Login / Billing Console',
        order: 0,
      },
    ],
    demoUrl: 'https://invoice-app-9.onrender.com/',
    documentationUrl: SM_SERVICES_PDF,
    githubUrl: SM_SERVICES_GITHUB,
    liveDemoAvailable: true,
    demoCredentials: {
      username: 'admin',
      password: 'admin123',
      notes: 'Default credentials provisioned with the app (see project documentation).',
    },
    price: {
      displayText: 'Starting from ₹45,000',
      amount: 45000,
      min: 45000,
      max: 120000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'SM SERVICES — Invoice & Billing Automation System',
      metaDescription:
        'Enterprise Flask billing system with OCR, PDF invoices, UPI QR codes, and a Cyan Slate Neon dashboard.',
      keywords: [
        'invoice',
        'billing',
        'flask',
        'ocr',
        'pdf invoice',
        'upi qr',
        'sm services',
        'ambikeshwar',
      ],
    },
  },
  {
    developerEmail: 'yash.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built Yash Health Connect — multi-role hospital management SaaS with appointments, billing, care rooms and AI assistance.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack (MERN)',
    },
    title: 'Yash Health Connect — Hospital Management System',
    shortDescription:
      'Multi-role HMS SaaS for appointments, medical records, video consults, Razorpay billing and AI assistance.',
    description: YASH_HEALTH_DESCRIPTION,
    categoryName: 'Healthcare',
    industry: 'Healthcare',
    projectType: 'Hospital Management System',
    technologies: [
      'React',
      'Vite',
      'Tailwind CSS',
      'Node.js',
      'Express',
      'MongoDB',
      'Socket.io',
      'Razorpay',
    ],
    features: [
      'Role-based login (4 roles)',
      'Smart appointments',
      'Secure medical records',
      'Video consultation',
      'AI assistance',
      'Care Connect rooms',
      'Razorpay payments & subscriptions',
      'Hospital analytics dashboards',
    ],
    screenshots: [
      {
        url: YASH_HEALTH_SCREENSHOT,
        caption: 'Yash Health Connect — Login / Hospital Management',
        order: 0,
      },
    ],
    demoUrl: YASH_HEALTH_DEMO,
    documentationUrl: '',
    githubUrl: YASH_HEALTH_GITHUB,
    liveDemoAvailable: true,
    demoCredentials: {
      username: '',
      password: '',
      notes: 'Select a role on the login screen, then use environment / Test Mode credentials.',
    },
    price: {
      displayText: 'Starting from ₹85,000',
      amount: 85000,
      min: 85000,
      max: 250000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'Yash Health Connect — Hospital Management System',
      metaDescription:
        'Multi-role hospital SaaS with appointments, medical records, video consultation, Razorpay billing and AI assistance.',
      keywords: [
        'hospital management',
        'hms',
        'healthcare',
        'appointments',
        'razorpay',
        'yash health connect',
        'telemedicine',
      ],
    },
  },
  {
    developerEmail: 'shubham.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built Client Matrix (agency SaaS) and AB Public School Portal (institutional ERP) — multi-role dashboards, payments and operations.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Tailwind CSS', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack / Team Lead',
    },
    title: 'Client Matrix — Multi-Tenant Social Analytics SaaS',
    shortDescription:
      'Agency SaaS for multi-client social analytics, KYC lock, Razorpay subscriptions, AI creative tasks and auto-publishing.',
    description: CLIENT_MATRIX_DESCRIPTION,
    categoryName: 'SaaS',
    industry: 'Digital Marketing / Agencies',
    projectType: 'Multi-Tenant Analytics SaaS',
    technologies: [
      'HTML',
      'JavaScript',
      'Tailwind CSS',
      'Python',
      'Django',
      'SQLite',
      'Razorpay',
    ],
    features: [
      'Multi-tenant agency model',
      'Strict KYC & access control',
      'Multi-currency Razorpay subscriptions',
      'Client social analytics portal',
      'Content manager task pipeline',
      'AI 4-grid prompt generator',
      'Support helpdesk tickets',
      'Role-based dashboards',
    ],
    screenshots: [
      {
        url: CLIENT_MATRIX_SCREENSHOT,
        caption: 'Client Matrix — Landing / Growth Analytics SaaS',
        order: 0,
      },
    ],
    demoUrl: CLIENT_MATRIX_DEMO,
    documentationUrl: CLIENT_MATRIX_PDF,
    githubUrl: CLIENT_MATRIX_GITHUB,
    liveDemoAvailable: true,
    demoCredentials: {
      username: '',
      password: '',
      notes: 'Use Portal Login and select role: Super Admin, Agency Staff Admin, Client, or Content Manager.',
    },
    price: {
      displayText: 'Starting from ₹75,000',
      amount: 75000,
      min: 75000,
      max: 220000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'Client Matrix — Multi-Tenant Social Analytics & Growth SaaS',
      metaDescription:
        'Multi-tenant agency platform with KYC verification, Razorpay subscriptions, social analytics and AI creative workflows.',
      keywords: [
        'client matrix',
        'multi-tenant',
        'social analytics',
        'kyc',
        'razorpay',
        'agency saas',
        'shubham',
      ],
    },
  },
  {
    developerEmail: 'shubham.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built Client Matrix (agency SaaS) and AB Public School Portal (institutional ERP) — multi-role dashboards, payments and operations.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Tailwind CSS', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack / Team Lead',
    },
    title: 'AB Public School — Institutional ERP Portal',
    shortDescription:
      'School ERP with multi-role dashboards, admissions, fees, exams, library, parent portal and AI tutor widgets.',
    description: AB_SCHOOL_DESCRIPTION,
    categoryName: 'Education',
    industry: 'Education / Schools',
    projectType: 'School ERP / Institutional Portal',
    technologies: [
      'React',
      'Vite',
      'Tailwind CSS',
      'Node.js',
      'Express',
      'MongoDB',
      'JWT',
      'jsPDF',
    ],
    features: [
      'Multi-role institutional login',
      'Online student admissions',
      'Fees & payroll workflows',
      'Academics: attendance, homework, timetable',
      'Exams & marks',
      'Library management',
      'Parent portal & teacher queries',
      'AI Tutor & Quiz Bot widgets',
    ],
    screenshots: [
      {
        url: AB_SCHOOL_SCREENSHOT,
        caption: 'AB Public School — ERP Portal Login',
        order: 0,
      },
    ],
    demoUrl: AB_SCHOOL_DEMO,
    documentationUrl: '',
    githubUrl: AB_SCHOOL_GITHUB,
    liveDemoAvailable: true,
    demoCredentials: {
      username: 'admin@school.com',
      password: 'admin12345',
      notes: 'SUPER_ADMIN from seedAdmin.js. Other roles via teacher/parent seed scripts.',
    },
    price: {
      displayText: 'Starting from ₹65,000',
      amount: 65000,
      min: 65000,
      max: 180000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'AB Public School — Institutional ERP Portal',
      metaDescription:
        'School management ERP with admissions, fees, exams, library, parent portal and AI tutoring — React + Node + MongoDB.',
      keywords: [
        'school erp',
        'ab public school',
        'admissions',
        'fees',
        'education',
        'shubham',
        'institutional portal',
      ],
    },
  },
  {
    developerEmail: 'ayush.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built SmartJobs — Django career network with AI resume tools, employer billing, messaging and job CMS.',
      skills: ['Python', 'Django', 'SQLite', 'Razorpay', 'Gemini AI', 'HTML/CSS'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack (Django)',
    },
    title: 'SmartJobs — Professional Career Network',
    shortDescription:
      'Django job portal for seekers & employers with AI resume/JD tools, Razorpay subscriptions, messaging and CMS.',
    description: SMARTJOBS_DESCRIPTION,
    categoryName: 'Job Portal',
    industry: 'Recruitment / Careers',
    projectType: 'Job Portal / Career Network',
    technologies: [
      'Python',
      'Django',
      'SQLite',
      'Razorpay',
      'Gemini AI',
      'HTML/CSS',
      'JavaScript',
    ],
    features: [
      'Job seeker & employer roles',
      'AI resume analysis & cover letters',
      'AI job description generator',
      'Razorpay subscription billing',
      'SEO job & blog CMS',
      'Messaging & notifications',
      'Ads, analytics and support',
      'Forgot password / OTP fields',
    ],
    screenshots: [
      {
        url: SMARTJOBS_SCREENSHOT,
        caption: 'SmartJobs — Sign In',
        order: 0,
      },
    ],
    demoUrl: SMARTJOBS_DEMO,
    documentationUrl: '',
    githubUrl: SMARTJOBS_GITHUB,
    liveDemoAvailable: true,
    demoCredentials: {
      username: '',
      password: '',
      notes: 'Use Register to create Job Seeker or Employer account on the live PythonAnywhere demo.',
    },
    price: {
      displayText: 'Starting from ₹55,000',
      amount: 55000,
      min: 55000,
      max: 160000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'SmartJobs — Professional Career Network',
      metaDescription:
        'Django career platform with AI resume tools, employer JD generator, Razorpay plans, messaging and SEO job CMS.',
      keywords: [
        'smartjobs',
        'job portal',
        'django',
        'ai resume',
        'razorpay',
        'ayush',
        'career network',
      ],
    },
  },
  {
    developerEmail: 'sagar.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built SM Global Solution Hub marketplace and SMM Portal internship/training system (Admin, HR, Trainer, College, Intern).',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'Prisma', 'Vite', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack / Lead',
    },
    title: 'SM Global Solution Hub — Digital Marketplace',
    shortDescription:
      'Full-stack marketplace for live business software — roles, quotations, Razorpay, wallet payouts, live chat and reports.',
    description: SM_HUB_DESCRIPTION,
    categoryName: 'SaaS',
    industry: 'Software Marketplace',
    projectType: 'Digital Marketplace / SaaS Hub',
    technologies: [
      'React',
      'Vite',
      'Tailwind CSS',
      'Node.js',
      'Express',
      'MongoDB',
      'JWT',
      'Razorpay',
      'Cloudinary',
    ],
    features: [
      'Public project marketplace',
      'Multi-role JWT dashboards',
      'Developer listings & wallet payouts',
      'Quotations, invoices & Razorpay demo pay',
      'Live chat + contact inbox',
      'CRM follow-ups',
      'Reports with Excel / PDF export',
      'Cloudinary media & Super Admin settings',
    ],
    screenshots: [
      {
        url: SM_HUB_SCREENSHOT,
        caption: 'SM Global Solution Hub — Home / Marketplace',
        order: 0,
      },
    ],
    demoUrl: SM_HUB_DEMO,
    documentationUrl: SM_HUB_PDF,
    githubUrl: SM_HUB_GITHUB,
    liveDemoAvailable: true,
    demoCredentials: {
      username: 'superadmin@smglobal.com',
      password: 'Super@2026',
      notes: 'See CREDENTIALS.md for all demo role logins (college only).',
    },
    price: {
      displayText: 'Starting from ₹1,20,000',
      amount: 120000,
      min: 120000,
      max: 350000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'SM Global Solution Hub — Digital Marketplace',
      metaDescription:
        'College full-stack marketplace: React + Express + MongoDB with roles, payments, live chat, wallet payouts and reports.',
      keywords: [
        'sm global solution hub',
        'marketplace',
        'react',
        'express',
        'mongodb',
        'sagar',
        'razorpay',
      ],
    },
  },
  {
    developerEmail: 'sagar.dev@smglobalhub.com',
    developerProfile: {
      bio: 'Built SM Global Solution Hub marketplace and SMM Portal internship/training system (Admin, HR, Trainer, College, Intern).',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'Prisma', 'Vite', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack / Lead',
    },
    title: 'SMM Portal — Internship & Training Management',
    shortDescription:
      'Internship portal for colleges — 5 roles, groups, attendance, tasks, analytics; COMPLETED vs HIRED workflows.',
    description: SMM_PORTAL_DESCRIPTION,
    categoryName: 'Education',
    industry: 'Education / Internships / HR',
    projectType: 'Internship & Training Management',
    technologies: [
      'React',
      'Vite',
      'Express',
      'Prisma',
      'MySQL',
      'JWT',
    ],
    features: [
      '5 roles: Admin, HR, Trainer, College, Intern',
      'College invite + Excel registration',
      'Training groups & trainers',
      'Daily attendance (Present/Absent/Leave/Week off)',
      'Task library, assign, submit & review',
      'Analytics with college/group/intern drill-down',
      'Internship COMPLETED vs HIRED',
      'Excel exports & scoped permissions',
    ],
    screenshots: [
      {
        url: SMM_PORTAL_SCREENSHOT,
        caption: 'SMM Portal / SM Services — Landing',
        order: 0,
      },
    ],
    demoUrl: SMM_PORTAL_DEMO,
    documentationUrl: SMM_PORTAL_PDF,
    githubUrl: '',
    liveDemoAvailable: true,
    demoCredentials: {
      username: '',
      password: '',
      notes: 'Use Login on https://smservice.co.in/ with role-specific accounts (Admin / HR / Trainer / College / Intern).',
    },
    price: {
      displayText: 'Starting from ₹95,000',
      amount: 95000,
      min: 95000,
      max: 280000,
      currency: 'INR',
    },
    buyNowEnabled: true,
    customizable: true,
    status: 'published',
    featured: true,
    tier: 1,
    reviewStatus: 'approved',
    seo: {
      metaTitle: 'SMM Portal — Internship & Training Management System',
      metaDescription:
        'SM Service internship portal with Admin/HR/Trainer/College/Intern roles, attendance, tasks and analytics.',
      keywords: [
        'smm portal',
        'internship',
        'training',
        'attendance',
        'smservice',
        'sagar',
        'hr',
      ],
    },
  },
];

const seedCollegeTeamProjects = async ({ clearAll = true } = {}) => {
  await seedDevelopers();

  if (clearAll) {
    const deleted = await Project.deleteMany({});
    console.log(`Cleared existing projects: ${deleted.deletedCount}`);
  }

  let created = 0;
  let updated = 0;

  for (const item of collegeProjects) {
    const developer = await User.findOne({ email: item.developerEmail, role: 'developer' });
    if (!developer) {
      console.warn(`Skip — developer not found: ${item.developerEmail}`);
      continue;
    }

    // Refresh developer marketplace profile when provided
    if (item.developerProfile) {
      developer.profile = {
        ...(developer.profile?.toObject?.() || developer.profile || {}),
        ...item.developerProfile,
      };
      await developer.save();
    }

    let category = await Category.findOne({ name: item.categoryName });
    if (!category) {
      category = await Category.create({
        name: item.categoryName,
        description: `${item.categoryName} solutions`,
      });
    }

    const payload = {
      title: item.title,
      shortDescription: item.shortDescription,
      description: item.description,
      category: category._id,
      industry: item.industry,
      projectType: item.projectType,
      technologies: item.technologies,
      features: item.features,
      screenshots: item.screenshots,
      demoUrl: item.demoUrl,
      documentationUrl: item.documentationUrl || '',
      githubUrl: item.githubUrl || '',
      liveDemoAvailable: item.liveDemoAvailable,
      demoCredentials: item.demoCredentials,
      price: item.price,
      buyNowEnabled: item.buyNowEnabled,
      customizable: item.customizable,
      ownerType: 'developer',
      developerId: developer._id,
      status: item.status,
      featured: item.featured,
      tier: item.tier,
      reviewStatus: item.reviewStatus,
      reviewedAt: new Date(),
      seo: item.seo,
      createdBy: developer._id,
    };

    const existing = await Project.findOne({ title: item.title });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
      console.log('Updated:', item.title);
    } else {
      await Project.create(payload);
      created += 1;
      console.log('Created:', item.title, '→', developer.name);
    }
  }

  const categoryIds = await Category.find().select('_id');
  for (const cat of categoryIds) {
    const count = await Project.countDocuments({ category: cat._id });
    await Category.findByIdAndUpdate(cat._id, { projectCount: count });
  }

  const total = await Project.countDocuments();
  console.log(`College team projects: ${created} created, ${updated} updated. Catalog total: ${total}`);
};

const run = async () => {
  try {
    await connectDB();
    await seedCollegeTeamProjects({ clearAll: true });
    process.exit(0);
  } catch (error) {
    console.error('seedCollegeTeamProjects failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedCollegeTeamProjects;
