// Shared Calendar Logic
function createCalendar(containerId, leaves, holidays) {
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

    let html = `
      <div class="calendar-controls">
        <button class="btn" style="width:auto; padding: 5px 10px;" id="prevMonth">&lt;</button>
        <h3>${monthNames[month]} ${year}</h3>
        <button class="btn" style="width:auto; padding: 5px 10px;" id="nextMonth">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-header">Sun</div>
        <div class="calendar-header">Mon</div>
        <div class="calendar-header">Tue</div>
        <div class="calendar-header">Wed</div>
        <div class="calendar-header">Thu</div>
        <div class="calendar-header">Fri</div>
        <div class="calendar-header">Sat</div>
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

      // Add Holidays
      if (holidays) {
        holidays.forEach(h => {
          const hDate = new Date(h.date).toISOString().split('T')[0];
          if (hDate === dateStr) {
            content += `<div class="calendar-leave holiday" title="${h.name}">${h.name}</div>`;
          }
        });
      }

      // Add Leaves
      if (leaves) {
        leaves.forEach(l => {
          const start = new Date(l.fromDate).toISOString().split('T')[0];
          const end = new Date(l.toDate).toISOString().split('T')[0];
          
          if (dateStr >= start && dateStr <= end) {
            const colorClass = `leave-${l.leaveType.toLowerCase()}`;
            // For managers, show employee name; for employees, show leave type
            const label = l.employeeId && l.employeeId.name ? l.employeeId.name : l.leaveType;
            content += `<div class="calendar-leave ${colorClass}" title="${label}">${label}</div>`;
          }
        });
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
