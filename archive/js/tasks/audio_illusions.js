document.addEventListener('DOMContentLoaded', () => {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let oscillator1, oscillator2;
    let gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);

    // Frequency map for pitch classes
    const frequencies = {
        'C': [261.63, 370], // C4 and a tritone above
        'D': [293.66, 415.3],
        'E': [329.63, 466.16],
        'F': [349.23, 493.88],
        'G': [392.00, 554.37],
        'A': [440.00, 622.25],
        'B': [493.88, 698.46]
    };

    // Function to play a pair of tones for the Tritone Paradox with a delay
    function playTritone(note) {
        if (isPlaying) stopTritone(); // Stop any currently playing tones

        isPlaying = true;
        let [freq1, freq2] = frequencies[note];

        // Create first oscillator
        oscillator1 = audioContext.createOscillator();
        oscillator1.frequency.value = freq1;
        oscillator1.connect(gainNode);

        // Create second oscillator
        oscillator2 = audioContext.createOscillator();
        oscillator2.frequency.value = freq2;
        oscillator2.connect(gainNode);

        // Start the first oscillator immediately
        oscillator1.start();

        // Stop the first oscillator after 1 second
        setTimeout(() => {
            if (isPlaying) oscillator1.stop();
        }, 1000);

        // Start the second oscillator after a 0.5-second gap
        setTimeout(() => {
            if (isPlaying) oscillator2.start();
        }, 1500); // 1000 ms (1 second for the first tone) + 500 ms (gap)

        // Stop the second oscillator after 1 second of playing
        setTimeout(() => {
            if (isPlaying) stopTritone();
        }, 2500); // 1500 ms (start of second tone) + 1000 ms (length of second tone)
    }

    // Function to stop playing the tritone
    function stopTritone() {
        if (!isPlaying) return;

        oscillator1.stop();
        oscillator2.stop();
        isPlaying = false;
    }

    // Make play and stop functions globally accessible
    window.playTritone = playTritone;
    window.stopTritone = stopTritone;
});
