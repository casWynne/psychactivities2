const items = document.querySelectorAll('.draggable-item');
const timelineSlots = document.querySelectorAll('.timeline-slot');
const itemsContainer = document.getElementById('items-container');

let draggedItem = null;

items.forEach(item => {
  item.addEventListener('dragstart', dragStart);
  item.addEventListener('dragend', dragEnd);
});

[...timelineSlots, itemsContainer].forEach(slot => {
  slot.addEventListener('dragover', dragOver);
  slot.addEventListener('drop', drop);
  slot.addEventListener('dragenter', dragEnter);
  slot.addEventListener('dragleave', dragLeave);
});

function dragStart(e) {
  draggedItem = e.target;
  e.dataTransfer.setData('text/plain', e.target.dataset.number);
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    e.target.style.opacity = '0.5';
  }, 0);
}

function dragEnd(e) {
  e.target.style.opacity = '1';
}

function dragOver(e) {
  e.preventDefault();
}

function dragEnter(e) {
  e.preventDefault();
  if (e.currentTarget === itemsContainer || e.currentTarget.classList.contains('timeline-slot')) {
    e.currentTarget.classList.add('drag-over');
  }
}

function dragLeave(e) {
  if (e.currentTarget === itemsContainer || e.currentTarget.classList.contains('timeline-slot')) {
    e.currentTarget.classList.remove('drag-over');
  }
}

function drop(e) {
  e.preventDefault();
  if (e.currentTarget === itemsContainer) {
    // Dropped back into storage
    itemsContainer.appendChild(draggedItem);
    draggedItem.classList.remove('correct', 'incorrect');
  } else if (e.currentTarget.classList.contains('timeline-slot')) {
    const itemNumber = parseInt(draggedItem.dataset.number);
    const slotNumber = parseInt(e.currentTarget.dataset.number);

    // Append the dragged item to the slot
    e.currentTarget.appendChild(draggedItem);

    // Check correctness
    if (itemNumber === slotNumber) {
      draggedItem.classList.add('correct');
      draggedItem.classList.remove('incorrect');
    } else {
      draggedItem.classList.add('incorrect');
      draggedItem.classList.remove('correct');
    }
  }

  // Remove visual feedback
  e.currentTarget.classList.remove('drag-over');

  // Reset the dragged item
  draggedItem.style.opacity = '1';
  draggedItem = null;
}

// Reset Activity Functionality
document.getElementById('reset-button').addEventListener('click', resetActivity);

function resetActivity() {
  // Move items back to the items container
  items.forEach(item => {
    itemsContainer.appendChild(item);
    item.classList.remove('correct', 'incorrect');
  });
}
