/**
 * EduPortal — Student Dashboard Controller
 * Enforces route protection, fetches authenticated profile, and coordinates interactive utilities
 */

const API_BASE_URL = window.location.origin;

// Global state holding safe authenticated student profile
let currentStudent = null;

// ==============================================================
// 1. Toast Notification Helper
// ==============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==============================================================
// 2. Format Dates & Helpers
// ==============================================================
function formatStudentDate(dateString) {
  if (!dateString) return 'Active Enrollment';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ==============================================================
// 3. Verify Authentication & Load Student Profile
// ==============================================================
async function loadAuthenticatedProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Ensures the HttpOnly cookie is sent with the request
      credentials: 'include'
    });

    if (response.status === 401 || response.status === 403) {
      console.warn('[EduPortal Auth Guard] Session expired or unauthorized. Redirecting to login.');
      window.location.href = 'index.html?error=unauthorized';
      return;
    }

    const data = await response.json();

    if (response.ok && data.success && data.user) {
      currentStudent = data.user;
      renderDashboardUI(currentStudent);
    } else {
      window.location.href = 'index.html?error=unauthorized';
    }

  } catch (error) {
    console.error('[EduPortal Error] Failed to fetch student profile:', error);
    // If backend is unreachable, notify and redirect
    showToast('Cannot connect to authentication service.', 'error');
    setTimeout(() => {
      window.location.href = 'index.html?error=unauthorized';
    }, 1500);
  }
}

// ==============================================================
// 4. Render UI with Actual Student Data
// ==============================================================
function renderDashboardUI(student) {
  const greeting = getTimeOfDayGreeting();
  const initials = getInitials(student.name);
  const formattedDate = formatStudentDate(student.createdAt);
  const studentShortId = `EDUP-${String(student.id || student._id || '987654').slice(-6).toUpperCase()}`;

  // Time Greeting
  const greetingTimeEl = document.getElementById('greetingTimeText');
  if (greetingTimeEl) {
    greetingTimeEl.textContent = `${greeting} • Spring 2026 Term`;
  }

  // Hero Welcome Name
  const heroNameEl = document.getElementById('heroWelcomeName');
  if (heroNameEl) {
    heroNameEl.innerHTML = `${greeting}, <span style="background: var(--gradient-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${student.name}</span>!`;
  }

  // Profile Card
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAvatar = document.getElementById('profileAvatar');
  const navAvatar = document.getElementById('navAvatar');
  const navStudentName = document.getElementById('navStudentName');
  const profileStudentId = document.getElementById('profileStudentId');
  const profileCreatedAt = document.getElementById('profileCreatedAt');
  const studentStatusText = document.getElementById('studentStatusText');

  if (profileName) profileName.textContent = student.name;
  if (profileEmail) profileEmail.textContent = student.email;
  if (profileAvatar) profileAvatar.textContent = initials;
  if (navAvatar) navAvatar.textContent = initials;
  if (navStudentName) {
    navStudentName.textContent = student.name;
    navStudentName.style.display = 'inline-block';
  }
  if (profileStudentId) profileStudentId.textContent = studentShortId;
  if (profileCreatedAt) profileCreatedAt.textContent = formattedDate;
  if (studentStatusText) studentStatusText.textContent = student.status || 'Active';

  // Digital ID Card Elements
  const idCardAvatar = document.getElementById('idCardAvatar');
  const idCardName = document.getElementById('idCardName');
  const idCardEmail = document.getElementById('idCardEmail');
  const idCardStudentId = document.getElementById('idCardStudentId');
  const idCardIssueDate = document.getElementById('idCardIssueDate');

  if (idCardAvatar) idCardAvatar.textContent = initials;
  if (idCardName) idCardName.textContent = student.name;
  if (idCardEmail) idCardEmail.textContent = student.email;
  if (idCardStudentId) idCardStudentId.textContent = studentShortId;
  if (idCardIssueDate) idCardIssueDate.textContent = formattedDate;

  // Refresh icons
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ==============================================================
// 5. Handle Logout
// ==============================================================
async function handleLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.disabled = true;
    logoutBtn.innerHTML = `<div class="spinner" style="display:inline-block; width:14px; height:14px; border-width:2px;"></div> Signing Out...`;
  }

  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn('[EduPortal] Logout request completed locally:', e);
  } finally {
    // Redirect cleanly to login page
    window.location.href = 'index.html?logged_out=true';
  }
}

