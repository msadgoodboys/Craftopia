// main.js for Craftopia homepage interactivity
// Email/password only, pastel pink/white theme, live Supabase data

document.addEventListener('DOMContentLoaded', async () => {
  // Email Auth Modal
  const emailAuthModal = document.getElementById('email-auth-modal');
  const closeEmailAuth = document.getElementById('close-email-auth');
  const authForm = document.getElementById('auth-form');
  const authEmail = document.getElementById('auth-email');
  const authPassword = document.getElementById('auth-password');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authError = document.getElementById('auth-error');
  const authModalTitle = document.getElementById('auth-modal-title');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToLogin = document.getElementById('switch-to-login');

  // Copyright year
  const copyright = document.getElementById('copyright');
  if (copyright) {
    copyright.textContent = `© ${new Date().getFullYear()} Craftopia. All rights reserved.`;
  }

  // Modal helpers
  function showModal(modal) { modal.style.display = 'flex'; }
  function hideModal(modal) { modal.style.display = 'none'; }

  // Auth modal state
  let isLogin = true;
  function setAuthMode(loginMode) {
    isLogin = loginMode;
    if (isLogin) {
      authModalTitle.textContent = 'Sign in to Craftopia';
      authSubmitBtn.textContent = 'Login';
      switchToSignup.style.display = '';
      switchToLogin.style.display = 'none';
    } else {
      authModalTitle.textContent = 'Sign up for Craftopia';
      authSubmitBtn.textContent = 'Sign Up';
      switchToSignup.style.display = 'none';
      switchToLogin.style.display = '';
    }
    authError.textContent = '';
    authForm.reset();
  }

  // Show/hide modal
  // loginLink.onclick = (e) => { e.preventDefault(); setAuthMode(true); showModal(emailAuthModal); };
  closeEmailAuth && (closeEmailAuth.onclick = () => hideModal(emailAuthModal));
  showSignup && (showSignup.onclick = (e) => { e.preventDefault(); setAuthMode(false); });
  showLogin && (showLogin.onclick = (e => { e.preventDefault(); setAuthMode(true); }));
  window.onclick = (e) => { if (emailAuthModal && e.target === emailAuthModal) hideModal(emailAuthModal); };

  // Auth state
  // async function updateNav() {
  //   const { data: { user } } = await supabase.auth.getUser();
  //   if (user && user.email_confirmed_at) {
  //     loginLink.style.display = 'none';
  //     if (signupLink) signupLink.style.display = 'none';
  //     profileLink.style.display = '';
  //     logoutLink.style.display = '';
  //     userEmail.textContent = user.email;
  //     if (user.user_metadata && user.user_metadata.avatar_url) {
  //       userAvatar.src = user.user_metadata.avatar_url;
  //       userAvatar.style.display = '';
  //     } else {
  //       userAvatar.style.display = 'none';
  //     }
  //   } else {
  //     loginLink.style.display = '';
  //     if (signupLink) signupLink.style.display = '';
  //     profileLink.style.display = 'none';
  //     logoutLink.style.display = 'none';
  //     userAvatar.style.display = 'none';
  //     userEmail.textContent = '';
  //   }
  //   // Always re-attach the logout handler
  //   if (logoutLink) {
  //     logoutLink.onclick = async (e) => {
  //       e.preventDefault();
  //       console.log("Logout clicked");
  //       let signedOut = false;
  //       try {
  //         await Promise.race([
  //           supabase.auth.signOut().then(() => { signedOut = true; }),
  //           new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
  //         ]);
  //       } catch (err) {
  //         console.error("Sign out error or timeout:", err);
  //       }
  //       if (!signedOut) {
  //         console.warn("Proceeding with redirect even though signOut did not complete.");
  //       }
  //       window.location.href = "index.html";
  //     };
  //   }
  // }
  // Show loading state in nav (optional)
  // loginLink.style.display = 'none';
  // if (signupLink) signupLink.style.display = 'none';
  // profileLink.style.display = 'none';
  // logoutLink.style.display = 'none';

  // Wait for Supabase session restoration
  // const { data: { session } } = await supabase.auth.getSession();
  // await updateNav(); // Now update nav after session is ready

  // Listen for auth state changes
  // supabase.auth.onAuthStateChange(updateNav);

  // Auth form submit (guarded)
  if (authForm && authEmail && authPassword && authSubmitBtn && authError) {
    authForm.onsubmit = async (e) => {
      e.preventDefault();
      authError.textContent = '';
      const email = authEmail.value;
      const password = authPassword.value;
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          authError.textContent = error.message;
        } else if (!data.user.email_confirmed_at) {
          authError.textContent = 'Please confirm your email via the link sent to your Gmail.';
        } else {
          hideModal(emailAuthModal);
          // updateNav(); // Ensure nav updates after login
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          authError.textContent = error.message;
        } else {
          authError.textContent = 'Signup successful! Please check your Gmail and confirm your email.';
        }
      }
    };
  }

  // Filtering, sorting, and search logic (live Supabase data)
  let currentCategory = 'all';
  let currentSort = 'latest';
  let searchQuery = '';
  let allProjects = [];
  const grid = document.getElementById('projects-grid');

  async function fetchProjects() {
    grid.innerHTML = '<div class="loading-indicator" style="grid-column: 1/-1; text-align:center; color:#e75480;"><span class="spinner"></span> Loading projects...</div>';
    const { data, error } = await supabase.from('projects').select('*').order('id', { ascending: false });
    if (error) {
      console.error('Supabase error loading projects:', error);
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#d32f2f;">Error loading projects.</p>';
      return;
    }
    allProjects = data || [];
    // Parse media_urls if needed
    allProjects.forEach(p => {
      if (typeof p.media_urls === 'string') {
        try { p.media_urls = JSON.parse(p.media_urls); } catch { p.media_urls = []; }
      }
      if (!Array.isArray(p.media_urls)) {
        p.media_urls = [];
      }
    });
    // Fetch all unique user_ids
    const userIds = [...new Set(allProjects.map(p => p.user_id).filter(Boolean))];
    let avatarMap = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);
      if (profiles) {
        profiles.forEach(profile => {
          avatarMap[profile.id] = profile.avatar_url || 'assets/logo.png';
        });
      }
    }
    // Fetch live counts for each project
    await Promise.all(allProjects.map(async (project) => {
      // Likes count
      const { count: likesCount } = await supabase
        .from('project_likes')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);
      project.likes_count = likesCount || 0;
      // Comments count
      const { count: commentsCount } = await supabase
        .from('project_comments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id);
      project.comments_count = commentsCount || 0;
    }));
    console.log('All projects loaded:', allProjects);
    // Pass avatarMap to renderProjects
    filterAndRender(avatarMap);
  }

  function renderProjects(projects, avatarMap = {}) {
    grid.innerHTML = '';
    if (projects.length === 0) {
      grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#b48a99;">No projects found.</p>';
      return;
    }
    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card';
      // Carousel logic
      let mediaUrls = Array.isArray(project.media_urls) ? project.media_urls : [];
      if (typeof project.media_urls === 'string') {
        try { mediaUrls = JSON.parse(project.media_urls); } catch { mediaUrls = []; }
      }
      let carouselHtml = '';
      if (mediaUrls.length > 1) {
        carouselHtml = `
          <div class="carousel-container">
            <button class="carousel-arrow left" style="display:none">&#8592;</button>
            <img src="${mediaUrls[0]}" alt="Project Image" class="carousel-img">
            <button class="carousel-arrow right">&#8594;</button>
          </div>
        `;
      } else {
        const thumb = (mediaUrls[0]) ? mediaUrls[0] : 'assets/sample1.jpg';
        carouselHtml = `<img src="${thumb}" alt="Project Thumbnail" class="carousel-img">`;
      }
      const creator = project.creator_name || 'Anonymous';
      const avatarUrl = (avatarMap && avatarMap[project.user_id]) ? avatarMap[project.user_id] : 'assets/logo.png';
      card.innerHTML = `
        <a href="project.html?id=${project.id}" class="project-link" style="text-decoration:none;color:inherit;display:block;">
          ${carouselHtml}
          <div class="project-info">
            <h3>${project.title}</h3>
            <div class="creator">
              <img src="${avatarUrl}" alt="Creator Avatar">
              <span>${creator}</span>
            </div>
            <p>${project.description}</p>
            <div class="project-meta">
              <span class="likes">❤️ ${project.likes_count || 0}</span>
              <span class="comments">💬 ${project.comments_count || 0}</span>
            </div>
          </div>
        </a>
      `;
      // Carousel JS logic
      if (mediaUrls.length > 1) {
        const leftBtn = card.querySelector('.carousel-arrow.left');
        const rightBtn = card.querySelector('.carousel-arrow.right');
        const img = card.querySelector('.carousel-img');
        let idx = 0;
        leftBtn.onclick = (e) => {
          e.preventDefault();
          idx = (idx - 1 + mediaUrls.length) % mediaUrls.length;
          img.src = mediaUrls[idx];
          leftBtn.style.display = idx === 0 ? 'none' : '';
          rightBtn.style.display = idx === mediaUrls.length - 1 ? 'none' : '';
        };
        rightBtn.onclick = (e) => {
          e.preventDefault();
          idx = (idx + 1) % mediaUrls.length;
          img.src = mediaUrls[idx];
          leftBtn.style.display = idx === 0 ? 'none' : '';
          rightBtn.style.display = idx === mediaUrls.length - 1 ? 'none' : '';
        };
        leftBtn.style.display = 'none';
        rightBtn.style.display = mediaUrls.length > 1 ? '' : 'none';
      }
      grid.appendChild(card);
    });
  }

  function filterAndRender(avatarMap = {}) {
    let filtered = [...allProjects];
    if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(searchQuery)) ||
        (p.description && p.description.toLowerCase().includes(searchQuery)) ||
        (p.creator_name && p.creator_name.toLowerCase().includes(searchQuery))
      );
    }
    if (currentSort === 'latest') {
      filtered = filtered.sort((a, b) => b.id - a.id);
    } else if (currentSort === 'popular') {
      filtered = filtered.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (currentSort === 'random') {
      filtered = filtered.sort(() => Math.random() - 0.5);
    }
    renderProjects(filtered, avatarMap);
  }

  // Attach event listeners with debug logs
  document.getElementById('search-bar').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    console.log('Search input:', searchQuery);
    filterAndRender();
  });
  document.querySelectorAll('.category-tab').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentCategory = this.dataset.category;
      console.log('Category selected:', currentCategory);
      filterAndRender();
    };
    console.log('Category button attached:', btn.textContent);
  });
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.onclick = function() {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSort = this.dataset.sort;
      console.log('Sort selected:', currentSort);
      filterAndRender();
    };
    console.log('Sort button attached:', btn.textContent);
  });

  fetchProjects();

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

  // Floating upload button logic
  const floatingUploadBtn = document.getElementById('floating-upload-btn');
  if (floatingUploadBtn) {
    floatingUploadBtn.addEventListener('click', () => {
      window.location.href = 'upload.html';
    });
  } else {
    // Only log, do not alert
    console.warn('Floating upload button not found!');
  }
});
// TODO: Implement search, filter, sort, and authentication nav logic 