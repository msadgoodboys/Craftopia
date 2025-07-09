document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const signupError = document.getElementById('signup-error');
  const copyright = document.getElementById('copyright');
  if (copyright) {
    copyright.textContent = `© ${new Date().getFullYear()} Craftopia. All rights reserved.`;
  }

  if (signupForm) {
    signupForm.onsubmit = async (e) => {
      e.preventDefault();
      signupError.textContent = '';
      const email = signupEmail.value.trim();
      const password = signupPassword.value;
      if (!email || !password) {
        signupError.textContent = 'Please enter both email and password.';
        return;
      }
      try {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          signupError.textContent = error.message;
        } else {
          signupError.textContent = 'Signup successful! Please check your Gmail and confirm your email.';
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000); // Wait 2 seconds before redirecting
        }
      } catch (err) {
        if (err.message && err.message.includes('NetworkError')) {
          signupError.textContent = 'Network error: Please check your connection and try again.';
        } else {
          signupError.textContent = 'Error: ' + (err.message || JSON.stringify(err));
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
        window.location.href = 'signup.html';
      }
    });
  }
}); 