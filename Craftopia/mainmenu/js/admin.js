// admin.js for Craftopia Admin Dashboard

document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('admin-status');
  const projectsTableElem = document.getElementById('projects-table');
  const projectsTable = projectsTableElem ? projectsTableElem.querySelector('tbody') : null;
  const usersTableElem = document.getElementById('users-table');
  const usersTable = usersTableElem ? usersTableElem.querySelector('tbody') : null;
  const logoutLink = document.getElementById('logout-link');
  const copyright = document.getElementById('copyright');
  if (copyright) {
    copyright.textContent = `© ${new Date().getFullYear()} Craftopia. All rights reserved.`;
  }

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Access denied. Admins only.');
    window.location.href = 'index.html';
    return;
  }
  // Check admin flag in profiles table
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (profileErr || !profile || !profile.is_admin) {
    alert('Access denied. Admins only.');
    window.location.href = 'index.html';
    return;
  }

  // Logout
  logoutLink.onclick = async (e) => {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  };

  // Fetch projects
  statusDiv.textContent = 'Loading projects and users...';
  const { data: projects, error: projErr } = await supabase.from('projects').select('*');
  if (projErr) {
    statusDiv.textContent = 'Error loading projects.';
    return;
  }
  if (projectsTable) {
    projectsTable.innerHTML = '';
    projects.forEach(p => {
      let mediaUrls = p.media_urls;
      if (typeof mediaUrls === 'string') {
        try { mediaUrls = JSON.parse(mediaUrls); } catch { mediaUrls = []; }
      }
      if (!Array.isArray(mediaUrls)) mediaUrls = [];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.title}</td><td>${p.category}</td><td>${p.creator_name || p.user_id}</td><td>${mediaUrls.map(url => `<a href='${url}' target='_blank'>Media</a>`).join(', ')}</td>`;
      projectsTable.appendChild(tr);
    });
  }

  // Fetch users
  const { data: users, error: userErr } = await supabase.from('users').select('*');
  if (usersTable) {
    usersTable.innerHTML = '';
    if (!userErr && users) {
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${u.email || u.id}</td><td>${u.id}</td>`;
        usersTable.appendChild(tr);
      });
    } else {
      usersTable.innerHTML = '<tr><td colspan="2">Error loading users.</td></tr>';
    }
  }
  statusDiv.textContent = '';
}); 