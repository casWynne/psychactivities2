const selectedModules = [];

function countByLevel() {
  const counts = { 4: 0, 5: 0, 6: 0 };
  selectedModules.forEach(mod => {
    counts[mod.level]++;
  });
  return counts;
}

function updateSelectionStatus() {
  const counts = countByLevel();
  const l4 = counts[4];
  const l5 = counts[5];
  const l6 = counts[6];

  const l4Status = l4 >= 1 ? `${l4}/1 ✅` : `${l4}/1`;
  const l5Status = l5 >= 2 ? `${l5}/2 ✅` : `${l5}/2`;
  const l6Status = l6 >= 3 ? `${l6}/3 ✅` : `${l6}/3`;

  document.getElementById('selectionStatus').textContent =
    `L4: ${l4Status} | L5: ${l5Status} | L6: ${l6Status}`;
}


function updateHeader(pathwayName, colourHex) {
  document.getElementById('currentPathway').textContent = pathwayName;
  document.querySelector('.app-header').style.backgroundColor = colourHex;
}

document.querySelectorAll('.module-header').forEach(header => {
  header.addEventListener('click', () => {
    const body = header.nextElementSibling;
    body.classList.toggle('show');
  });
});

fetch('modules.json')
  .then(response => response.json())
  .then(data => {
    renderModules(data);
  });

function renderModules(modules) {
  const container = document.getElementById('modulesContainer');
  container.innerHTML = '';

  modules.forEach(module => {
    const moduleElement = document.createElement('div');
    moduleElement.classList.add('module-collapsible', module.pathwayColour);

    moduleElement.innerHTML = `
      <div class="module-header">
        <h3>${module.title}</h3>
        <span class="module-level">Level ${module.level}</span>
      </div>
      <div class="module-body">
        <p><strong>Credits:</strong> ${module.credits}</p>
        <p><strong>Pathway:</strong> ${module.pathway}</p>
        <p class="description">${module.description}</p>
        <p><strong>Staff:</strong> ${module.staff}</p>
        <p><strong>Timetable:</strong> ${module.timetable}</p>
        <p><strong>Assessment:</strong> ${module.assessment}</p>
        <button class="select-button">Select</button>
      </div>
    `;

    // Add expand/collapse toggle
    moduleElement.querySelector('.module-header').addEventListener('click', () => {
      moduleElement.querySelector('.module-body').classList.toggle('show');
    });

    // Add to page
    container.appendChild(moduleElement);
  });
}

