// Profile menu logic for header

document.addEventListener('DOMContentLoaded', async function() {
  const avatar = document.getElementById('header-profile-avatar');
  const menuContainer = document.querySelector('.profile-menu-container');
  const dropdown = document.getElementById('profile-dropdown');
  const logoutBtn = document.getElementById('menu-logout');
  const userEmail = document.getElementById('user-email');

  // Cache user info
  let cachedUser = null;
  if (window.supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    cachedUser = user;
  }

  // Always show avatar and menu for any logged-in user
  if (window.supabase && avatar) {
    if (cachedUser) {
      // Fetch avatar_url from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', cachedUser.id)
        .single();
      if (profile && profile.avatar_url) {
        avatar.src = profile.avatar_url;
      } else {
        avatar.src = 'assets/logo.png';
      }
      avatar.style.display = '';
      menuContainer.style.display = '';
    } else {
      avatar.src = 'assets/logo.png';
      avatar.style.display = 'none';
      menuContainer.style.display = 'none';
    }
  }

  // Set email from Supabase
  if (userEmail && cachedUser && cachedUser.email) {
    userEmail.textContent = cachedUser.email;
  }

  // Toggle dropdown
  if (avatar) {
    avatar.addEventListener('click', function(e) {
      e.stopPropagation();
      menuContainer.classList.toggle('active');
    });
  }
  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    if (!menuContainer.contains(e.target)) {
      menuContainer.classList.remove('active');
    }
  });
  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'login.html';
      if (window.supabase && supabase.auth) {
        supabase.auth.signOut();
      }
    });
  }
  // Menu links: just close menu (navigation is via href)
  if (dropdown) {
    dropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menuContainer.classList.remove('active');
      });
    });
  }
}); 