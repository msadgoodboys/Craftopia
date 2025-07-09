document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const copyright = document.getElementById('copyright');
  if (copyright) {
    copyright.textContent = `© ${new Date().getFullYear()} Craftopia. All rights reserved.`;
  }

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      loginError.textContent = '';
      const email = loginEmail.value.trim();
      const password = loginPassword.value;
      if (!email || !password) {
        loginError.textContent = 'Please enter both email and password.';
        return;
      }
      try {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          loginError.textContent = error.message;
        } else if (!data.user.email_confirmed_at) {
          loginError.textContent = 'Please confirm your email via the link sent to your Gmail.';
        } else {
          window.location.href = 'index.html';
        }
      } catch (err) {
        if (err.message && err.message.includes('NetworkError')) {
          loginError.textContent = 'Network error: Please check your connection and try again.';
        } else {
          loginError.textContent = 'Error: ' + (err.message || JSON.stringify(err));
        }
      }
    };
  }

  // --- Craftopia Logo Navigation ---
  const logoDiv = document.querySelector('.logo');
  if (logoDiv) {
    logoDiv.style.cursor = 'pointer';
    logoDiv.addEventListener('click', async (e) => {
      e.preventDefault();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email_confirmed_at) {
        window.location.href = 'index.html';
      } else {
        window.location.href = 'login.html';
      }
    });
  }
}); 