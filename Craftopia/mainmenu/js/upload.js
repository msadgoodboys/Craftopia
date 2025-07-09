// upload.js for Craftopia upload page
// TODO: Implement auth check, form submission, and Supabase upload logic 

document.addEventListener('DOMContentLoaded', async () => {
  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const container = document.getElementById('upload-form')?.parentElement || document.body;
    container.innerHTML = `
      <div style="max-width:420px;margin:80px auto;padding:36px 28px;background:#fff6fa;border-radius:18px;box-shadow:0 4px 24px rgba(231,166,182,0.13);text-align:center;">
        <h2 style="color:#e75480;font-size:2rem;font-weight:800;margin-bottom:18px;">You must be logged in to upload a project.</h2>
        <button id="go-login-btn" style="background:#e75480;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1.15rem;font-weight:700;cursor:pointer;">Log In</button>
      </div>
    `;
    document.getElementById('go-login-btn').onclick = () => window.location.href = 'login.html';
    return;
  }

  const form = document.getElementById('upload-form');
  const statusDiv = document.getElementById('upload-status');

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      statusDiv.textContent = '';
      const title = document.getElementById('title').value.trim();
      const description = document.getElementById('description').value.trim();
      const category = document.getElementById('category').value;
      const files = document.getElementById('media').files;
      if (!title || !description || !category) {
        statusDiv.textContent = 'Please fill in all required fields.';
        return;
      }
      if (!files.length) {
        statusDiv.textContent = 'Please select at least one image or video.';
        return;
      }
      // Validate file types and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm', 'video/ogg'];
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) {
          statusDiv.textContent = 'Only images (jpg, png, gif, webp) and videos (mp4, webm, ogg) are allowed.';
          return;
        }
        if (file.size > maxFileSize) {
          statusDiv.textContent = `File "${file.name}" is too large. Max size is 10MB.`;
          return;
        }
      }
      statusDiv.textContent = 'Uploading...';
      statusDiv.innerHTML = '<span class="spinner"></span> Uploading...';
      try {
        // Upload files to Supabase Storage
        const mediaUrls = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const filePath = `${user.id}/${Date.now()}_${file.name}`;
          let { error: uploadError } = await supabase.storage.from('project-media').upload(filePath, file);
          if (uploadError) {
            statusDiv.textContent = 'Upload failed: ' + uploadError.message;
            return;
          }
          const { data } = supabase.storage.from('project-media').getPublicUrl(filePath);
          mediaUrls.push(data.publicUrl);
        }
        // Fetch username from profiles table
        let creatorName = user.email;
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile && profile.username) {
          creatorName = profile.username;
        }
        // Prepare project data and log for debugging
        const projectData = {
          title,
          description,
          category,
          media_urls: mediaUrls,
          user_id: user.id, // Explicitly set user_id
          creator_name: creatorName,
        };
        if (!user.id) {
          statusDiv.textContent = 'Error: user_id is missing. Please log in again.';
          return;
        }
        // Save project metadata to Supabase Database
        const { error: dbError } = await supabase.from('projects').insert([projectData]);
        if (dbError) {
          statusDiv.textContent = 'Database error: ' + dbError.message;
          return;
        }
        statusDiv.textContent = 'Project uploaded successfully!';
        statusDiv.innerHTML = '<span style="color:green;">Project uploaded successfully!</span>';
        form.reset();
      } catch (err) {
        if (err.message && err.message.includes('NetworkError')) {
          statusDiv.textContent = 'Network error: Please check your connection and try again.';
        } else {
          statusDiv.textContent = 'Error: ' + (err.message || JSON.stringify(err));
          statusDiv.innerHTML = '<span style="color:red;">Error: ' + (err.message || JSON.stringify(err)) + '</span>';
        }
      }
    };
  }
}); 