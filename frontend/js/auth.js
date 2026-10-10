/**
 * EduPortal — Authentication Logic (Login & Registration)
 * Handles client-side validation, password strength analysis, and API communication
 */

// Helper to determine API base URL (works seamlessly in both unified and split environments)
const API_BASE_URL = window.location.origin;

// ==============================================================
// 1. Password Visibility Toggle Utility
// ==============================================================
function setupPasswordToggle(buttonId, inputId) {
  const toggleBtn = document.getElementById(buttonId);
  const input = document.getElementById(inputId);

  if (!toggleBtn || !input) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    // Toggle icon
    toggleBtn.innerHTML = isPassword 
      ? '<i data-lucide="eye-off" style="width: 18px; height: 18px;"></i>' 
      : '<i data-lucide="eye" style="width: 18px; height: 18px;"></i>';

    if (window.lucide) {
      lucide.createIcons();
    }
  });
}

// ==============================================================
// 2. Alert Notification Helper
// ==============================================================
function showAlert(alertContainerId, messageId, message, type = 'error') {
  const alertEl = document.getElementById(alertContainerId);
  const msgEl = document.getElementById(messageId);

  if (!alertEl || !msgEl) return;

  // Use textContent to prevent XSS injection
  msgEl.textContent = message;

  // Reset classes and add new type
  alertEl.className = `alert-banner ${type} show`;

  // Update Icon based on type
  const iconWrapper = alertEl.querySelector('.alert-icon');
  if (iconWrapper) {
    let iconName = 'alert-circle';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';

    iconWrapper.innerHTML = `<i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>`;
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Scroll smoothly to alert if out of view
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert(alertContainerId) {
  const alertEl = document.getElementById(alertContainerId);
  if (alertEl) {
    alertEl.className = 'alert-banner';
  }
}

// ==============================================================
// 3. Email Validation Utility
// ==============================================================
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase().trim());
}

// ==============================================================
// 4. Password Strength Evaluator (Used on Registration Page)
// ==============================================================
function evaluatePasswordStrength(password, confirmPassword = '') {
  let score = 0;
  const results = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    special: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    match: password.length > 0 && password === confirmPassword
  };

  if (results.length) score += 1;
  if (results.upper) score += 1;
  if (results.special) score += 1;
  if (password.length >= 12 && /[a-z]/.test(password) && results.upper && results.special) {
    score += 1;
  }

  return { score, results };
}

function updateStrengthUI(score, results) {
  const seg1 = document.getElementById('strengthSeg1');
  const seg2 = document.getElementById('strengthSeg2');
  const seg3 = document.getElementById('strengthSeg3');
  const seg4 = document.getElementById('strengthSeg4');
  const label = document.getElementById('strengthText');

  if (!seg1 || !label) return;

  const segments = [seg1, seg2, seg3, seg4];
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  // Reset segments
  segments.forEach(seg => {
    seg.style.backgroundColor = 'transparent';
  });

  if (score > 0) {
    const activeColor = colors[Math.min(score - 1, 3)];
    for (let i = 0; i < score && i < 4; i++) {
      segments[i].style.backgroundColor = activeColor;
    }
    label.textContent = labels[Math.min(score - 1, 3)];
    label.style.color = activeColor;
  } else {
    label.textContent = 'None';
    label.style.color = '#94a3b8';
  }

  // Update checklist items
  const updateReq = (id, isValid) => {
    const el = document.getElementById(id);
    if (el) {
      if (isValid) {
        el.classList.add('valid');
      } else {
        el.classList.remove('valid');
      }
    }
  };

  updateReq('reqLength', results.length);
  updateReq('reqUpper', results.upper);
  updateReq('reqSpecial', results.special);
  updateReq('reqMatch', results.match);
}

