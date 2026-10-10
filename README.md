# Student Login & Registration System (EduPortal)

> **A Secure, Full-Stack Academic Portal built with HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, and MongoDB.**  
> Designed for Computer Science Engineering college project submissions, technical reviews, internship portfolios, and GitHub showcases.

---

## 📌 Project Abstract

The **Student Login & Registration System (EduPortal)** is a production-grade, three-tier web application developed to provide educational institutions with a secure, centralized portal for student account management. Built without heavyweight frontend frameworks, the system utilizes semantic HTML5, modern CSS3 glassmorphism, and asynchronous Vanilla JavaScript communicating with a Node.js and Express RESTful API.

Data security is achieved by hashing student passwords with **bcryptjs** (12 salt rounds) and implementing stateless authentication using **JSON Web Tokens (JWT)** delivered via **HttpOnly, SameSite cookies**. Student profiles are managed in a **MongoDB Atlas** cloud database with database-level uniqueness constraints. The system includes client-side and server-side validation, protected route middleware, and an interactive student dashboard that displays authenticated database records in real time.

---

## 🚀 Key Features

- **🎨 Modern Split-Screen UI / UX:**
  - Designed with an academic color theme: deep navy blue (`#0a0f1d`), royal blue, indigo, and soft lavender.
  - Subtle glassmorphism cards with backdrop blur, accessible focus states, and Lucide icons.
  - Fully responsive layout for desktop, laptop, tablet, and mobile screens.

- **📝 Real-Time Student Registration:**
  - Client-side and server-side validation for name, college email, and passwords.
  - Interactive **Password Strength Meter** (Weak, Fair, Good, Strong) evaluating character variety.
  - Real-time checklist validating length, uppercase letters, special symbols, and match confirmation.
  - Automatic email normalization (trim and lowercase) and duplicate check against MongoDB index.

- **🔐 Enterprise-Grade Authentication & Security:**
  - **Zero Plaintext Passwords:** Hashes credentials using `bcryptjs` with 12 salt rounds.
  - **HttpOnly Cookies:** Authentication tokens (`JWT`) are stored in HttpOnly cookies, rendering them inaccessible to client-side JavaScript (`document.cookie`) to prevent Cross-Site Scripting (XSS) session hijacking.
  - **SameSite Cookie Configuration:** Defends against Cross-Site Request Forgery (CSRF).
  - **Timing-Attack Resilient Login:** Returns generic error messages (`"Invalid email or password"`) to prevent account enumeration.

- **📊 Protected Student Dashboard:**
  - Route guard middleware verifies token signatures via `GET /api/auth/me` on every session load.
  - Automatically redirects unauthorized visitors to the login page.
  - Displays real-time database fields: Student Full Name, Normalized Email, Database Student ID, and Account Registration Date.
  - Dynamic time-of-day greeting (Morning / Afternoon / Evening).

- **🛠️ Review & Evaluation Utilities:**
  - **Live Backend & DB Health Ping:** Real-time round-trip latency and MongoDB status monitor via `GET /api/health`.
  - **Digital Student ID Badge:** Generates a printable student identity card.
  - **One-Click Student ID Copy:** Copies verified ID to clipboard with toast notifications.
  - **Graceful Logout:** Clears HttpOnly authentication cookies on the backend and redirects cleanly.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Semantic markup, responsive glassmorphism CSS, Fetch API |
