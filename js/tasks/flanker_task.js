document.addEventListener('DOMContentLoaded', () => {
    const flankerDisplay = document.getElementById('flanker-display');
    const resultsDisplay = document.getElementById('results');
    const scoreDisplay = document.getElementById('score');
    const congruentRTDisplay = document.getElementById('congruent-rt');
    const incongruentRTDisplay = document.getElementById('incongruent-rt');
    const feedbackDisplay = document.getElementById('feedback'); // Feedback element
    const resetButton = document.getElementById('reset-btn');
    const startButtonContainer = document.getElementById('start-button-container');
    const startButton = document.getElementById('start-btn');
    const keyInstruct = document.getElementById('keys');

    const arrows = ['←', '→']; // Array of possible arrow directions
    let currentFlanker; // To hold the current set of arrows
    let correctResponse; // To store the correct response
    let startTime; // To measure reaction time

    let totalTrials = 20; // Total number of trials
    let currentTrial = 0; // Current trial counter
    let correctResponses = 0; // Count correct responses
    let congruentRTs = []; // Store reaction times for congruent trials
    let incongruentRTs = []; // Store reaction times for incongruent trials

    // Function to generate a new set of arrows
    function generateFlanker() {
        if (currentTrial >= totalTrials) {
            displayResults(); // Show results after the last trial
            return;
        }

        const target = arrows[Math.floor(Math.random() * arrows.length)]; // Random target arrow
        const flanker = Math.random() > 0.5 ? target : arrows.find(arrow => arrow !== target); // Random flanker (same or different)

        // Generate 5 arrows with the target in the middle
        currentFlanker = `${flanker} ${flanker} ${target} ${flanker} ${flanker}`;
        flankerDisplay.textContent = currentFlanker;
        flankerDisplay.style.opacity = 1; // Show flanker display

        // Set the correct response based on the target arrow
        correctResponse = target === '←' ? 'ArrowLeft' : 'ArrowRight';
        startTime = new Date().getTime(); // Record start time

        // Increment trial counter
        currentTrial++;
    }

    // Function to show a fixation cross
    function showFixationCross() {
        flankerDisplay.textContent = '+'; // Display the fixation cross
    }

    // Function to handle user response
    function handleResponse(event) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            const reactionTime = new Date().getTime() - startTime;
            if (event.key === correctResponse) {
                correctResponses++;
                if (currentFlanker.includes(`${correctResponse === 'ArrowLeft' ? '←' : '→'} ${correctResponse === 'ArrowLeft' ? '←' : '→'}`)) {
                    congruentRTs.push(reactionTime); // Store reaction time for congruent trial
                } else {
                    incongruentRTs.push(reactionTime); // Store reaction time for incongruent trial
                }
            }
            // Show the fixation cross after the response and then generate a new flanker
            setTimeout(() => {
                showFixationCross();
                setTimeout(generateFlanker, 500); // Show fixation cross for 500 ms before the next trial
            }, 500); // 500ms gap between response and fixation cross
        }
    }

    // Function to display results
    function displayResults() {
        flankerDisplay.textContent = ''; // Clear fixation cross when task ends
        flankerDisplay.classList.add('hidden'); // Hide flanker display
        resultsDisplay.classList.remove('hidden'); // Show results
        keyInstruct.classList.add('hidden');


        // Calculate average reaction times
        const averageCongruentRT = congruentRTs.length ? (congruentRTs.reduce((a, b) => a + b, 0) / congruentRTs.length).toFixed(2) : 'N/A';
        const averageIncongruentRT = incongruentRTs.length ? (incongruentRTs.reduce((a, b) => a + b, 0) / incongruentRTs.length).toFixed(2) : 'N/A';

        scoreDisplay.textContent = `Total Score: ${correctResponses} / ${totalTrials}`;
        congruentRTDisplay.textContent = `Average Reaction Time (Congruent): ${averageCongruentRT} ms`;
        incongruentRTDisplay.textContent = `Average Reaction Time (Incongruent): ${averageIncongruentRT} ms`;

        // Feedback based on score and reaction times
        let feedbackMessage = '';
        if (correctResponses >= 15) {
            feedbackMessage = 'Well done! You responded correctly to most of the trials.';
        } else {
            feedbackMessage = 'This task can be challenging due to the distracting arrows. Keep practicing!';
        }

        // Compare reaction times
        if (averageIncongruentRT !== 'N/A' && averageCongruentRT !== 'N/A') {
            if (averageIncongruentRT > averageCongruentRT) {
                feedbackMessage += ' Your reaction time was slower for incongruent trials, which is expected as conflicting information takes longer to process.';
            } else {
                feedbackMessage += ' You had similar reaction times for both congruent and incongruent trials, indicating good cognitive control!';
            }
        }

        feedbackDisplay.textContent = feedbackMessage;
    }

    // Function to start the task
    function startTask() {
        startButtonContainer.style.display = 'none'; // Hide start button container
        resultsDisplay.classList.add('hidden'); // Hide results
        flankerDisplay.classList.remove('hidden'); // Show flanker display
        keyInstruct.classList.remove('hidden');
        correctResponses = 0; // Reset correct responses
        currentTrial = 0; // Reset trial counter
        congruentRTs = []; // Reset reaction times
        incongruentRTs = []; // Reset reaction times
        generateFlanker(); // Start generating trials
    }

    // Function to reset the task
    function resetTask() {
        resultsDisplay.classList.add('hidden'); // Hide results
        flankerDisplay.textContent = ''; // Clear flanker display
        flankerDisplay.classList.add('hidden'); // Hide flanker display
        startButtonContainer.style.display = 'flex'; // Show start button container
        currentTrial = 0; // Reset trial counter
        correctResponses = 0; // Reset correct responses
        congruentRTs = []; // Reset reaction times
        incongruentRTs = []; // Reset reaction times
    }

    // Event listeners
    startButton.addEventListener('click', startTask);
    resetButton.addEventListener('click', resetTask);
    document.addEventListener('keydown', handleResponse);
});