// ==============================================================
// 5. Initialize Page Logics
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {

  // Check URL query parameters for notifications
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('logged_out') === 'true') {
    showAlert('loginAlert', 'alertMessage', 'You have been successfully logged out.', 'info');
  } else if (urlParams.get('registered') === 'true') {
    showAlert('loginAlert', 'alertMessage', 'Account registered successfully! Please log in.', 'success');
  } else if (urlParams.get('error') === 'unauthorized') {
    showAlert('loginAlert', 'alertMessage', 'Please sign in to access the student dashboard.', 'warning');
  }

  // ------------------------------------------------------------
  // A. LOGIN PAGE LOGIC
  // ------------------------------------------------------------
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    setupPasswordToggle('toggleLoginPassword', 'loginPassword');

    // Forgot password modal handlers
    const forgotBtn = document.getElementById('forgotPassHelpBtn');
    const forgotModal = document.getElementById('forgotModal');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const dismissForgotModal = document.getElementById('dismissForgotModal');

    if (forgotBtn && forgotModal) {
      forgotBtn.addEventListener('click', () => forgotModal.classList.add('show'));
      if (closeForgotModal) closeForgotModal.addEventListener('click', () => forgotModal.classList.remove('show'));
      if (dismissForgotModal) dismissForgotModal.addEventListener('click', () => forgotModal.classList.remove('show'));
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert('loginAlert');

      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');
      const rememberMeInput = document.getElementById('rememberMe');
      const submitBtn = document.getElementById('loginSubmitBtn');
      const spinner = document.getElementById('loginSpinner');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnArrow = submitBtn.querySelector('.btn-arrow');

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

      // Reset error indicators
      document.getElementById('emailError').classList.remove('show');
      document.getElementById('passwordError').classList.remove('show');
      emailInput.classList.remove('is-invalid');
      passwordInput.classList.remove('is-invalid');

      // Validation
      let hasError = false;
      if (!validateEmail(email)) {
        document.getElementById('emailError').classList.add('show');
        emailInput.classList.add('is-invalid');
        hasError = true;
      }

      if (!password) {
        document.getElementById('passwordError').classList.add('show');
        passwordInput.classList.add('is-invalid');
        hasError = true;
      }

      if (hasError) return;

      // Loading UI State
      submitBtn.disabled = true;
      spinner.style.display = 'inline-block';
      if (btnArrow) btnArrow.style.display = 'none';
      btnText.textContent = 'Authenticating...';

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          // CRITICAL: credentials: 'include' ensures HttpOnly cookie is accepted by browser
          credentials: 'include',
          body: JSON.stringify({ email, password, rememberMe })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showAlert('loginAlert', 'alertMessage', 'Authentication successful! Redirecting...', 'success');
          btnText.textContent = 'Redirecting...';
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        } else {
          showAlert('loginAlert', 'alertMessage', data.message || 'Login failed. Please verify credentials.', 'error');
          submitBtn.disabled = false;
          spinner.style.display = 'none';
          if (btnArrow) btnArrow.style.display = 'inline-block';
          btnText.textContent = 'Sign In to EduPortal';
        }
      } catch (err) {
        showAlert(
          'loginAlert', 
          'alertMessage', 
          'Unable to reach authentication server. Please verify backend is running on port 5000.', 
          'error'
        );
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        if (btnArrow) btnArrow.style.display = 'inline-block';
        btnText.textContent = 'Sign In to EduPortal';
      }
    });
  }

  // ------------------------------------------------------------
  // B. REGISTRATION PAGE LOGIC
  // ------------------------------------------------------------
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    setupPasswordToggle('toggleRegPassword', 'regPassword');
    setupPasswordToggle('toggleRegConfirmPassword', 'regConfirmPassword');

    const regNameInput = document.getElementById('regName');
    const regEmailInput = document.getElementById('regEmail');
    const regPassInput = document.getElementById('regPassword');
    const regConfirmPassInput = document.getElementById('regConfirmPassword');

    // Real-time password strength listener
    const handlePasswordChange = () => {
      const pass = regPassInput.value;
      const confirm = regConfirmPassInput.value;
      const { score, results } = evaluatePasswordStrength(pass, confirm);
      updateStrengthUI(score, results);
    };

    regPassInput.addEventListener('input', handlePasswordChange);
    regConfirmPassInput.addEventListener('input', handlePasswordChange);

    // Form submit listener
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert('registerAlert');

      const name = regNameInput.value.trim();
      const email = regEmailInput.value.trim();
      const password = regPassInput.value;
      const confirmPassword = regConfirmPassInput.value;

      const submitBtn = document.getElementById('regSubmitBtn');
      const spinner = document.getElementById('regSpinner');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnArrow = submitBtn.querySelector('.btn-arrow');

      // Reset errors
      document.getElementById('regNameError').classList.remove('show');
      document.getElementById('regEmailError').classList.remove('show');
      document.getElementById('regConfirmPasswordError').classList.remove('show');
      regNameInput.classList.remove('is-invalid');
      regEmailInput.classList.remove('is-invalid');
      regConfirmPassInput.classList.remove('is-invalid');

      let hasError = false;

      if (name.length < 2) {
        document.getElementById('regNameError').classList.add('show');
        regNameInput.classList.add('is-invalid');
        hasError = true;
      }

      if (!validateEmail(email)) {
        document.getElementById('regEmailError').classList.add('show');
        regEmailInput.classList.add('is-invalid');
        hasError = true;
      }

      const { results } = evaluatePasswordStrength(password, confirmPassword);
      if (!results.length || !results.upper || !results.special) {
        showAlert('registerAlert', 'registerAlertMessage', 'Please meet all password requirements before proceeding.', 'error');
        hasError = true;
      }

      if (password !== confirmPassword) {
        document.getElementById('regConfirmPasswordError').classList.add('show');
        regConfirmPassInput.classList.add('is-invalid');
        hasError = true;
      }

      if (hasError) return;

      // Loading state
      submitBtn.disabled = true;
      spinner.style.display = 'inline-block';
      if (btnArrow) btnArrow.style.display = 'none';
      btnText.textContent = 'Registering Account...';

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ name, email, password, confirmPassword })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showAlert(
            'registerAlert', 
            'registerAlertMessage', 
            'Account created successfully! Redirecting to login...', 
            'success'
          );
          btnText.textContent = 'Redirecting...';
          setTimeout(() => {
            window.location.href = 'index.html?registered=true';
          }, 1500);
        } else {
          showAlert(
            'registerAlert', 
            'registerAlertMessage', 
            data.message || 'Registration failed. Please check your details.', 
            'error'
          );
          submitBtn.disabled = false;
          spinner.style.display = 'none';
          if (btnArrow) btnArrow.style.display = 'inline-block';
          btnText.textContent = 'Create Student Account';
        }
      } catch (err) {
        showAlert(
          'registerAlert', 
          'registerAlertMessage', 
          'Unable to reach backend server. Please check your network connection and server status.', 
          'error'
        );
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        if (btnArrow) btnArrow.style.display = 'inline-block';
        btnText.textContent = 'Create Student Account';
      }
    });
  }

});
