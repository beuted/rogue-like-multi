import { settings, utils, Application, SCALE_MODES } from 'pixi.js';
import { BoardScene } from './scripts/BoardScene';

let type = "WebGL";
if (!utils.isWebGLSupported()){
  type = "canvas";
}

utils.sayHello(type);

settings.ROUND_PIXELS = true;
settings.SCALE_MODE = SCALE_MODES.NEAREST

//Create a Pixi Application
let app = new Application({
  width: 256,         // default: 800
  height: 256,        // default: 600
  antialias: true,    // default: false
  transparent: false, // default: false
  resolution: 1,       // default: 1
  resizeTo: window
});

document.getElementById('game').appendChild(app.view);
//app.renderer.resize(window.innerWidth, window.innerHeight);

let boardScene = new BoardScene(app);

boardScene.init();




