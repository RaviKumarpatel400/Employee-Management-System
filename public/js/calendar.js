// Shared Calendar Logic
function createCalendar(containerId, leaves, holidays, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const today = new Date();
  let currentMonth = today.getMonth();
  let currentYear = today.getFullYear();

  function render(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const isCompact = typeof options.compact === 'boolean' ? options.compact : (window.innerWidth < 600);
    let html = `
      <div class="calendar-controls">
        <button class="btn" style="width:auto; padding: 5px 10px;" id="prevMonth">&lt;</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button class="btn" style="width:auto; padding: 5px 10px;" id="nextMonth">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-day-name">Sun</div>
        <div class="calendar-day-name">Mon</div>
        <div class="calendar-day-name">Tue</div>
        <div class="calendar-day-name">Wed</div>
        <div class="calendar-day-name">Thu</div>
        <div class="calendar-day-name">Fri</div>
        <div class="calendar-day-name">Sat</div>
    `;

    // Empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
      html += `<div class="calendar-day empty"></div>`;
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month, day);
      
      let content = `<span class="calendar-day-number">${day}</span>`;

      // Availability summary (Manager view)
      if (options.showAvailability && typeof options.teamSize === 'number') {
        const onLeaveSet = new Set();
        if (Array.isArray(leaves)) {
          leaves.forEach(l => {
            const start = new Date(l.fromDate).toISOString().split('T')[0];
            const end = new Date(l.toDate).toISOString().split('T')[0];
            if (dateStr >= start && dateStr <= end) {
              const empId = (l.employeeId && (l.employeeId._id || l.employeeId.id)) ? (l.employeeId._id || l.employeeId.id) : l.employeeId;
              if (empId) onLeaveSet.add(String(empId));
            }
          });
        }
        const leaveCount = onLeaveSet.size;
        const availableCount = Math.max(0, (options.teamSize || 0) - leaveCount);
        if (!isCompact) {
          content += `
            <div class="calendar-availability">
              <span class="availability-badge on-leave">On Leave: ${leaveCount}</span>
              <span class="availability-badge available">Available: ${availableCount}</span>
            </div>
          `;
        } else {
          content += `
            <div class="calendar-availability">
              <span class="availability-badge on-leave">${leaveCount}</span>
              <span class="availability-badge available">${availableCount}</span>
            </div>
          `;
        }
      }

      // Add Holidays
      if (holidays) {
        holidays.forEach(h => {
          const hDate = new Date(h.date).toISOString().split('T')[0];
          if (hDate === dateStr) {
            const typeClass = `holiday-${(h.type || 'Company').toLowerCase()}`;
            content += `<div class="calendar-leave holiday ${typeClass}" title="${h.name}">${h.name}</div>`;
          }
        });
      }

      // Add Leaves
      if (leaves) {
        if (isCompact) {
          let v = 0, s = 0, c = 0;
          leaves.forEach(l => {
            const start = new Date(l.fromDate).toISOString().split('T')[0];
            const end = new Date(l.toDate).toISOString().split('T')[0];
            if (dateStr >= start && dateStr <= end) {
              const t = (l.leaveType || '').toLowerCase();
              if (t === 'vacation') v++;
              else if (t === 'sick') s++;
              else if (t === 'casual') c++;
            }
          });
          if (v) content += `<div class="calendar-leave leave-vacation">V: ${v}</div>`;
          if (s) content += `<div class="calendar-leave leave-sick">S: ${s}</div>`;
          if (c) content += `<div class="calendar-leave leave-casual">C: ${c}</div>`;
        } else {
          leaves.forEach(l => {
            const start = new Date(l.fromDate).toISOString().split('T')[0];
            const end = new Date(l.toDate).toISOString().split('T')[0];
            if (dateStr >= start && dateStr <= end) {
              const colorClass = `leave-${l.leaveType.toLowerCase()}`;
              const label = l.employeeId && l.employeeId.name 
                ? `${l.employeeId.name}${l.employeeId.employeeId ? ` (${l.employeeId.employeeId})` : ''}` 
                : l.leaveType;
              content += `<div class="calendar-leave ${colorClass}" title="${label}">${label}</div>`;
            }
          });
        }
      }

      html += `<div class="calendar-day">${content}</div>`;
    }

    html += `</div>`; // Close grid
    container.innerHTML = html;

    // Bind events
    container.querySelector('#prevMonth').onclick = () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      render(currentMonth, currentYear);
    };
    container.querySelector('#nextMonth').onclick = () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      render(currentMonth, currentYear);
    };
  }

  render(currentMonth, currentYear);
}
