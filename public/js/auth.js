document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      if (data.user.role === 'Admin') window.location.href = '/admin-dashboard';
      else if (data.user.role === 'Manager') window.location.href = '/manager-dashboard';
      else window.location.href = '/employee-dashboard';
    } else {
      errorMsg.textContent = data.message;
    }
  } catch (err) {
    errorMsg.textContent = 'Login failed. Please try again.';
  }
});

// Common logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role'); // Also clear role just in case
  window.location.href = '/';
}

// Check auth on dashboard pages
function checkAuth(requiredRole) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    window.location.href = '/login';
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert('Unauthorized access');
    logout();
    return null;
  }
  
  return user;
}

// Redirect if already logged in (for login page)
if (window.location.pathname === '/login' && localStorage.getItem('token')) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user.role === 'Admin') window.location.href = '/admin-dashboard';
  else if (user.role === 'Manager') window.location.href = '/manager-dashboard';
  else window.location.href = '/employee-dashboard';
}