| **Icons & Typography** | Lucide Icons, Plus Jakarta Sans, Inter | Modern academic typography and crisp SVG vectors |
| **Backend Runtime** | Node.js (v18+ / v20+ / v24+) | High-performance asynchronous JavaScript runtime |
| **Web Framework** | Express.js (v4.x) | RESTful API routing, centralized error handling |
| **Database** | MongoDB Atlas / Mongoose (v8.x) | Cloud NoSQL database with strict schema validation |
| **Security & Auth** | bcryptjs, jsonwebtoken, cookie-parser | Salted hashing, JWT generation, secure cookie parsing |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`) | Built-in automated integration and unit test suite |
| **Environment** | dotenv | Secure runtime environment variable isolation |

---

## 📸 Screenshots

*(Add your screenshots here for project reviews and GitHub preview)*

| View | Description | File Placement |
|---|---|---|
| **Split-Screen Login** | EduPortal left brand showroom with right glassmorphism login card. | `screenshots/login.png` |
| **Student Registration** | Dynamic password strength meter with 4-point security checklist. | `screenshots/register.png` |
| **Protected Dashboard** | Live student profile from MongoDB, health monitor, and ID badge. | `screenshots/dashboard.png` |

---

## 📂 Project Folder Structure

```text
student-login-system/
├── frontend/                     # Client-side presentation layer
│   ├── css/
│   │   └── style.css             # Unified CSS variables, glassmorphism, responsive styles
│   ├── js/
│   │   ├── auth.js               # Client auth: login, registration, password strength
│   │   └── dashboard.js          # Dashboard controller: auth guard, profile, portal tools
│   ├── index.html                # Split-screen student login page
│   ├── register.html             # Student enrollment page with strength meter
│   └── dashboard.html            # Protected student dashboard & digital ID badge
│
├── backend/                      # Server-side application layer
│   ├── config/
│   │   └── db.js                 # Mongoose connection with Atlas error handling
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification guard for protected routes
│   ├── models/
│   │   └── User.js               # Mongoose schema, pre-save hashing, safe serializer
│   ├── routes/
│   │   └── auth.js               # REST routes: register, login, me, logout
│   ├── tests/
│   │   └── auth.test.js          # 14 automated backend unit & integration tests
│   ├── .env.example              # Environment variables template
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express server, middleware, static file serving
│
├── .gitignore                    # Git exclusion rules (node_modules, .env, logs)
├── package.json                  # Root runner script for npm start & npm test
└── README.md                     # Complete project documentation & viva guide
```

---

## 🏗️ System Architecture

The project follows a **Three-Tier Architecture**:

```mermaid
flowchart TD
    subgraph Client ["Client Presentation Layer (Browser)"]
        UI["Vanilla JS + HTML5 + CSS3"]
        C1["Login Form (index.html)"]
        C2["Register Form (register.html)"]
        C3["Dashboard Guard (dashboard.html)"]
    end

    subgraph Server ["Application Server Layer (Node.js & Express)"]
        EX["Express.js Server (Port 5000)"]
        ROUTER["Auth Router (/api/auth)"]
        MIDDLEWARE["JWT Auth Middleware (authMiddleware.js)"]
        CRYPTO["bcryptjs (12 Salt Rounds)"]
        JWT_SVC["jsonwebtoken (Sign & Verify)"]
    end

    subgraph Data ["Data Storage Layer (Cloud)"]
        MONGO["MongoDB Atlas Cluster (student_login_db)"]
        MODEL["Mongoose User Model (Unique Email Index)"]
    end

    UI -->|HTTP Requests with credentials: 'include'| EX
    EX --> ROUTER
    ROUTER -->|Verify Session| MIDDLEWARE
    ROUTER -->|Hash / Compare Passwords| CRYPTO
    ROUTER -->|Generate HttpOnly Cookie| JWT_SVC
    ROUTER -->|Query / Save User| MODEL
    MODEL -->|TCP TLS| MONGO
```

---

## ⚙️ Prerequisites & Environment Setup

Before running the application on **Windows 11**:

1. **Verify Node.js and npm are installed:**
   Open PowerShell and execute:
   ```powershell
   node -v
   npm -v
   git --version
   ```
   *Expected output:* Node.js `v18.0.0` or higher, npm `v9.0.0` or higher.

   > 💡 **Tip for Windows 11 / Antigravity Terminal:** If PowerShell reports `The term 'node' is not recognized`, add Node.js to your session PATH:
   > ```powershell
   > $env:PATH = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;$env:PATH"
   > ```

2. **MongoDB Atlas Account (Free Cloud Database):**
   - Sign up at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register).
   - Create a free **M0 Sandbox Cluster**.
   - Create a database user (e.g., username: `student_admin`, with a strong password).
   - In **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) so your local machine can connect.
   - Click **Connect** → **Drivers** → Copy the connection string.
   - Set the database name in the connection string to `student_login_db`.

---

## 🔧 Step-by-Step Installation Guide

### Step 1: Open the Project Directory
In Windows PowerShell:
```powershell
cd c:\Users\Nattar\OneDrive\Desktop\student-login-system
```

### Step 2: Install Backend Dependencies
```powershell
cd backend
npm install
cd ..
```
*Dependencies installed:* `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `dotenv`.

### Step 3: Configure Environment Variables
Copy the `.env.example` file to create your active `.env`:
```powershell
Copy-Item backend\.env.example backend\.env
```

