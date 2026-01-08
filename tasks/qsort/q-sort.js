let thoughtId = 0;  // Global variable to keep track of thought IDs

// Handle the "Start" button click
document.getElementById('set-subject-button').addEventListener('click', function() {
    const subjectText = document.getElementById('subject-text').value;

    if (subjectText.trim() !== '') {
        // Set the subject as the header for the Q-sort grid
        document.getElementById('grid-subject-header').textContent = subjectText;

        // Optionally clear the input field after setting the header
        document.getElementById('subject-text').value = '';
    } else {
        alert("Please enter a subject.");
    }
});


// Function to handle adding a new thought when the "Add Thought" button is clicked
document.getElementById('add-thought').addEventListener('click', function() {
    const thoughtText = document.getElementById('thought-text').value;
    const thoughtValue = document.querySelector('input[name="thought-value"]:checked').value;

    if (thoughtText.trim() !== '') {
        thoughtId++; // Increment the ID for each new thought

        // Create a new thought item div with a unique ID
        const thoughtElement = document.createElement('div');
        thoughtElement.classList.add('thought-item');
        thoughtElement.id = 'thought-' + thoughtId;  // Assign unique ID

        // Add close button
        const closeButton = createCloseButton(thoughtElement);
        thoughtElement.appendChild(closeButton);

        // Add thought content
        const thoughtContent = document.createElement('div');
        thoughtContent.textContent = thoughtText;
        thoughtContent.classList.add('thought-content');  // Add a class to target just the content
        thoughtElement.appendChild(thoughtContent);

        thoughtElement.draggable = true;

        // Assign class based on thought type (positive, neutral, negative)
        if (thoughtValue === 'positive') {
            thoughtElement.classList.add('positive');
            document.getElementById('positive-thoughts-list').appendChild(thoughtElement);
        } else if (thoughtValue === 'neutral') {
            thoughtElement.classList.add('neutral');
            document.getElementById('neutral-thoughts-list').appendChild(thoughtElement);
        } else if (thoughtValue === 'negative') {
            thoughtElement.classList.add('negative');
            document.getElementById('negative-thoughts-list').appendChild(thoughtElement);
        }

        // Clear the input field
        document.getElementById('thought-text').value = '';

        // Add dragstart event to the new thought item
        thoughtElement.addEventListener('dragstart', dragStart);
        console.log('Added new thought:', thoughtElement);  // Debugging
    }
});

// Create the close button and attach it to the thought
function createCloseButton(thoughtElement) {
    const closeButton = document.createElement('span');
    closeButton.classList.add('close-btn');
    closeButton.innerHTML = '✖';  // Use a more stylish "X"
    closeButton.onclick = function() {
        console.log('Close button clicked for:', thoughtElement);  // Debugging
        thoughtElement.remove(); // Remove the thought when the close button is clicked
    };
    return closeButton;
}

// Drag start logic for when a thought item is being dragged
function dragStart(e) {
    const thoughtContent = e.target.querySelector('.thought-content'); // Only get the thought content
    const thoughtText = thoughtContent ? thoughtContent.textContent : ''; // Safely get the content text

    console.log('Dragging started for:', thoughtText);  // Debugging

    e.dataTransfer.setData('text/plain', thoughtText); // Store only the content text, excluding the close button
    e.dataTransfer.setData('data-class', e.target.className);   // Store the class of the dragged item
    e.dataTransfer.setData('source-id', e.target.id);           // Store the id of the dragged item
    e.dataTransfer.setData('previous-parent-id', e.target.parentElement.id); // Track the parent (grid cell or thought container)

    console.log('Drag data stored:', {
        text: thoughtText,
        class: e.target.className,
        id: e.target.id,
        previousParent: e.target.parentElement.id
    });  // Debugging
}

// Function to add drop event listener to thought containers
function addContainerDropListener(containerId) {
    const container = document.getElementById(containerId);

    container.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    container.addEventListener('drop', function(e) {
        e.preventDefault();

        const draggedData = e.dataTransfer.getData('text/plain');
        const draggedClass = e.dataTransfer.getData('data-class');
        const sourceId = e.dataTransfer.getData('source-id');
        const previousParentId = e.dataTransfer.getData('previous-parent-id');

        console.log(`Dropped thought on ${containerId}. Dragged data:`, {
            text: draggedData,
            class: draggedClass,
            sourceId: sourceId,
            previousParentId: previousParentId
        });

        const previousParentElement = document.getElementById(previousParentId);
        const originalElement = document.getElementById(sourceId);

        if (originalElement && previousParentElement) {
            if (previousParentElement.classList.contains('drop-zone') || previousParentElement.classList.contains('thought-section')) {
                console.log('Removing original element from previous parent:', previousParentElement);  // Debugging
                originalElement.remove();
            }
        }

        const newItem = document.createElement('div');
        newItem.className = draggedClass;  // Retain the original class (for styling)
        newItem.draggable = true;
        newItem.id = sourceId;

        // Add a new close button (ensure only one exists)
        const closeButton = createCloseButton(newItem);
        newItem.appendChild(closeButton);

        const thoughtContent = document.createElement('div');
        thoughtContent.textContent = draggedData;
        thoughtContent.classList.add('thought-content');  // Add the class for content
        newItem.appendChild(thoughtContent);

        newItem.addEventListener('dragstart', dragStart);
        container.appendChild(newItem);
        console.log(`Thought added to ${containerId}:`, newItem);  // Debugging
    });
}

