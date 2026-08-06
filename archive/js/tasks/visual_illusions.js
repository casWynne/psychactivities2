document.addEventListener('DOMContentLoaded', () => {
    // Contrast Effect xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // Function to adjust the color of the central squares
    function adjustContrast(value) {
        const colorValue = `rgb(${value}, ${value}, ${value})`;
        document.getElementById('dark-center').style.backgroundColor = colorValue;
        document.getElementById('light-center').style.backgroundColor = colorValue;
    }

    // Function to trigger the comparison animation for central squares only
    function compareContrast() {
        const contrastIllusion = document.getElementById('contrast-illusion');
        contrastIllusion.classList.toggle('compare');
    }

    // Make the functions globally accessible
    window.adjustContrast = adjustContrast;
    window.compareContrast = compareContrast;

    // Ebbinghaus Illusion - Size Manipulation xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const sizeCanvas = document.getElementById('size-canvas');
    const sizeCtx = sizeCanvas.getContext('2d');
    let surroundingRadiusLarge = 25; // Initial radius for large surrounding circles
    let surroundingRadiusSmall = 5; // Initial radius for small surrounding circles

    // Function to draw a circle with a specified color
    function drawCircle(ctx, x, y, radius, color) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // Function to draw the Size Manipulation Ebbinghaus Illusion
    function drawSizeIllusion() {
        sizeCtx.clearRect(0, 0, sizeCanvas.width, sizeCanvas.height);

        // Central circle properties
        const centralRadius = 30;
        const centralColor = '#ff6347'; // Tomato red

        // Surrounding circles properties
        const surroundingColorLarge = '#32cd32'; // Lime green
        const surroundingColorSmall = '#1e90ff'; // Dodger blue

        // Draw left set of circles (small surrounding circles)
        drawCircle(sizeCtx, 150, 150, centralRadius, centralColor);
        for (let i = 0; i < 8; i++) {
            const angle = (2 * Math.PI / 8) * i;
            const x = 150 + 70 * Math.cos(angle); // Fixed distance
            const y = 150 + 70 * Math.sin(angle);
            drawCircle(sizeCtx, x, y, surroundingRadiusSmall, surroundingColorSmall);
        }

        // Draw right set of circles (large surrounding circles)
        drawCircle(sizeCtx, 450, 150, centralRadius, centralColor);
        for (let i = 0; i < 8; i++) {
            const angle = (2 * Math.PI / 8) * i;
            const x = 450 + 70 * Math.cos(angle); // Fixed distance
            const y = 150 + 70 * Math.sin(angle);
            drawCircle(sizeCtx, x, y, surroundingRadiusLarge, surroundingColorLarge);
        }
    }

    // Function to update the size of the surrounding circles
    function updateCircleSize(value) {
        // Large circles shrink as the slider moves right, small circles grow
        surroundingRadiusLarge = 5 + (25 - value); // Shrink from 33 to 5
        surroundingRadiusSmall = value; // Grow from 5 to 33
        drawSizeIllusion(); // Redraw the illusion with updated sizes
    }

    // Draw the initial Size Illusion on the canvas
    drawSizeIllusion();

    // Make the function globally accessible
    window.updateCircleSize = updateCircleSize;

    // Ebbinghaus Illusion - Distance Manipulation xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const distanceCanvas = document.getElementById('distance-canvas');
    const distanceCtx = distanceCanvas.getContext('2d');

    // Distance properties
    let distanceLarge = 67; // Initial distance of large circles from center
    let distanceSmall = 105; // Initial distance of small circles from center

    // Function to draw the Distance Manipulation Ebbinghaus Illusion
    function drawDistanceIllusion() {
        distanceCtx.clearRect(0, 0, distanceCanvas.width, distanceCanvas.height);

        // Central circle properties
        const centralRadius = 30;
        const centralColor = '#ff6347'; // Tomato red

        // Surrounding circles properties
        const surroundingColorLarge = '#32cd32'; // Lime green
        const surroundingColorSmall = '#1e90ff'; // Dodger blue

        // Draw left set of circles (small surrounding circles)
        drawCircle(distanceCtx, 150, 150, centralRadius, centralColor);
        for (let i = 0; i < 8; i++) {
            const angle = (2 * Math.PI / 8) * i;
            const x = 150 + distanceSmall * Math.cos(angle); // Adjust distance using distanceSmall variable
            const y = 150 + distanceSmall * Math.sin(angle);
            drawCircle(distanceCtx, x, y, 5, surroundingColorSmall); // Fixed size
        }

        // Draw right set of circles (large surrounding circles)
        drawCircle(distanceCtx, 450, 150, centralRadius, centralColor);
        for (let i = 0; i < 8; i++) {
            const angle = (2 * Math.PI / 8) * i;
            const x = 450 + distanceLarge * Math.cos(angle); // Adjust distance using distanceLarge variable
            const y = 150 + distanceLarge * Math.sin(angle);
            drawCircle(distanceCtx, x, y, 25, surroundingColorLarge); // Fixed size
        }
    }

    // Function to update the distance of the surrounding circles
    function updateCircleDistance(value) {
        // Large circles move closer as the slider moves right, small circles move away
        distanceLarge = value;
        distanceSmall = 105 - (parseInt(value) - 67);
        drawDistanceIllusion();
    }

    // Draw the initial Distance Illusion on the canvas
    drawDistanceIllusion();

    // Make the function globally accessible
    window.updateCircleDistance = updateCircleDistance;


    // Ponzo Illusion xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // Ponzo Illusion Variables
    const ponzoCanvas = document.getElementById('ponzo-canvas');
    const ponzoCtx = ponzoCanvas ? ponzoCanvas.getContext('2d') : null;
    let lineLength = 100; // Initial length of the horizontal lines
    let linePosition = 100; // Initial vertical position of the top horizontal line
    let convergingAngle = 300; // Initial angle (x-coordinate) of converging lines

    // Check if ponzoCanvas and ponzoCtx exist before drawing
    if (ponzoCtx) {
        // Function to draw the Ponzo Illusion
        function drawPonzoIllusion() {
            ponzoCtx.clearRect(0, 0, ponzoCanvas.width, ponzoCanvas.height);

            // Draw converging lines
            ponzoCtx.beginPath();
            ponzoCtx.moveTo(convergingAngle - 100, 0); // Adjustable converging angle
            ponzoCtx.lineTo(300, 400);
            ponzoCtx.moveTo(600 - (convergingAngle - 100), 0); // Mirrored line for the other side
            ponzoCtx.lineTo(300, 400);
            ponzoCtx.strokeStyle = '#000';
            ponzoCtx.lineWidth = 2;
            ponzoCtx.stroke();

            // Draw top horizontal line
            ponzoCtx.beginPath();
            ponzoCtx.moveTo(300 - lineLength / 2, linePosition);
            ponzoCtx.lineTo(300 + lineLength / 2, linePosition);
            ponzoCtx.strokeStyle = '#ff6347'; // Tomato red
            ponzoCtx.lineWidth = 6;
            ponzoCtx.stroke();

            // Draw bottom horizontal line
            ponzoCtx.beginPath();
            ponzoCtx.moveTo(300 - lineLength / 2, 300);
            ponzoCtx.lineTo(300 + lineLength / 2, 300);
            ponzoCtx.strokeStyle = '#1e90ff'; // Dodger blue
            ponzoCtx.lineWidth = 6;
            ponzoCtx.stroke();
        }

        // Function to update the length of the horizontal lines
        function updateLineLength(value) {
            lineLength = value; // Set new line length
            drawPonzoIllusion(); // Redraw the Ponzo Illusion with updated length
        }

        // Function to update the position of the top horizontal line
        function updateLinePosition(value) {
            linePosition = value; // Set new line position
            drawPonzoIllusion(); // Redraw the Ponzo Illusion with updated position
        }

        // Function to update the angle of converging lines
        function updateConvergingAngle(value) {
            convergingAngle = value; // Set new converging angle
            drawPonzoIllusion(); // Redraw the Ponzo Illusion with updated angle
        }

        // Draw the initial Ponzo Illusion on the canvas
        drawPonzoIllusion();

        // Make the functions globally accessible
        window.updateLineLength = updateLineLength;
        window.updateLinePosition = updateLinePosition;
        window.updateConvergingAngle = updateConvergingAngle;
    }
    // Cafe Wall Illusion xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    // Café Wall Illusion Variables
    const cafeCanvas = document.getElementById('cafe-canvas');
    const cafeCtx = cafeCanvas ? cafeCanvas.getContext('2d') : null;
    let offset = 15; // Initial horizontal offset for the black squares

    // Check if cafeCanvas and cafeCtx exist before drawing
    if (cafeCtx) {
        // Function to draw the Café Wall Illusion
        function drawCafeWallIllusion() {
            cafeCtx.clearRect(0, 0, cafeCanvas.width, cafeCanvas.height);

            const tileSize = 40; // Size of each tile (both width and height)
            const rows = Math.ceil(cafeCanvas.height / tileSize); // Number of rows based on canvas height
            const cols = Math.ceil(cafeCanvas.width / tileSize); // Number of columns based on canvas width

            // Calculate starting position to center the pattern
            const startX = (cafeCanvas.width - cols * tileSize) / 2;
            const startY = (cafeCanvas.height - rows * tileSize) / 2;

            // Draw the checkerboard pattern
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Calculate the x position of the tile, applying the horizontal offset for black squares
                    const x = startX + col * tileSize + ((row % 2 === 0) ? 0 : offset);
                    const y = startY + row * tileSize;

                    // Alternate between black and white squares
                    if (col % 2 === 0) {
                        cafeCtx.fillStyle = '#000000'; // Black square
                    } else {
                        cafeCtx.fillStyle = '#ffffff'; // White square
                    }

                    // Draw the square
                    cafeCtx.fillRect(x, y, tileSize, tileSize);
                }
            }

            // Draw the mortar lines to complete the illusion
            cafeCtx.strokeStyle = '#888888'; // Gray for mortar lines
            cafeCtx.lineWidth = 4;
            for (let row = 0; row < rows + 1; row++) {
                // Draw horizontal mortar lines
                cafeCtx.beginPath();
                cafeCtx.moveTo(startX, startY + row * tileSize);
                cafeCtx.lineTo(startX + cols * tileSize, startY + row * tileSize);
                cafeCtx.stroke();
            }
        }

        // Function to update the horizontal offset of the black squares
        function updateCafeOffset(value) {
            offset = parseInt(value, 10); // Update the offset value
            drawCafeWallIllusion(); // Redraw the Café Wall Illusion with the updated offset
        }

        // Draw the initial Café Wall Illusion on the canvas
        drawCafeWallIllusion();

        // Make the function globally accessible
        window.updateCafeOffset = updateCafeOffset;
    }

    // After image Illusion xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const canvas = document.getElementById('afterimage-canvas');
    const ctx = canvas.getContext('2d');
    let shape = 'circle'; // Default shape
    let color = '#ff6347'; // Default color
    let spacing = 5; // Spacing between shapes in the grid
    let gridSize = 3; // Number of shapes per row/column
    let countdown = 30; // Timer countdown in seconds
    let countdownInterval; // Reference to the interval for the countdown
    let afterimageInterval; // Reference to the interval for afterimage reset
    let isCounting = false; // State variable to track if countdown is active

    const startStopButton = document.querySelector('.control-panel button');
    const timerDisplay = document.getElementById('timer-display');

    // Function to draw the fixation dot in the center of the canvas
    function drawFixationDot() {
        ctx.fillStyle = '#000000'; // Black dot
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Function to draw the grid of shapes on the canvas
    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

        // Calculate position for the grid
        const totalSize = 100; // Size of each shape
        const totalSpacing = spacing * (gridSize - 1); // Total spacing
        const offset = (canvas.width - (totalSize * gridSize + totalSpacing)) / 2;

        // Loop through the grid
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const x = offset + col * (totalSize + spacing) + totalSize / 2;
                const y = offset + row * (totalSize + spacing) + totalSize / 2;

                drawShape(x, y, totalSize / 2); // Draw each shape
            }
        }

        drawFixationDot(); // Draw the fixation dot on top of the shapes
    }

    // Function to draw the selected shape at a given position
    function drawShape(x, y, size) {
        ctx.fillStyle = color;
        ctx.beginPath();
        if (shape === 'circle') {
            ctx.arc(x, y, size, 0, 2 * Math.PI);
        } else if (shape === 'square') {
            ctx.rect(x - size, y - size, size * 2, size * 2);
        } else if (shape === 'triangle') {
            ctx.moveTo(x, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.lineTo(x + size, y + size);
            ctx.closePath();
        }
        ctx.fill();
    }

    // Function to set the shape type
    function setShape(selectedShape) {
        shape = selectedShape;
        drawGrid(); // Redraw the grid with new shape
    }

    // Function to set the color
    function setColor(selectedColor) {
        color = selectedColor;
        drawGrid(); // Redraw the grid with new color
    }

    // Function to start or stop the countdown and show afterimage effect
    function startStopAfterimage() {
        if (isCounting) {
            stopAfterimage(); // Stop the countdown and reset the task
        } else {
            startAfterimage(); // Start the countdown and show afterimage
        }
    }

    // Function to start the countdown and show afterimage effect
    function startAfterimage() {
        clearInterval(countdownInterval); // Clear any previous countdown
        clearInterval(afterimageInterval); // Clear any afterimage reset
        countdown = 30; // Reset countdown to 30 seconds
        timerDisplay.textContent = countdown; // Reset timer display
        drawGrid(); // Draw shapes on canvas

        countdownInterval = setInterval(() => {
            countdown--;
            timerDisplay.textContent = countdown;

            if (countdown <= 0) {
                clearInterval(countdownInterval);
                showAfterimage(); // Show afterimage effect when countdown reaches 0

                // Start afterimage reset timer after showing afterimage
                afterimageInterval = setTimeout(() => {
                    resetAfterimage(); // Reset the task after another 30 seconds
                }, 30000); // 30 seconds delay for afterimage effect
            }
        }, 1000);

        isCounting = true; // Set counting state to true
        startStopButton.textContent = 'Stop'; // Change button text to "Stop"
    }

    // Function to stop the countdown and reset the task
    function stopAfterimage() {
        clearInterval(countdownInterval); // Stop the countdown
        clearTimeout(afterimageInterval); // Stop afterimage reset
        resetAfterimage(); // Reset the task immediately
    }

    // Function to show the afterimage effect by clearing the canvas except the fixation dot
    function showAfterimage() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        drawFixationDot(); // Keep the fixation dot visible
    }

    // Function to reset the task and prepare for a new start
    function resetAfterimage() {
        countdown = 30; // Reset countdown to 30 seconds
        timerDisplay.textContent = countdown; // Reset timer display
        drawGrid(); // Redraw shapes on canvas
        isCounting = false; // Set counting state to false
        startStopButton.textContent = 'Start'; // Change button text to "Start"
    }

    // Initial draw of the grid with default shape and color
    drawGrid();

    // Make the functions globally accessible
    window.setShape = setShape;
    window.setColor = setColor;
    window.startStopAfterimage = startStopAfterimage;

    // Attach the start/stop function to the button click
    startStopButton.addEventListener('click', startStopAfterimage);
});

document.addEventListener('DOMContentLoaded', () => {
    // Reference to the Back to Top button
    const backToTopButton = document.getElementById('back-to-top');

    // Show or hide the button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });

    // Scroll back to top when button is clicked
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scrolling effect
        });
    });
});