### Step 4: Generate a Strong JWT Secret
Run this PowerShell command to generate a cryptographically strong 64-character secret key:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Step 5: Update `backend/.env`
Open `backend/.env` in your editor and fill in your values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://student_admin:YourPassword123@cluster0.abcde.mongodb.net/student_login_db?retryWrites=true&w=majority
JWT_SECRET=your_generated_64_character_secret_key_here
JWT_EXPIRES_IN=24h
FRONTEND_ORIGIN=http://localhost:5000
```

---

## 🏃 Running the Application

### Start the Server:
From the project root:
```powershell
npm start
```

Or for automatic reload on code changes:
```powershell
npm run dev
```

### Access URLs:
- **Student Login Page:** [http://localhost:5000/](http://localhost:5000/)
- **Student Registration Page:** [http://localhost:5000/register.html](http://localhost:5000/register.html)
- **Protected Student Dashboard:** [http://localhost:5000/dashboard.html](http://localhost:5000/dashboard.html)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Automated Testing

The project includes an automated test suite executed with the native Node.js test runner:

```powershell
npm test
```

### Test Suite Execution Output:
```text
▶ EduPortal — Automated Backend & Authentication Test Suite
  ✔ GET /api/health should return 200 OK and status "ok" (46.5ms)
  ✔ POST /api/auth/register should fail when required fields are missing (14.5ms)
  ✔ POST /api/auth/register should fail with invalid email format (3.7ms)
  ✔ POST /api/auth/register should fail when password is weak (< 8 chars) (3.5ms)
  ✔ POST /api/auth/register should fail when passwords do not match (5.0ms)
  ✔ POST /api/auth/register should successfully register a new student and NOT return password hash (74.5ms)
  ✔ POST /api/auth/register should reject duplicate email registrations (2.3ms)
  ✔ POST /api/auth/login should fail with incorrect password (56.6ms)
  ✔ POST /api/auth/login should fail for non-existent student email (2.3ms)
  ✔ POST /api/auth/login should succeed with valid credentials and issue HttpOnly cookie (90.9ms)
  ✔ GET /api/auth/me should reject access when unauthenticated (no cookie) (3.8ms)
  ✔ GET /api/auth/me should succeed and return student profile with valid cookie (4.0ms)
  ✔ POST /api/auth/logout should clear the authentication cookie (2.0ms)
  ✔ Bcrypt must generate strong salted hashes and never store plaintext (663.2ms)
✔ EduPortal — Automated Backend & Authentication Test Suite (982.4ms)
ℹ tests 14
ℹ suites 1
ℹ pass 14
ℹ fail 0
```

---

## 📡 REST API Documentation

### 1. Register Student
- **Endpoint:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Alex Johnson",
    "email": "alex.johnson@college.edu",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "success": true,
    "message": "Student account created successfully! You can now log in.",
    "user": {
      "id": "65432109876543210987654a",
      "name": "Alex Johnson",
      "email": "alex.johnson@college.edu",
      "role": "student",
      "status": "Active",
      "createdAt": "2026-10-10T16:00:00.000Z"
    }
  }
  ```

### 2. Login Student
- **Endpoint:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "alex.johnson@college.edu",
    "password": "SecurePassword123!",
    "rememberMe": false
  }
  ```
- **Response Headers:** `Set-Cookie: token=<jwt>; HttpOnly; Path=/; SameSite=Lax`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Authentication successful! Welcome to EduPortal.",
    "user": {
      "id": "65432109876543210987654a",
      "name": "Alex Johnson",
      "email": "alex.johnson@college.edu",
      "role": "student",
      "status": "Active",
      "createdAt": "2026-10-10T16:00:00.000Z"
    }
  }
  ```

### 3. Get Authenticated Student Profile (Protected)
- **Endpoint:** `GET /api/auth/me`
- **Headers:** Cookie automatically sent via browser (`credentials: 'include'`) or `Authorization: Bearer <token>`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Authenticated student profile retrieved.",
    "user": {
      "id": "65432109876543210987654a",
      "name": "Alex Johnson",
      "email": "alex.johnson@college.edu",
      "role": "student",
      "status": "Active",
      "createdAt": "2026-10-10T16:00:00.000Z"
    }
  }
  ```
- **Unauthorized Response (`401 Unauthorized`):**
  ```json
  {
    "success": false,
    "message": "Access denied. No authentication session found. Please log in."
  }
  ```

### 4. Logout Student
- **Endpoint:** `POST /api/auth/logout`
- **Response Headers:** `Set-Cookie: token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly`
- **Success Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

### 5. Health Check
- **Endpoint:** `GET /api/health`
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "service": "EduPortal Authentication Service",
    "timestamp": "2026-10-10T16:00:00.000Z",
    "database": "connected",
    "environment": "development",
    "uptime": "120 seconds"
  }
  ```

