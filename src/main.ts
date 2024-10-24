import Interfaces from './interfaces';
import Game from './game';
import './style.css';
// const columns = 50,
// const baseImageSrc = './95494859_p0.jpg';
//   rows = 50;
const appDiv = document.getElementById('app') as HTMLDivElement;
// const svgContainer = document.getElementById('svg-container') as HTMLDivElement;
// init();
const interfaces = new Interfaces();
let game: Game;
interfaces.init().then((data) => {
  game = new Game(appDiv, data.src, data.rows, data.columns, data.optimization, data.borderColor);
});
interfaces.addGameControlEventListener('center', 'click', () => {
  game.toCenter();
});
interfaces.addGameControlEventListener('restart', 'click', () => {
  window.location.reload();
});