// ==============================================================
// 6. Interactive Portal Tools Handlers
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
  // First, verify authentication
  loadAuthenticatedProfile();

  // Bind Logout Button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Tool 1: Live Health Check Modal
  const btnHealth = document.getElementById('btnRunHealthCheck');
  const healthModal = document.getElementById('healthModal');
  const closeHealthModal = document.getElementById('closeHealthModal');
  const dismissHealthModal = document.getElementById('dismissHealthModal');
  const healthModalContent = document.getElementById('healthModalContent');

  if (btnHealth && healthModal) {
    btnHealth.addEventListener('click', async () => {
      healthModal.classList.add('show');
      healthModalContent.innerHTML = `
        <div style="text-align: center; padding: 1.5rem;">
          <div class="spinner" style="display: inline-block; width: 28px; height: 28px; border-width: 3px;"></div>
          <p style="margin-top: 0.75rem; color: #94a3b8;">Testing backend round-trip latency...</p>
        </div>
      `;

      const startTime = performance.now();
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        const duration = Math.round(performance.now() - startTime);
        const data = await res.json();

        healthModalContent.innerHTML = `
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-glass); border-radius: 0.75rem; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
              <span>API Status:</span>
              <strong style="color: #34d399;">${data.status ? data.status.toUpperCase() : 'HEALTHY'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
              <span>MongoDB State:</span>
              <strong style="color: ${data.database === 'connected' ? '#34d399' : '#f59e0b'};">
                ${data.database ? data.database.toUpperCase() : 'UNKNOWN'}
              </strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
              <span>Response Latency:</span>
              <strong style="color: #60a5fa;">${duration} ms</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
              <span>Server Uptime:</span>
              <span style="color: #cbd5e1;">${data.uptime || 'Active'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Timestamp:</span>
              <span style="color: #94a3b8; font-size: 0.775rem;">${new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <p style="margin-top: 1rem; font-size: 0.8rem; color: #94a3b8;">
            ✅ Live ping succeeded. The Express REST server is operating normally.
          </p>
        `;
      } catch (err) {
        healthModalContent.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.75rem; padding: 1.25rem; color: #fca5a5;">
            <strong>Health Check Failed</strong>
            <p style="margin-top: 0.5rem; font-size: 0.825rem;">Unable to connect to /api/health endpoint. Verify the Node.js server is running on port 5000.</p>
          </div>
        `;
      }
    });

    if (closeHealthModal) closeHealthModal.addEventListener('click', () => healthModal.classList.remove('show'));
    if (dismissHealthModal) dismissHealthModal.addEventListener('click', () => healthModal.classList.remove('show'));
  }

  // Tool 2: Digital Student ID Card Modal
  const btnIdCard = document.getElementById('btnViewStudentCard');
  const idModal = document.getElementById('idCardModal');
  const closeIdModal = document.getElementById('closeIdModal');

  if (btnIdCard && idModal) {
    btnIdCard.addEventListener('click', () => {
      idModal.classList.add('show');
      if (window.lucide) lucide.createIcons();
    });
    if (closeIdModal) closeIdModal.addEventListener('click', () => idModal.classList.remove('show'));
  }

  // Tool 3: Copy Student ID
  const btnCopyId = document.getElementById('btnCopyStudentId');
  if (btnCopyId) {
    btnCopyId.addEventListener('click', () => {
      if (!currentStudent) return;
      const studentShortId = `EDUP-${String(currentStudent.id || currentStudent._id || '987654').slice(-6).toUpperCase()}`;
      navigator.clipboard.writeText(studentShortId).then(() => {
        showToast(`Student ID ${studentShortId} copied to clipboard!`, 'success');
      }).catch(() => {
        showToast(`Student ID: ${studentShortId}`, 'info');
      });
    });
  }

});
