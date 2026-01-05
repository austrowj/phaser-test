import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    // Display environment variable
    const buildInfo = document.createElement('div');
    buildInfo.textContent = `Latest build on: ${import.meta.env.VITE_BUILD_DATE || 'N/A'}`;
    document.body.appendChild(buildInfo);

    StartGame('game-container');

});
