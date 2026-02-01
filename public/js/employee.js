const user = checkAuth('Employee');

if (user && user.firstLogin) {
  document.getElementById('passwordModal').style.display = 'flex';
}

if (user) {
  const el = document.getElementById('employeeGreeting');
  if (el) el.textContent = `Hello, ${user.name}${user.employeeId ? ` (${user.employeeId})` : ''}!`;
}

// Change Password
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('newPassword').value;

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ newPassword })
    });
    
    if (res.ok) {
      alert('Password updated. Please login again.');
      logout();
    } else {
      alert('Error updating password');
    }
  } catch (err) {
    console.error(err);
  }
});

async function loadData() {
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  // Balance
  fetch('/api/employee/balance', { headers })
    .then(res => res.json())
    .then(bal => {
      const container = document.getElementById('balanceContainer');
      container.innerHTML = `
        <div class="card" style="text-align:center; background:#e3f2fd;">
          <h4>Vacation</h4>
          <h2>${bal.vacationTotal - bal.vacationUsed} / ${bal.vacationTotal}</h2>
        </div>
        <div class="card" style="text-align:center; background:#ffebee;">
          <h4>Sick</h4>
          <h2>${bal.sickTotal - bal.sickUsed} / ${bal.sickTotal}</h2>
        </div>
        <div class="card" style="text-align:center; background:#e8f5e9;">
          <h4>Casual</h4>
          <h2>${bal.casualTotal - bal.casualUsed} / ${bal.casualTotal}</h2>
        </div>
      `;
    });

  // History
  fetch('/api/employee/my-leaves', { headers })
    .then(res => res.json())
    .then(leaves => {
      const tbody = document.getElementById('historyTable');
      tbody.innerHTML = '';
      leaves.forEach(l => {
        const row = `
        <tr>
          <td>${l.leaveType}</td>
          <td>${new Date(l.fromDate).toLocaleDateString()}</td>
          <td>${new Date(l.toDate).toLocaleDateString()}</td>
          <td>${l.days}</td>
          <td class="status-${l.status.toLowerCase()}">${l.status}</td>
          <td>${l.managerComment || '-'}</td>
          <td>${new Date(l.createdAt).toLocaleDateString()} ${new Date(l.createdAt).toLocaleTimeString()}</td>
          <td>${new Date(l.updatedAt).toLocaleDateString()} ${new Date(l.updatedAt).toLocaleTimeString()}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  });

// Auto-Calculate Days
// Activity
async function loadActivity() {
  try {
    const res = await fetch('/api/employee/activity', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const logs = await res.json();
    const list = document.getElementById('employeeActivity');
    if (!list) return;
    list.innerHTML = '';
    logs.forEach(l => {
      const li = document.createElement('li');
      li.style.borderBottom = '1px solid #eee';
      li.style.padding = '10px 0';
      li.innerHTML = `<strong>${l.action}</strong> — ${l.message} <br><small style="color:#888;">${new Date(l.createdAt).toLocaleString()}</small>`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

let holidays = [];


// Fetch holidays on load
fetch('/api/employee/holidays', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
  .then(res => res.json())
  .then(data => { holidays = data; });

function calculateDays() {
  const startStr = document.getElementById('l-from').value;
  const endStr = document.getElementById('l-to').value;
  
  if (!startStr || !endStr) return;
  
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (start > end) {
    document.getElementById('l-days').value = "Invalid Date Range";
    return;
  }
  
  let count = 0;
  let current = new Date(start);
  
  const holidayStrings = holidays.map(h => new Date(h.date).toISOString().split('T')[0]);

  while (current <= end) {
    const day = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    
    // Exclude Sunday (0), Saturday (6), and Holidays
    if (day !== 0 && day !== 6 && !holidayStrings.includes(dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  document.getElementById('l-days').value = count;
}

document.getElementById('l-from').addEventListener('change', calculateDays);
document.getElementById('l-to').addEventListener('change', calculateDays);

const fromInput = document.getElementById('l-from');
const toInput = document.getElementById('l-to');
function syncToMin() {
  if (!fromInput.value) {
    toInput.value = '';
    toInput.disabled = true;
    toInput.removeAttribute('min');
    return;
  }
  toInput.disabled = false;
  toInput.min = fromInput.value;
  if (toInput.value && toInput.value < toInput.min) {
    toInput.value = toInput.min;
  }
}
syncToMin();
fromInput.addEventListener('change', syncToMin);

// Calendar
fetch('/api/employee/calendar', { headers })
  .then(res => res.json())
  .then(data => {
    createCalendar('calendarView', data.leaves, data.holidays);
  });
}

// Apply Leave
document.getElementById('applyLeaveForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const leaveType = document.getElementById('l-type').value;
  const fromDate = document.getElementById('l-from').value;
  const toDate = document.getElementById('l-to').value;
  const reason = document.getElementById('l-reason').value;

  if (new Date(toDate) < new Date(fromDate)) {
    alert('To Date must be on or after From Date');
    return;
  }

  try {
    const res = await fetch('/api/employee/apply-leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ leaveType, fromDate, toDate, reason })
    });
    
    const data = await res.json();
    if (res.ok) {
      alert('Leave applied successfully!');
      document.getElementById('applyLeaveForm').reset();
      loadData();
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
});

loadData();
loadActivity();