// Add drop listeners to thought containers
addContainerDropListener('positive-thoughts-list');
addContainerDropListener('neutral-thoughts-list');
addContainerDropListener('negative-thoughts-list');

// Add drop functionality to all grid cells (drop zones)
const allCells = document.querySelectorAll('.drop-zone');

allCells.forEach(cell => {
    cell.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    cell.addEventListener('drop', function(e) {
        e.preventDefault();

        const draggedData = e.dataTransfer.getData('text/plain');
        const draggedClass = e.dataTransfer.getData('data-class');
        const sourceId = e.dataTransfer.getData('source-id');
        const previousParentId = e.dataTransfer.getData('previous-parent-id');
        const isTopCell = e.target.classList.contains('top-cell');

        console.log(`Dropped thought on grid cell. Dragged data:`, {
            text: draggedData,
            class: draggedClass,
            sourceId: sourceId,
            previousParentId: previousParentId,
            isTopCell: isTopCell
        });

        const previousParentElement = document.getElementById(previousParentId);
        const originalElement = document.getElementById(sourceId);

        if (originalElement && previousParentElement) {
            if (previousParentElement.classList.contains('drop-zone') || previousParentElement.classList.contains('thought-section')) {
                console.log('Removing original element from previous parent:', previousParentElement);  // Debugging
                originalElement.remove();
            }
        }

        if (isTopCell) {
            const column = e.target.getAttribute('data-column');
            const nearestEmptyBox = findNearestEmptyBox(column);

            if (nearestEmptyBox) {
                const newItem = document.createElement('div');
                newItem.className = draggedClass;
                newItem.draggable = true;
                newItem.id = sourceId;

                const closeButton = createCloseButton(newItem);
                newItem.appendChild(closeButton);

                const thoughtContent = document.createElement('div');
                thoughtContent.textContent = draggedData;
                thoughtContent.classList.add('thought-content');  // Add the class for content
                newItem.appendChild(thoughtContent);

                newItem.addEventListener('dragstart', dragStart);

                nearestEmptyBox.appendChild(newItem);
                console.log('Thought added to nearest empty box:', newItem);  // Debugging
            } else {
                console.log('No empty box found in column:', column);  // Debugging
            }
        } else {
            if (!e.target.hasChildNodes()) {
                const newItem = document.createElement('div');
                newItem.className = draggedClass;
                newItem.draggable = true;
                newItem.id = sourceId;

                const closeButton = createCloseButton(newItem);
                newItem.appendChild(closeButton);

                const thoughtContent = document.createElement('div');
                thoughtContent.textContent = draggedData;
                thoughtContent.classList.add('thought-content');  // Add the class for content
                newItem.appendChild(thoughtContent);

                newItem.addEventListener('dragstart', dragStart);

                e.target.appendChild(newItem);
                console.log('Thought added to grid cell:', newItem);  // Debugging
            } else {
                console.log('Target cell already contains a thought. Cannot drop here.');  // Debugging
            }
        }
    });
});

// Function to find the nearest empty box in the same column
function findNearestEmptyBox(column) {
    console.log('Finding nearest empty box in column:', column);  // Debugging
    const cellsInColumn = document.querySelectorAll(`.drop-zone[data-column="${column}"]`);
    for (let i = 0; i < cellsInColumn.length; i++) {
        if (!cellsInColumn[i].hasChildNodes()) {
            console.log('Found empty box:', cellsInColumn[i]);  // Debugging
            return cellsInColumn[i];
        }
    }
    console.log('No empty box found in column:', column);  // Debugging
    return null;
}

// Add event listeners to all initial thought items to make them draggable
const thoughtItems = document.querySelectorAll('.thought-item');

thoughtItems.forEach(item => {
    item.addEventListener('dragstart', dragStart);
    console.log('Added dragstart event to initial thought:', item);  // Debugging
});
