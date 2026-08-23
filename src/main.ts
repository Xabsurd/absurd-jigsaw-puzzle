import '@picocss/pico/css/pico.blue.min.css';
import './style.css';
import GameUI from './ui/GameUI';
import Game from './game/Game';

const appDiv = document.getElementById('app') as HTMLDivElement;
const ui = new GameUI();
const game = new Game(appDiv);
appDiv.style.backgroundColor = ui.settings.backgroundColor;

ui.onStart = async (config) => {
  game.onProgress = (done, total) => ui.setLoading(done, total);
  game.onFinish = () => ui.finish();
  game.onStats = (merged, total, groups) => ui.setProgress(merged, total, groups);
  game.onFps = (fps) => ui.setFps(fps);
  ui.showLoading();
  try {
    await game.play(config);
    ui.hideLoading();
    ui.startTimer();
  } catch (error) {
    await game.dispose();
    ui.hideLoading();
    ui.showMenu();
    ui.alert('无法开始', error instanceof Error ? error.message : String(error));
  }
};

ui.onCenter = () => game.toCenter();

ui.onRestart = async () => {
  if (!(await ui.confirmRestart())) return;
  ui.stopTimer();
  await game.dispose();
  ui.showMenu();
};

ui.onDisplayChange = (settings) => {
  appDiv.style.backgroundColor = settings.backgroundColor;
  game.applyDisplay(settings);
};
