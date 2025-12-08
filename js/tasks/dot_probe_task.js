document.addEventListener('DOMContentLoaded', () => {
    const dotDisplay = document.getElementById('dot-display');
    const resultsDisplay = document.getElementById('results');
    const scoreDisplay = document.getElementById('score');
    const averageRTDisplay = document.getElementById('average-rt');
    const feedbackDisplay = document.getElementById('feedback');
    const resetButton = document.getElementById('reset-btn');
    const startButtonContainer = document.getElementById('start-button-container');
    const startButton = document.getElementById('start-btn');

    let totalTrials = 20; // Total number of trials
    let currentTrial = 0; // Current trial counter
    let correctResponses = 0; // Count correct responses
    let reactionTimes = []; // Store reaction times

    let acceptingResponses = false; // Flag to control key press handling

    // Stimuli variables

    const cakeImages = ['cake1.jpg', 'cake2.jpg', 'cake3.jpg', 'cake4.jpg'];
    const snakeImages = ['snake1.jpg', 'snake2.jpg', 'snake3.jpg', 'snake4.jpg'];
    let cakeReactionTimes = []; // Store reaction times when the dot appears after the cake
    let snakeReactionTimes = []; // Store reaction times when the dot appears after the snake


    const dotSide = ['left', 'right']; // Possible sides for dot
    const fixationDuration = 500; // Fixation cross duration in ms
    const stimuliDuration = 1000; // Duration for stimuli in ms

    // Function to generate a new set of stimuli
    function generateTrial() {
        if (currentTrial >= totalTrials) {
            displayResults(); // Show results after the last trial
            return;
        }

        acceptingResponses = false; // Disable response handling during fixation and stimuli
        showFixationCross(); // Show fixation cross

        setTimeout(() => {
            showStimuli(); // Show stimuli
            setTimeout(() => {
                showDot(); // Show dot after stimuli
            }, stimuliDuration);
        }, fixationDuration);
    }

    // Function to show fixation cross
    function showFixationCross() {
        dotDisplay.innerHTML = `
            <div class="dot-section left"></div>
            <div class="dot-section middle">
                <div class="fixation">+</div>
            </div>
            <div class="dot-section right"></div>
        `;
    }

    function showStimuli() {
        // Randomly select a cake and a snake image
        const cakeImage = cakeImages[Math.floor(Math.random() * cakeImages.length)];
        const snakeImage = snakeImages[Math.floor(Math.random() * snakeImages.length)];

        // Randomly assign the cake and snake to either the left or right side
        const stimuliLeftRight = Math.random() < 0.5 ? { left: cakeImage, right: snakeImage } : { left: snakeImage, right: cakeImage };

        dotDisplay.innerHTML = `
            <div class="dot-section left">
                <img src="../assets/${stimuliLeftRight.left}" alt="Left Stimulus" class="stimulus-img">
            </div>
            <div class="dot-section middle">
            </div>
            <div class="dot-section right">
                <img src="../assets/${stimuliLeftRight.right}" alt="Right Stimulus" class="stimulus-img">
            </div>
        `;

        // Store the position of the cake (left or right) for the dot placement
        dotDisplay.dataset.cakeSide = stimuliLeftRight.left === cakeImage ? 'left' : 'right';
    }


    // Function to show dot
    function showDot() {
        // Randomly decide whether the dot should appear on the cake or the snake side
        const dotAfterCake = Math.random() < 0.5; // 50% chance of dot appearing after cake
    
        const side = dotAfterCake ? dotDisplay.dataset.cakeSide : (dotDisplay.dataset.cakeSide === 'left' ? 'right' : 'left'); // Dot appears on the same side as cake or opposite side
        const dotPositionClass = side === 'left' ? 'left' : 'right'; // Determine position class
    
        // Display the dot
        dotDisplay.innerHTML = `
            <div class="dot-section left">
                ${side === 'left' ? '<div class="dot">•</div>' : ''}
            </div>
            <div class="dot-section middle">
            </div>
            <div class="dot-section right">
                ${side === 'right' ? '<div class="dot">•</div>' : ''}
            </div>
        `;
        dotDisplay.dataset.correctSide = side; // Set the correct side for response checking
        dotDisplay.dataset.dotAfterCake = dotAfterCake; // Store whether the dot was after cake or snake
        startTime = new Date().getTime(); // Start reaction time measurement
        acceptingResponses = true; // Enable response handling after dot is shown
    }
    

    function handleResponse(event) {
        if (!acceptingResponses) return; // Ignore key presses if not accepting responses
    
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const correctKey = dotDisplay.dataset.correctSide === 'left' ? 'ArrowLeft' : 'ArrowRight';
            const reactionTime = new Date().getTime() - startTime; // Measure reaction time
    
            if (event.key === correctKey) {
                correctResponses++; // Count correct responses
    
                // Track reaction time based on whether the dot appeared after cake or snake
                if (dotDisplay.dataset.dotAfterCake === 'true') {
                    cakeReactionTimes.push(reactionTime); // Dot after cake
                } else {
                    snakeReactionTimes.push(reactionTime); // Dot after snake
                }
            }
    
            currentTrial++; // Move to the next trial
            generateTrial(); // Start the next trial
        }
    }
    

    function displayResults() {
        dotDisplay.textContent = ''; // Clear fixation cross when task ends
        dotDisplay.classList.add('hidden'); // Hide dot display
        resultsDisplay.classList.remove('hidden'); // Show results
    
        // Calculate average reaction times for cake and snake trials
        const averageCakeRT = cakeReactionTimes.length ? (cakeReactionTimes.reduce((a, b) => a + b, 0) / cakeReactionTimes.length).toFixed(2) : 'N/A';
        const averageSnakeRT = snakeReactionTimes.length ? (snakeReactionTimes.reduce((a, b) => a + b, 0) / snakeReactionTimes.length).toFixed(2) : 'N/A';
    
        scoreDisplay.textContent = `Total Correct Responses: ${correctResponses} / ${totalTrials}`;
        averageRTDisplay.innerHTML = `
            Average Reaction Time for Cake: ${averageCakeRT} ms<br>
            Average Reaction Time for Snake: ${averageSnakeRT} ms
        `;
    
        // Display feedback
        let feedbackMessage = '';
        if (correctResponses >= 15) {
            feedbackMessage = 'Great job! You responded accurately to most of the trials.';
        } else {
            feedbackMessage = 'This task can be challenging. Try focusing on the fixation cross to improve your performance.';
        }
        feedbackDisplay.textContent = feedbackMessage;
    }
    

    // Function to start the task
    function startTask() {
        startButtonContainer.classList.add('hidden'); // Hide start button container
        resultsDisplay.classList.add('hidden'); // Hide results
        dotDisplay.classList.remove('hidden'); // Show dot display
        correctResponses = 0; // Reset correct responses
        currentTrial = 0; // Reset trial counter
        reactionTimes = []; // Reset reaction times
        generateTrial(); // Start generating trials
    }

    // Function to reset the task
    function resetTask() {
        resultsDisplay.classList.add('hidden'); // Hide results
        dotDisplay.textContent = ''; // Clear dot display
        startButtonContainer.classList.remove('hidden'); // Show start button
        dotDisplay.classList.add('hidden'); // Hide dot display
        currentTrial = 0; // Reset trial counter
        correctResponses = 0; // Reset correct responses
        reactionTimes = []; // Reset reaction times
    }

    // Event listeners
    startButton.addEventListener('click', startTask);
    resetButton.addEventListener('click', resetTask);
    document.addEventListener('keydown', handleResponse);
});
