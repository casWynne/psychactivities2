// Card class definition
class Card {
    constructor(number, shape, color) {
        this.number = number; // Number of shapes (1-4)
        this.shape = shape;   // Shape type (square, circle, triangle, cross)
        this.color = color;   // Color (red, yellow, green, blue)
    }

    // Function to generate the HTML for the card
    createCardElement(onClickHandler) {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');

        for (let i = 0; i < this.number; i++) {
            const shapeDiv = document.createElement('div');
            shapeDiv.classList.add('shape', this.shape, this.color);
            cardDiv.appendChild(shapeDiv);
        }

        // Check if onClickHandler is a function before adding the event listener
        if (typeof onClickHandler === 'function') {
            cardDiv.addEventListener('click', () => {
                onClickHandler(this); // Pass the current card to the handler
            });
        }

        return cardDiv;
    }
}

// Function to shuffle the deck array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

// Function to randomly select a rule: either 'number', 'color', or 'shape'
function getRandomRule() {
    const rules = ['number', 'color', 'shape'];
    return rules[Math.floor(Math.random() * rules.length)];
}

// Function to check if the selected card matches the rule
function checkRule(rule, targetCard, selectedCard) {
    if (rule === 'number') {
        return targetCard.number === selectedCard.number;
    } else if (rule === 'color') {
        return targetCard.color === selectedCard.color;
    } else if (rule === 'shape') {
        return targetCard.shape === selectedCard.shape;
    }
}

// Function to pick one card from each color category
function getCardsForAllColors(deck, excludeCard) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const cardsForAllColors = [];

    colors.forEach(color => {
        const card = deck.find(card => card.color === color && 
            !(card.number === excludeCard.number && card.shape === excludeCard.shape && card.color === excludeCard.color));
        
        if (card) {
            cardsForAllColors.push(card);
        }
    });

    return cardsForAllColors;
}

// Initialize variables for multiple trials
let currentTrial = 0;
const totalTrials = 20; // Set the number of trials
let currentRule = getRandomRule(); // Initial rule
let consecutiveCorrect = 0; // Counter for consecutive correct answers
let correctAnswers = 0; // Total number of correct answers

// Function to update the score display
function updateScoreDisplay() {
    const scoreContainer = document.getElementById('score');
    if (scoreContainer) { // Check if the scoreContainer element exists
        scoreContainer.textContent = `Score: ${correctAnswers}`;
    }
}

// Function to display feedback between trials and hide/show cards
function showFeedback(isCorrect) {
    const feedbackContainer = document.getElementById('feedback');
    const targetContainer = document.getElementById('target-card');
    const choiceContainer = document.getElementById('choice-cards');

    // Step 1: Hide the cards
    targetContainer.style.visibility = "hidden";
    choiceContainer.style.visibility = "hidden";

    // Step 2: Show the feedback after a short delay
    setTimeout(() => {
        feedbackContainer.textContent = isCorrect ? "Correct!" : "Incorrect!";
        feedbackContainer.style.visibility = "visible"; // Show feedback

        // Step 3: Hide feedback after a delay
        setTimeout(() => {
            feedbackContainer.style.visibility = "hidden"; // Hide feedback

            // Step 4: Show new cards for the next trial
            startTrial(currentDeck); // Start the next trial

            targetContainer.style.visibility = "visible";
            choiceContainer.style.visibility = "visible";
        }, 1000); // Feedback is visible for 1 second

    }, 500); // Cards are hidden for 0.5 seconds before showing feedback
}

// Function to display final results and show the reset button
function showResults() {
    const feedbackContainer = document.getElementById('feedback');
    feedbackContainer.style.visibility = "visible";
    feedbackContainer.textContent = `Experiment Complete! Final Score: ${correctAnswers} out of ${totalTrials}`;
    
    // Show the reset button
    const resetButton = document.getElementById('reset-button');
    resetButton.style.display = 'block';
}

// Function to reset the task
function resetTask() {
    // Reset all variables
    currentTrial = 0;
    correctAnswers = 0;
    consecutiveCorrect = 0;
    currentRule = getRandomRule();

    // Hide the reset button
    const resetButton = document.getElementById('reset-button');
    resetButton.style.display = 'none';

    // Remove the headers (Target Card, Cards Choices, and Score)
    const taskContainer = document.getElementById('task-container');
    
    const targetHeader = taskContainer.querySelector('h3:nth-of-type(1)');
    const choiceHeader = taskContainer.querySelector('h3:nth-of-type(2)');
    const scoreContainer = document.getElementById('score');
    
    if (targetHeader) taskContainer.removeChild(targetHeader);
    if (choiceHeader) taskContainer.removeChild(choiceHeader);
    if (scoreContainer) taskContainer.removeChild(scoreContainer);

    // Hide the target card and choice cards
    const targetContainer = document.getElementById('target-card');
    const choiceContainer = document.getElementById('choice-cards');
    targetContainer.innerHTML = '';
    choiceContainer.innerHTML = '';

    // Hide feedback
    const feedbackContainer = document.getElementById('feedback');
    feedbackContainer.style.visibility = 'hidden';
    feedbackContainer.textContent = '';

    // Show the start button again
    const startButton = document.getElementById('start-button');
    startButton.style.display = 'block';
}



