// Check Auth
const user = checkAuth('Admin');

function showSection(id) {
  ['manager-section', 'employee-section', 'holiday-section', 'announcement-section'].forEach(sec => {
    document.getElementById(sec).style.display = (sec === id) ? 'block' : 'none';
  });
}

// Load Dashboard Stats
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const { totalEmployees, totalManagers, managersByDept } = await res.json();
    
    let deptStats = managersByDept.map(d => `<div>${d._id}: ${d.count}</div>`).join('');
    
    document.getElementById('stats-container').innerHTML = `
      <div style="background:#f8f9fa; padding:15px; border-radius:5px;">
        <h3>Total Employees</h3>
        <p style="font-size:2em; font-weight:bold;">${totalEmployees}</p>
      </div>
      <div style="background:#f8f9fa; padding:15px; border-radius:5px;">
        <h3>Total Managers</h3>
        <p style="font-size:2em; font-weight:bold;">${totalManagers}</p>
      </div>
      <div style="background:#f8f9fa; padding:15px; border-radius:5px;">
        <h3>Managers by Dept</h3>
        ${deptStats || 'None'}
      </div>
    `;
  } catch (err) {
    console.error(err);
  }
}
loadStats();

// Create Manager
document.getElementById('createManagerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('m-name').value;
  const email = document.getElementById('m-email').value;
  const department = document.getElementById('m-dept').value;

  try {
    const res = await fetch('/api/admin/create-manager', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, email, department })
    });
    const data = await res.json();
    document.getElementById('m-result').innerText = res.ok 
      ? `Success! Password: ${data.password}` 
      : `Error: ${data.message}`;
  } catch (err) {
    console.error(err);
  }
});

// Load Managers for Employee Form
async function loadManagers() {
  const dept = document.getElementById('e-dept').value;
  const managerSelect = document.getElementById('e-manager');
  managerSelect.innerHTML = '<option value="">Select Manager</option>';

  if (!dept) return;

  try {
    const res = await fetch(`/api/admin/managers/${dept}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const managers = await res.json();
    managers.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m._id;
      opt.textContent = `${m.name} (${m._id})`;
      managerSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

// Create Employee
document.getElementById('createEmployeeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('e-name').value;
  const email = document.getElementById('e-email').value;
  const department = document.getElementById('e-dept').value;
  const managerId = document.getElementById('e-manager').value;

  try {
    const res = await fetch('/api/admin/create-employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, email, department, managerId })
    });
    const data = await res.json();
    document.getElementById('e-result').innerText = res.ok 
      ? `Success! ID: ${data.employeeId}, Password: ${data.password}` 
      : `Error: ${data.message}`;
  } catch (err) {
    console.error(err);
  }
});

// Holidays
async function loadHolidays() {
  try {
    const res = await fetch('/api/admin/holidays', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const holidays = await res.json();
    const list = document.getElementById('holidayList');
    list.innerHTML = '';
    holidays.forEach(h => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${new Date(h.date).toDateString()} - ${h.name} <span style="color:#888;">(${h.type || 'Company'})</span>
        <button onclick="deleteHoliday('${h._id}')" style="color:red; cursor:pointer; border:none; background:none;">[x]</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

// Add Holiday
document.getElementById('holidayForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('h-name').value;
  const date = document.getElementById('h-date').value;
  const type = document.getElementById('h-type').value;

  try {
    const res = await fetch('/api/admin/holidays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, date, type })
    });
    
    if (res.ok) {
      alert('Holiday added');
      loadHolidays();
      document.getElementById('holidayForm').reset();
    } else {
      alert('Error adding holiday');
    }
  } catch (err) {
    console.error(err);
  }
});

// Delete Holiday
async function deleteHoliday(id) {
  if (!confirm('Delete this holiday?')) return;
  
  try {
    const res = await fetch(`/api/admin/holidays/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    
    if (res.ok) {
      loadHolidays();
    }
  } catch (err) {
    console.error(err);
  }
}

// Initial Load
loadHolidays();
loadAnnouncements();

// Announcement Logic
async function loadAnnouncements() {
  try {
    const res = await fetch('/api/admin/announcements', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const announcements = await res.json();
    const list = document.getElementById('announcementList');
    list.innerHTML = '';
    announcements.forEach(a => {
      const li = document.createElement('li');
      li.style.borderBottom = '1px solid #ddd';
      li.style.padding = '10px 0';
      li.innerHTML = `
        <strong>${a.title}</strong>
        <p style="margin:5px 0;">${a.content}</p>
        <small style="color:#888;">${new Date(a.createdAt).toLocaleDateString()}</small>
        <button onclick="deleteAnnouncement('${a._id}')" style="color:red; float:right; border:none; background:none; cursor:pointer;">Delete</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('announcementForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('a-title').value;
  const content = document.getElementById('a-content').value;

  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ title, content })
    });
    
    if (res.ok) {
      alert('Announcement posted');
      loadAnnouncements();
      document.getElementById('announcementForm').reset();
    }
  } catch (err) {
    console.error(err);
  }
});

async function deleteAnnouncement(id) {
  if (!confirm('Delete this announcement?')) return;
  try {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) loadAnnouncements();
  } catch (err) {
    console.error(err);
  }
}