---

## 🔒 Security Design & Best Practices

1. **Defense Against Cross-Site Scripting (XSS):**
   - Storing authentication tokens in `localStorage` or `sessionStorage` exposes tokens to malicious third-party scripts.
   - EduPortal places the JWT exclusively in an **`HttpOnly` cookie**. The browser automatically attaches this cookie to same-origin requests, but client-side JavaScript cannot read it via `document.cookie`.

2. **Defense Against Cross-Site Request Forgery (CSRF):**
   - Cookies are configured with `SameSite=Lax` in development and `SameSite=Strict` in production, ensuring cookies are not sent during unauthorized cross-site requests.

3. **Protection of Credentials with bcrypt:**
   - Instead of fast hashing algorithms (MD5, SHA-256), passwords use `bcryptjs` with 12 salt rounds. bcrypt is intentionally compute-intensive, defending against brute-force and rainbow table attacks.

4. **Information Disclosure Prevention:**
   - Authentication errors return generic responses (`"Invalid email or password"`) to prevent username enumeration.
   - Mongoose schemas feature a `.toSafeObject()` method and `.select('-password')` queries to prevent password hashes from ever leaving the database boundary.
   - Stack traces are suppressed from client responses in production mode.

---

## ⚠️ Common Troubleshooting & Solutions