// Function to initialize a new trial
let currentDeck;
function startTrial(deck) {
    currentDeck = deck; // Store the deck for the next trial
    
    // Clear the display areas
    const targetContainer = document.getElementById('target-card');
    const choiceContainer = document.getElementById('choice-cards');
    targetContainer.innerHTML = '';
    choiceContainer.innerHTML = '';

    if (currentTrial >= totalTrials) {
        // If all trials are done, display the final results
        showResults();
        return;
    }

    // Update score display
    updateScoreDisplay();

    // Pick a target card randomly
    const shuffledDeck = shuffle([...deck]); // Shuffle the deck for each trial
    const targetCard = shuffledDeck[Math.floor(Math.random() * shuffledDeck.length)];

    // Ensure all four colors are represented in the choice cards
    let choiceCards = getCardsForAllColors(shuffledDeck, targetCard);
    
    // Check if we have four cards (one for each color)
    if (choiceCards.length < 4) {
        // If we don't have four different colors, fill in the remaining cards from the deck
        const additionalCardsNeeded = 4 - choiceCards.length;
        const additionalCards = shuffle(
            shuffledDeck.filter(card => !choiceCards.includes(card))
        ).slice(0, additionalCardsNeeded);
        
        choiceCards = choiceCards.concat(additionalCards);
    }

    // Ensure one choice card matches the rule (replace one card if necessary)
    if (!choiceCards.some(card => checkRule(currentRule, targetCard, card))) {
        // No card matches the rule, so replace a random card with a matching one
        const matchingCard = shuffledDeck.find(card => checkRule(currentRule, targetCard, card));
        if (matchingCard) {
            // Replace a random card in the choice set with the matching card
            choiceCards[Math.floor(Math.random() * choiceCards.length)] = matchingCard;
        }
    }

    // Shuffle the choice cards to randomize positions
    shuffle(choiceCards);

    // Display the target card
    targetContainer.appendChild(targetCard.createCardElement());

    // Display the choice cards with click handlers
    choiceCards.forEach(choiceCard => {
        // Ensure we pass a function as an onClickHandler
        choiceContainer.appendChild(choiceCard.createCardElement((selectedCard) => {
            // Check if the selected card matches the rule
            const isCorrect = checkRule(currentRule, targetCard, selectedCard);

            if (isCorrect) {
                correctAnswers++; // Increment correct answer count
                consecutiveCorrect++;
            } else {
                consecutiveCorrect = 0; // Reset counter on incorrect choice
            }

            // Change the rule if 5 consecutive correct answers are reached
            if (consecutiveCorrect >= 5) {
                currentRule = getRandomRule(); // Change rule silently without alert
                consecutiveCorrect = 0; // Reset the consecutive correct counter
            }

            // Move to the next trial and show feedback
            currentTrial++;
            showFeedback(isCorrect);
        }));
    });
}

let playCount = 0;

function startTask() {
    playCount++; // Increment play count
    document.getElementById('play-count').textContent = playCount; // Update the displayed play count
    
    // Hide the start button
    const startButton = document.getElementById('start-button');
    startButton.style.display = 'none';

    // Dynamically create and display the Target Card and Cards Choices headers
    const targetContainer = document.getElementById('target-card');
    const choiceContainer = document.getElementById('choice-cards');
    
    const taskContainer = document.getElementById('task-container');
    
    // Create and add the Target Card header
    const targetHeader = document.createElement('h3');
    targetHeader.textContent = 'Target Card';
    taskContainer.insertBefore(targetHeader, targetContainer);

    // Create and add the Cards Choices header
    const choiceHeader = document.createElement('h3');
    choiceHeader.textContent = 'Card Choices';
    taskContainer.insertBefore(choiceHeader, choiceContainer);

    // Create and add the Score section
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'score';
    scoreContainer.textContent = `Score: ${correctAnswers}`;
    taskContainer.insertBefore(scoreContainer, targetHeader);

    // Start the first trial
    fetch('../data/cards.json')
        .then(response => response.json())
        .then(data => {
            const cardDeck = data.map(cardData => new Card(cardData.number, cardData.shape, cardData.color));
            startTrial(cardDeck); // Start the first trial
        })
        .catch(error => console.error('Error loading cards:', error));
}
