const itemsContainer = document.getElementById('items-container');
const timelineSlots = document.querySelectorAll('.timeline-slot');

// Define the morphemes array
const morphemes = [
  // Lexical Morphemes (type: 0)
  { text: 'house', type: 0 },
  { text: 'swim', type: 0 },
  { text: 'pain', type: 0 },
  { text: 'seed', type: 0 },

  // Functional Morphemes (type: 1)
  { text: 'if', type: 1 },
  { text: 'from', type: 1 },
  { text: 'that', type: 1 },
  { text: 'which', type: 1 },

  // Derivational Morphemes (type: 2)
  { text: 'rewrite', type: 2 },
  { text: 'joyful', type: 2 },
  { text: 'quickly', type: 2 },
  { text: 'childhood', type: 2 },

  // Inflectional Morphemes (type: 3)
  { text: 'playing', type: 3 },
  { text: 'jumped', type: 3 },
  { text: 'cats', type: 3 },
  { text: 'taller', type: 3 },
];

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to generate draggable items
function generateDraggableItems() {
  // Clear the items container
  itemsContainer.innerHTML = '';

  // Shuffle the morphemes array
  shuffleArray(morphemes);

  // Create and append draggable items
  morphemes.forEach((morpheme) => {
    const item = document.createElement('div');
    item.classList.add('draggable-item');
    item.setAttribute('draggable', 'true');
    item.dataset.number = morpheme.type;

    const p = document.createElement('p');
    p.textContent = morpheme.text;
    item.appendChild(p);

    itemsContainer.appendChild(item);

    // Attach event listeners
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
  });
}

// Call the function to generate items on page load
generateDraggableItems();

// Attach event listeners to timeline slots and items container
[...timelineSlots, itemsContainer].forEach(slot => {
  slot.addEventListener('dragover', dragOver);
  slot.addEventListener('drop', drop);
  slot.addEventListener('dragenter', dragEnter);
  slot.addEventListener('dragleave', dragLeave);
});

let draggedItem = null;

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
  // Remove all items from timeline slots
  timelineSlots.forEach((slot) => {
    while (slot.firstChild) {
      slot.removeChild(slot.firstChild);
    }
  });

  // Regenerate the draggable items
  generateDraggableItems();
}
