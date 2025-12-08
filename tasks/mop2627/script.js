let allModules = [];
const selectedModules = [];

const levelLimits = {
  4: 1,
  5: 2,
  6: 3
};

document.addEventListener('DOMContentLoaded', () => {
  fetch('modules.json')
    .then(response => response.json())
    .then(data => {
      allModules = data;

      // Load saved IDs and rehydrate to full objects
      const saved = localStorage.getItem('selectedModules');
      if (saved) {
        const savedIds = JSON.parse(saved);
        const restored = allModules.filter(m => savedIds.includes(m.id));
        selectedModules.push(...restored);
      }

      applyFilters(); // now works correctly
      updateSelectionStatus(); // keep in sync
    });

  const saved = localStorage.getItem('selectedModules');
  if (saved) {
    const savedArray = JSON.parse(saved);
    selectedModules.length = 0; // clear current
    selectedModules.push(...savedArray);
  }

  document.getElementById('levelFilter').addEventListener('change', applyFilters);
  document.getElementById('pathwayFilter').addEventListener('change', applyFilters);
  document.getElementById('searchInput').addEventListener('input', applyFilters);

  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.getElementById('levelFilter').value = '';
    document.getElementById('pathwayFilter').value = '';
    document.getElementById('searchInput').value = '';
    applyFilters();
  });

  document.getElementById('clearSelectionsBtn').addEventListener('click', () => {
    selectedModules.length = 0; // empty the array
    updateSelectionStatus();
    applyFilters(); // re-render with no modules selected
  });

document.getElementById('clearLocalBtn').addEventListener('click', () => {
  localStorage.removeItem('selectedModules');
  selectedModules.length = 0;
  updateSelectionStatus();
  applyFilters();
  alert("Saved selections cleared.");
});

});

function applyFilters() {
  const level = document.getElementById('levelFilter').value;
  const pathway = document.getElementById('pathwayFilter').value.toLowerCase();
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  const filtered = allModules.filter(module => {
    const matchesLevel = !level || module.level.toString() === level;
    const matchesPathway = !pathway || module.pathway.toLowerCase().includes(pathway);
    const matchesSearch = !searchTerm || (
      module.title.toLowerCase().includes(searchTerm) ||
      module.description.toLowerCase().includes(searchTerm)
    );
    return matchesLevel && matchesPathway && matchesSearch;
  });

  renderModules(filtered);
}

function countSelectedPerLevel(level) {
  return selectedModules.filter(m => m.level === level).length;
}

function hasTimetableConflict(level, timetable) {
  return selectedModules.some(
    m => m.level === level && m.timetable === timetable
  );
}

function getConflictingModule(level, timetable) {
  return selectedModules.find(
    m => m.level === level && m.timetable === timetable
  );
}

function updateSelectionStatus() {
  const counts = { 4: 0, 5: 0, 6: 0 };
  selectedModules.forEach(m => counts[m.level]++);
  const l4 = counts[4], l5 = counts[5], l6 = counts[6];

  const l4Status = l4 >= levelLimits[4] ? `${l4}/1 ✅` : `${l4}/1`;
  const l5Status = l5 >= levelLimits[5] ? `${l5}/2 ✅` : `${l5}/2`;
  const l6Status = l6 >= levelLimits[6] ? `${l6}/3 ✅` : `${l6}/3`;

  document.getElementById('selectionStatus').textContent =
    `L4: ${l4Status} | L5: ${l5Status} | L6: ${l6Status}`;
}

function renderModules(modules) {
  const container = document.getElementById('modulesContainer');
  container.innerHTML = '';

  modules.forEach(module => {
    const isSelected = selectedModules.some(m => m.id === module.id);
    const levelCount = countSelectedPerLevel(module.level);
    const timetableClash = hasTimetableConflict(module.level, module.timetable);
    const limitReached = levelCount >= levelLimits[module.level];

    const moduleElement = document.createElement('div');
    moduleElement.classList.add('module-collapsible');
    if (isSelected) moduleElement.classList.add('selected');

    const toggleId = `toggle-${module.id}`;
    const contentId = `content-${module.id}`;

    moduleElement.innerHTML = `
      <div class="module-header ${module.pathwayColour}" 
           role="button" 
           tabindex="0"
           aria-expanded="false" 
           aria-controls="${contentId}" 
           id="${toggleId}">
        <h3>${module.title}</h3>
        <span class="module-level">Level ${module.level}</span>
      </div>
      <div class="module-body" 
           id="${contentId}" 
           role="region" 
           aria-labelledby="${toggleId}">
        <p><strong>Credits:</strong> ${module.credits}</p>
        <p><strong>Pathway:</strong> ${module.pathway}</p>
        <p class="description">${module.description}</p>
        <p><strong>Staff:</strong> ${module.staff}</p>
        <p><strong>Timetable:</strong> ${module.timetable}</p>
        <p><strong>Assessment:</strong> ${module.assessment}</p>
        <button class="select-button">${isSelected ? "Deselect" : "Select"}</button>
        <div class="module-reason"></div>
      </div>
    `;

    const header = moduleElement.querySelector('.module-header');
    const body = moduleElement.querySelector('.module-body');
    const button = moduleElement.querySelector('.select-button');
    const reasonDiv = moduleElement.querySelector('.module-reason');

    // Toggle expand/collapse
    header.addEventListener('click', () => {
      body.classList.toggle('show');
      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', (!expanded).toString());
    });

    // Keyboard accessibility for toggle
    header.addEventListener('keyup', (e) => {
      if (e.key === "Enter" || e.key === " ") {
        header.click();
        e.preventDefault();
      }
    });

    // Select/Deselect logic
    button.addEventListener('click', () => {
      const index = selectedModules.findIndex(m => m.id === module.id);
      if (index !== -1) {
        selectedModules.splice(index, 1);
      } else {
        selectedModules.push(module);
      }
      updateSelectionStatus();
      applyFilters(); // re-render with new state
      localStorage.setItem('selectedModules', JSON.stringify(selectedModules.map(m => m.id)));
    });

    // Disable logic with message
    if (!isSelected && (limitReached || timetableClash)) {
      button.style.display = 'none'; // hide the button
      moduleElement.classList.add('disabled');

      if (limitReached) {
        reasonDiv.textContent = `Maximum selections reached for Level ${module.level}`;
      } else if (timetableClash) {
        const conflict = getConflictingModule(module.level, module.timetable);
        reasonDiv.textContent = conflict
          ? `Cannot select – conflicts with "${conflict.title}" (Level ${conflict.level})`
          : `Cannot select – timetable conflict`;
      }
    } else {
      button.style.display = 'inline-block';
      reasonDiv.textContent = '';
    }

    container.appendChild(moduleElement);
  });
}

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  if (selectedModules.length === 0) {
    alert("No modules selected to export.");
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const timestamp = `Module Selections – ${dateStr} at ${timeStr}\n\n`;

  const content = timestamp + selectedModules.map(m => `
${m.title} (Level ${m.level})
Credits: ${m.credits}
Timetable: ${m.timetable}
Assessment: ${m.assessment}
Staff: ${m.staff}

`).join("\n");


  const blob = new Blob([content], { type: "application/pdf" });

  // Use a workaround for saving text as PDF by opening print dialog
  const printableWindow = window.open('', '', 'width=800,height=600');
  printableWindow.document.write(`
    <html>
    <head><title>Selected Modules</title></head>
    <body><pre>${content}</pre></body>
    </html>
  `);
  printableWindow.document.close();
  printableWindow.print();
});
