// main.js
function startTask(taskName) {
    // Navigate to the appropriate task page
    window.location.href = `tasks/${taskName}.html`;
}

// Automatically enter fullscreen mode
function goFullscreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { // Firefox
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
        document.documentElement.msRequestFullscreen();
    }
}

// Automatically go fullscreen when a task is started
window.addEventListener('load', () => {
    goFullscreen();
});
