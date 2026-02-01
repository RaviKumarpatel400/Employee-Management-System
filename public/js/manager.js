const user = checkAuth('Manager');

if (user && user.firstLogin) {
  document.getElementById('passwordModal').style.display = 'flex';
}

// Change Password Logic
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

let teamApprovedLeaves = [];

async function loadData() {
  const token = localStorage.getItem('token');
  
  // Fetch Calendar Data (Approved Leaves) first for overlap check
  try {
    const res = await fetch('/api/manager/calendar', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    teamApprovedLeaves = data.leaves || [];
    createCalendar('calendarView', data.leaves || [], data.holidays || []);
    loadRequests(); // Load requests after we have calendar data
  } catch (err) {
    console.error(err);
  }
}

async function loadRequests() {
  try {
    const res = await fetch('/api/manager/leaves', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const requests = await res.json();
    const list = document.getElementById('requestsList');
    
    const pending = requests.filter(r => r.status === 'Pending');
    
    if (pending.length === 0) {
      list.innerHTML = '<p>No pending requests.</p>';
      return;
    }

    list.innerHTML = '';
    pending.forEach(req => {
      // Check overlap
      const overlaps = checkOverlap(req);
      
      const div = document.createElement('div');
      div.style.borderBottom = '1px solid #eee';
      div.style.padding = '10px 0';
      div.innerHTML = `
        <strong>${req.employeeId.name}</strong> - ${req.leaveType} <br>
        ${new Date(req.fromDate).toDateString()} to ${new Date(req.toDate).toDateString()} (${req.days} days)<br>
        <em>Reason: ${req.reason}</em>
        ${overlaps ? `<span class="overlap-warning">Warning: Overlaps with ${overlaps} approved leave(s)</span>` : ''}
        <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">
          <input id="comment-${req._id}" type="text" placeholder="Add comment" style="flex:1; padding:6px; border:1px solid #ddd; border-radius:4px;">
          <button onclick="processLeave('${req._id}', 'Approved')" class="btn" style="width:auto; background:var(--success-color); padding:5px 10px; font-size:12px;">Approve</button>
          <button onclick="processLeave('${req._id}', 'Rejected')" class="btn" style="width:auto; background:var(--danger-color); padding:5px 10px; font-size:12px;">Reject</button>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

function checkOverlap(req) {
  const start = new Date(req.fromDate);
  const end = new Date(req.toDate);
  
  let count = 0;
  teamApprovedLeaves.forEach(l => {
    // Skip same user? Requirement implies "overlapping leave warnings" - could be with anyone in team
    // "See overlapping leave warnings" -> usually means if *anyone else* is off, to ensure coverage.
    // Or if the *same* user is off? No, same user shouldn't be able to apply if overlapping approved exists (but we didn't block it strictly).
    // Let's assume it means "Team Coverage Warning".
    
    const lStart = new Date(l.fromDate);
    const lEnd = new Date(l.toDate);
    
    if (start <= lEnd && end >= lStart) {
      count++;
    }
  });
  return count;
}

async function processLeave(id, status) {
  const commentInput = document.getElementById(`comment-${id}`);
  const comment = commentInput ? commentInput.value : '';

  if (!comment) {
    alert('Please add a comment before processing.');
    return;
  }

  try {
    const res = await fetch(`/api/manager/leaves/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status, comment })
    });
    
    if (res.ok) {
      alert(`Leave request ${status}`);
      loadData(); // Reload everything
    } else {
      const data = await res.json();
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
}

// no-op: calendar rendered in loadData

loadData();
