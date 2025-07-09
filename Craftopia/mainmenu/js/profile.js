// profile.js for Craftopia profile page

document.addEventListener('DOMContentLoaded', async function() {
  // Set copyright year
  const copyright = document.getElementById('copyright');
  if (copyright) {
    copyright.textContent = `© ${new Date().getFullYear()} Craftopia. All rights reserved.`;
  }

  // Nav links
  const loginLink = document.getElementById('login-link');
  const signupLink = document.getElementById('signup-link');
  const profileLink = document.getElementById('profile-link');
  const logoutLink = document.getElementById('logout-link');
  const projectsLink = document.getElementById('projects-link');

  // Show loading state in nav (optional)
  if (loginLink) loginLink.style.display = 'none';
  if (signupLink) signupLink.style.display = 'none';
  if (profileLink) profileLink.style.display = 'none';
  if (logoutLink) logoutLink.style.display = 'none';
  if (projectsLink) projectsLink.style.display = '';

  // Wait for Supabase session restoration
  const { data: { session } } = await supabase.auth.getSession();
  await updateNav(); // Now update nav after session is ready

  // Listen for auth state changes
  supabase.auth.onAuthStateChange(updateNav);

  async function updateNav() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email_confirmed_at) {
      if (loginLink) loginLink.style.display = 'none';
      if (signupLink) signupLink.style.display = 'none';
      if (profileLink) profileLink.style.display = '';
      if (logoutLink) logoutLink.style.display = '';
      if (projectsLink) projectsLink.style.display = '';
    } else {
      if (loginLink) loginLink.style.display = '';
      if (signupLink) signupLink.style.display = '';
      if (profileLink) profileLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'none';
      if (projectsLink) projectsLink.style.display = '';
    }
    // Always re-attach the logout handler
    if (logoutLink) {
      logoutLink.onclick = async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.href = 'login.html';
      };
    }
  }

  // --- Tab switching logic ---
  const tabButtons = document.querySelectorAll('.profile-tab');
  const tabContents = {
    profile: document.getElementById('profile-tab-content'),
    projects: document.getElementById('projects-tab-content'),
    favorites: document.getElementById('favorites-tab-content'),
    settings: document.getElementById('settings-tab-content'),
  };
  // Always allow tab switching
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.keys(tabContents).forEach(key => {
        tabContents[key].style.display = (btn.dataset.tab === key) ? '' : 'none';
      });
      // Update URL hash for direct linking
      window.location.hash = btn.dataset.tab;
    });
  });
  // Switch tab by hash on load or hashchange
  function switchTabByHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && tabContents[hash]) {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelector(`.profile-tab[data-tab="${hash}"]`).classList.add('active');
      Object.keys(tabContents).forEach(key => {
        tabContents[key].style.display = (hash === key) ? '' : 'none';
      });
    }
  }
  switchTabByHash();
  window.addEventListener('hashchange', switchTabByHash);

  // --- Profile header info ---
  const usernameElem = document.getElementById('profile-username');
  const dateJoinedElem = document.getElementById('profile-date-joined');
  const avatarElem = document.getElementById('profile-avatar');
  const usernameInput = document.getElementById('edit-username');
  const saveUsernameBtn = document.getElementById('save-username-btn');
  const newPasswordInput = document.getElementById('new-password');
  const updatePasswordBtn = document.getElementById('update-password-btn');
  const settingsStatus = document.getElementById('settings-status');

  // Load and display user info
  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Fetch avatar_url, username, location, about from profiles table
    let avatarUrl = 'assets/logo.png';
    let username = 'Username';
    let location = '';
    let about = '';
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, location, about')
      .eq('id', user.id)
      .single();
    if (profile && profile.avatar_url) avatarUrl = profile.avatar_url;
    if (profile && profile.username) username = profile.username;
    if (profile && profile.location) location = profile.location;
    if (profile && profile.about) about = profile.about;
    if (avatarElem && avatarUrl) avatarElem.src = avatarUrl;
    if (usernameElem) usernameElem.textContent = username;
    if (usernameInput) usernameInput.value = username;
    // Show join date in header
    if (dateJoinedElem && user) {
      dateJoinedElem.textContent = user.created_at
        ? 'Joined: ' + new Date(user.created_at).toLocaleDateString()
        : 'Joined: --/--/----';
    }
    // Pre-fill modal fields if open
    if (document.getElementById('modal-location')) document.getElementById('modal-location').value = location;
    if (document.getElementById('modal-about')) document.getElementById('modal-about').value = about;
    if (document.getElementById('modal-avatar')) document.getElementById('modal-avatar').src = avatarUrl;
    // Update Profile tab display
    const profileLocation = document.getElementById('profile-location');
    const profileAbout = document.getElementById('profile-about');
    const profileInfoCard = document.getElementById('profile-info-card');
    const profileEmptyCard = document.getElementById('profile-empty-card');
    if ((location && location.trim()) || (about && about.trim())) {
      if (profileLocation) profileLocation.innerHTML = location ? `<span style='font-weight:700;'>Location:</span> <span style='color:#e75480;'>${location}</span>` : '';
      if (profileAbout) profileAbout.textContent = about ? about : '';
      if (profileInfoCard) profileInfoCard.style.display = '';
      if (profileEmptyCard) profileEmptyCard.style.display = 'none';
    } else {
      if (profileInfoCard) profileInfoCard.style.display = 'none';
      if (profileEmptyCard) profileEmptyCard.style.display = '';
    }
  }
  await loadProfile();

  // --- Modal logic for editing profile ---
  const editProfileModal = document.getElementById('edit-profile-modal');
  const openEditProfileBtn = document.getElementById('open-edit-profile-modal');
  const closeEditProfileBtn = document.getElementById('close-edit-profile-modal');
  const cancelEditProfileBtn = document.getElementById('cancel-edit-profile');
  const editProfileForm = document.getElementById('edit-profile-form');
  const modalAvatar = document.getElementById('modal-avatar');
  const modalAvatarUpload = document.getElementById('modal-avatar-upload');
  const modalLocation = document.getElementById('modal-location');
  const modalAbout = document.getElementById('modal-about');
  const modalStatus = document.getElementById('modal-status');

  let modalAvatarUrl = '';

  function openEditProfileModal() {
    editProfileModal.classList.add('active');
    modalStatus.textContent = '';
    // Load current profile info
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, location, about')
        .eq('id', user.id)
        .single();
      modalAvatarUrl = (profile && profile.avatar_url) ? profile.avatar_url : 'assets/logo.png';
      modalAvatar.src = modalAvatarUrl;
      modalLocation.value = (profile && profile.location) ? profile.location : '';
      modalAbout.value = (profile && profile.about) ? profile.about : '';
    });
  }
  function closeEditProfileModal() {
    editProfileModal.classList.remove('active');
    modalStatus.textContent = '';
    modalAvatarUpload.value = '';
  }
  if (openEditProfileBtn) openEditProfileBtn.onclick = openEditProfileModal;
  if (closeEditProfileBtn) closeEditProfileBtn.onclick = closeEditProfileModal;
  if (cancelEditProfileBtn) cancelEditProfileBtn.onclick = closeEditProfileModal;

  // Avatar upload in modal
  if (modalAvatarUpload) {
    modalAvatarUpload.onchange = async function() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !modalAvatarUpload.files[0]) return;
      modalStatus.textContent = 'Uploading photo...';
      const file = modalAvatarUpload.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      let { error: uploadError } = await supabase.storage.from('profile-pics').upload(filePath, file, { upsert: true });
      if (uploadError) {
        modalStatus.textContent = 'Upload failed: ' + uploadError.message;
        return;
      }
      const { data } = supabase.storage.from('profile-pics').getPublicUrl(filePath);
      modalAvatarUrl = data.publicUrl;
      modalAvatar.src = modalAvatarUrl;
      modalStatus.textContent = 'Photo uploaded!';
    };
  }

  // Save profile info from modal
  if (editProfileForm) {
    editProfileForm.onsubmit = async function(e) {
      e.preventDefault();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      modalStatus.textContent = 'Saving...';
      // Fetch current username to always include it in the update
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      const updates = {
        id: user.id,
        avatar_url: modalAvatarUrl,
        location: modalLocation.value.trim(),
        about: modalAbout.value.trim(),
        username: profile?.username || '' // Always include username
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) {
        modalStatus.textContent = 'Failed to save: ' + error.message;
        return;
      }
      modalStatus.textContent = 'Profile updated!';
      setTimeout(() => {
        closeEditProfileModal();
        loadProfile();
      }, 800);
    };
  }

  // --- Username change (Settings tab) ---
  if (saveUsernameBtn && usernameInput) {
    saveUsernameBtn.onclick = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const username = usernameInput.value.trim();
      if (!username) {
        settingsStatus.textContent = 'Username cannot be empty.';
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username });
      if (error) {
        settingsStatus.textContent = 'Error saving username: ' + error.message;
      } else {
        settingsStatus.textContent = 'Username updated!';
        await loadProfile();
      }
    };
  }

  // --- Password change (Settings tab) ---
  if (updatePasswordBtn && newPasswordInput) {
    updatePasswordBtn.onclick = async () => {
      settingsStatus.textContent = '';
      const newPassword = newPasswordInput.value.trim();
      if (newPassword.length < 6) {
        settingsStatus.textContent = 'Password must be at least 6 characters.';
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        settingsStatus.textContent = 'Error: ' + error.message;
      } else {
        settingsStatus.textContent = 'Password updated successfully!';
        newPasswordInput.value = '';
      }
    };
  }

  // --- Load Projects and Favorites ---
  async function loadProjectsAndFavorites() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (projectsError) {
      console.error('Error loading projects:', projectsError);
    }
    const projectsList = document.getElementById('projects-list');
    const projectsEmpty = document.getElementById('projects-empty');
    projectsList.innerHTML = '';
    if (projects && projects.length) {
      projectsEmpty.style.display = 'none';
      projects.forEach(p => {
        // Ensure media_urls is an array
        let mediaUrls = p.media_urls;
        if (typeof mediaUrls === 'string') {
          try { mediaUrls = JSON.parse(mediaUrls); } catch { mediaUrls = []; }
        }
        const li = document.createElement('li');
        li.className = 'project-card';
        li.onclick = () => window.location.href = `project.html?id=${p.id}`;
        li.innerHTML = `
          <img src="${(mediaUrls && mediaUrls[0]) ? mediaUrls[0] : 'assets/sample1.jpg'}" class="project-thumb" alt="Project Thumbnail">
          <div class="project-info">
            <div class="project-title">${p.title}</div>
            <div class="project-meta">${p.category || ''} &middot; ${new Date(p.created_at).toLocaleDateString()}</div>
          </div>
        `;
        projectsList.appendChild(li);
      });
    } else {
      projectsEmpty.style.display = '';
    }
    // Favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('project_favorites')
      .select('project_id')
      .eq('user_id', user.id);
    if (favoritesError) {
      console.error('Error loading favorites:', favoritesError);
    }
    const favoriteIds = (favorites || []).map(f => f.project_id);
    let favoriteProjects = [];
    if (favoriteIds.length) {
      const { data: favProjects, error: favProjectsError } = await supabase
        .from('projects')
        .select('*')
        .in('id', favoriteIds);
      if (favProjectsError) {
        console.error('Error loading favorite projects:', favProjectsError);
      }
      favoriteProjects = favProjects || [];
    }
    const favoritesList = document.getElementById('favorites-list');
    const favoritesEmpty = document.getElementById('favorites-empty');
    favoritesList.innerHTML = '';
    if (favoriteProjects.length) {
      favoritesEmpty.style.display = 'none';
      favoriteProjects.forEach(p => {
        // Ensure media_urls is an array
        let mediaUrls = p.media_urls;
        if (typeof mediaUrls === 'string') {
          try { mediaUrls = JSON.parse(mediaUrls); } catch { mediaUrls = []; }
        }
        const li = document.createElement('li');
        li.className = 'favorite-card';
        li.onclick = () => window.location.href = `project.html?id=${p.id}`;
        li.innerHTML = `
          <img src="${(mediaUrls && mediaUrls[0]) ? mediaUrls[0] : 'assets/sample1.jpg'}" class="favorite-thumb" alt="Project Thumbnail">
          <div class="favorite-info">
            <div class="favorite-title">${p.title}</div>
            <div class="favorite-meta">${p.category || ''} &middot; ${new Date(p.created_at).toLocaleDateString()}</div>
          </div>
        `;
        favoritesList.appendChild(li);
      });
    } else {
      favoritesEmpty.style.display = '';
    }
  }

  // Load projects/favorites when switching to those tabs
  const projectsTabBtn = document.querySelector('.profile-tab[data-tab="projects"]');
  const favoritesTabBtn = document.querySelector('.profile-tab[data-tab="favorites"]');
  if (projectsTabBtn) {
    projectsTabBtn.addEventListener('click', function() {
      loadProjectsAndFavorites();
    });
  }
  if (favoritesTabBtn) {
    favoritesTabBtn.addEventListener('click', function() {
      loadProjectsAndFavorites();
    });
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

  // Make Edit Profile button open the modal
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'edit-profile-btn') {
      openEditProfileModal();
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('open-edit-profile-modal');
  if (btn) {
    btn.onclick = function() { alert('Button works!'); };
  }
});