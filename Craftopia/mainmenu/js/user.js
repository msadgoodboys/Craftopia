// user.js for Craftopia public user profile page (view-only, tabbed layout)

document.addEventListener('DOMContentLoaded', async function() {
  const copyright = document.getElementById('copyright');
  if (copyright) {
    copyright.textContent = `© ${new Date().getFullYear()} Craftopia. All rights reserved.`;
  }

  // Tab logic
  const tabButtons = document.querySelectorAll('.profile-tab');
  const tabContents = {
    profile: document.getElementById('profile-tab-content'),
    projects: document.getElementById('projects-tab-content'),
  };
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.keys(tabContents).forEach(key => {
        tabContents[key].style.display = (btn.dataset.tab === key) ? '' : 'none';
      });
      window.location.hash = btn.dataset.tab;
    });
  });
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

  // Get user id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  if (!userId) {
    document.getElementById('profile-username').textContent = 'User not found';
    document.getElementById('profile-info-card').style.display = 'none';
    document.getElementById('profile-empty-card').style.display = '';
    return;
  }

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username,avatar_url,about,location,created_at')
    .eq('id', userId)
    .single();
  if (error || !profile) {
    document.getElementById('profile-username').textContent = 'User not found';
    document.getElementById('profile-info-card').style.display = 'none';
    document.getElementById('profile-empty-card').style.display = '';
    return;
  }
  // Fill profile header
  document.getElementById('profile-avatar').src = profile.avatar_url || 'assets/logo.png';
  document.getElementById('profile-username').textContent = profile.username || 'User';
  document.getElementById('profile-date-joined').textContent = profile.created_at ? 'Joined: ' + new Date(profile.created_at).toLocaleDateString() : '';
  // Fill profile tab
  const location = profile.location || '';
  const about = profile.about || '';
  if ((location && location.trim()) || (about && about.trim())) {
    document.getElementById('profile-location').innerHTML = location ? `<span style='font-weight:700;'>Location:</span> <span style='color:#e75480;'>${location}</span>` : '';
    document.getElementById('profile-about').textContent = about ? about : '';
    document.getElementById('profile-info-card').style.display = '';
    document.getElementById('profile-empty-card').style.display = 'none';
  } else {
    document.getElementById('profile-info-card').style.display = 'none';
    document.getElementById('profile-empty-card').style.display = '';
  }

  // Fetch user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  const projectsList = document.getElementById('projects-list');
  const projectsEmpty = document.getElementById('projects-empty');
  projectsList.innerHTML = '';
  if (projects && projects.length) {
    projectsEmpty.style.display = 'none';
    projects.forEach(p => {
      let mediaUrls = p.media_urls;
      if (typeof mediaUrls === 'string') {
        try { mediaUrls = JSON.parse(mediaUrls); } catch { mediaUrls = []; }
      }
      if (!Array.isArray(mediaUrls)) mediaUrls = [];
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
}); 