| Issue | Cause | Solution |
|---|---|---|
| **`[MongoDB Warning] MONGODB_URI is not configured`** | `backend/.env` is missing or contains placeholder values. | Copy `backend/.env.example` to `backend/.env` and replace placeholders with your real MongoDB Atlas connection string. |
| **`MongoServerSelectionError: connection timed out`** | MongoDB Atlas IP Access List does not permit your current IP address. | Log in to MongoDB Atlas, navigate to **Network Access**, and add `0.0.0.0/0` (Allow Access from Anywhere). |
| **`Error: listen EADDRINUSE: address already in use :::5000`** | Another application is running on port 5000. | Change `PORT=5001` inside `backend/.env` or terminate the process occupying port 5000. |
| **`401 Unauthorized` on Dashboard** | Cookie expired or user not logged in. | Sign in at [http://localhost:5000/](http://localhost:5000/). The dashboard will automatically populate. |
| **`The term 'node' is not recognized`** | Node.js directory is missing from PowerShell's PATH. | Run: `$env:PATH = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;$env:PATH"`. |

---

## 📤 Uploading to GitHub

To publish this project to your GitHub portfolio:

1. **Create a new repository** named `student-login-system` on [GitHub](https://github.com/new). Leave it empty (do not initialize with README or license).
2. Open PowerShell in your project folder:
   ```powershell
   cd c:\Users\Nattar\OneDrive\Desktop\student-login-system
   ```
3. Initialize Git and check status:
   ```powershell
   git init
   git status
   ```
4. Verify that `.gitignore` prevents `node_modules` and `.env` from being tracked.
5. Stage and commit files:
   ```powershell
   git add .
   git commit -m "feat: complete student login and registration system with JWT and MongoDB"
   ```
6. Set the main branch and connect your remote repository:
   ```powershell
   git branch -M main
   git remote add origin https://github.com/<your-username>/student-login-system.git
   ```
7. Push code:
   ```powershell
   git push -u origin main
   ```

---

## 💼 Internship & Job Interview Elevator Pitch

> *"For my Computer Science Engineering project, I architected **EduPortal**, a full-stack student authentication system using Node.js, Express, and MongoDB Atlas. Recognizing that many student projects improperly store credentials in plain text or place tokens in browser localStorage—exposing them to XSS attacks—I engineered a secure authentication pipeline using bcrypt salted hashing and JWTs encapsulated in HttpOnly cookies with SameSite defense.*  
> *I built the frontend with semantic HTML5 and vanilla JavaScript without heavy external libraries, implementing real-time password strength algorithms and responsive glassmorphism UI. The backend features centralized error handling, Mongoose database constraints, and an automated 14-point test suite covering edge cases like duplicate email collisions, session expiration, and timing attacks."*

---

## 🎓 College Viva Questions & Answers

### Q1: What is the difference between Authentication and Authorization?
**Answer:** **Authentication** is the process of verifying *who* a user is (e.g., verifying their email and password during login). **Authorization** is the process of verifying *what permissions* an authenticated user has (e.g., verifying whether a logged-in user has the `student` or `admin` role before granting access to specific resources).

### Q2: Why do we use bcrypt instead of SHA-256 or MD5 for password storage?
**Answer:** Algorithms like MD5 and SHA-256 were designed for fast data integrity verification. Because they are fast, modern GPUs can calculate billions of SHA-256 hashes per second, making them vulnerable to brute-force and rainbow table attacks. **bcrypt** is an adaptive, slow hashing algorithm with a configurable work factor (salt rounds). We use 12 rounds, meaning hashing takes ~250ms, making brute-force attacks computationally infeasible.

### Q3: What is a "Salt" in password hashing?
**Answer:** A salt is a cryptographically random string generated and prepended to the password before hashing. Salting ensures that two users with identical passwords will produce completely different hash outputs, completely neutralizing precomputed rainbow table attacks.

### Q4: What is a JSON Web Token (JWT) and what are its three parts?
**Answer:** A JWT is a compact, URL-safe standard (RFC 7519) for securely transmitting claims between parties. It consists of three parts separated by dots (`.`):
1. **Header:** Identifies the token type (`JWT`) and signing algorithm (`HS256`).
2. **Payload:** Contains claims (e.g., student ID, email, expiration time).
3. **Signature:** Cryptographic hash of `Base64(Header) + "." + Base64(Payload)` generated using the server's private secret key.

### Q5: Why store the JWT in an `HttpOnly` cookie rather than `localStorage`?
**Answer:** `localStorage` is accessible to any JavaScript running on the domain. If the application has a Cross-Site Scripting (XSS) vulnerability, an attacker can steal the JWT using `localStorage.getItem('token')`. Setting the cookie with the **`HttpOnly` flag** makes it inaccessible to JavaScript, meaning client scripts cannot read it even if an XSS vulnerability exists.

### Q6: What does `credentials: 'include'` mean in the client's `fetch()` call?
**Answer:** By default, browsers do not send cookies with cross-origin or fetch requests. Setting `credentials: 'include'` instructs the browser to include cookies (such as our HttpOnly auth token) with outgoing HTTP requests, allowing the backend to authenticate the session.

### Q7: How does Mongoose enforce email uniqueness?
**Answer:** We set `unique: true` on the `email` field in the Mongoose schema. When Mongoose connects, it instructs MongoDB to create a unique B-tree index on the `email` field. If an insertion attempt has a duplicate email, MongoDB throws an `E11000 duplicate key error`, which our controller catches and converts into a clean `409 Conflict` HTTP response.

### Q8: What is Express middleware and how is it used in this project?
**Answer:** Middleware functions in Express are functions that have access to the request (`req`), response (`res`), and the `next` function in the application's request-response cycle. In our project:
- `express.json()` parses JSON payloads.
- `cookieParser()` parses cookies into `req.cookies`.
- `authMiddleware (protect)` extracts the JWT, verifies its signature, loads the student record, and attaches it to `req.user` before reaching protected handlers.

### Q9: Why normalize email addresses with `.toLowerCase()` and `.trim()`?
**Answer:** Email addresses are case-insensitive according to user expectation (e.g., `Alex@college.edu` and `alex@college.edu` belong to the same person). Without normalization, duplicate accounts could be registered, or users could be locked out of their accounts due to automatic capitalization on mobile keyboards.

### Q10: What does the `SameSite` cookie attribute do?
**Answer:** The `SameSite` attribute controls whether cookies are sent with cross-site requests. Setting `SameSite=Lax` or `Strict` prevents the browser from attaching the authentication cookie when a user clicks a malicious link from an external site, defending against Cross-Site Request Forgery (CSRF).

### Q11: What is the purpose of the health check endpoint `/api/health`?
**Answer:** Health check endpoints allow monitoring systems, load balancers, and developer tools to verify that both the HTTP server and dependent external resources (such as the MongoDB Atlas cluster) are alive and accepting connections without needing full user authentication.

### Q12: How is route protection implemented on the client versus the server?
**Answer:** Client-side protection (in `dashboard.js`) checks `/api/auth/me` on page load and redirects unauthorized users for good UX. However, **real security happens on the server**: even if an attacker bypasses client-side JavaScript, the Express `protect` middleware strictly rejects requests without a cryptographically valid JWT signature.

---

## 📜 License

This project is licensed under the **MIT License** — free for academic, personal, and educational use.
