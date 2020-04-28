import { settings, utils, Application, SCALE_MODES } from 'pixi.js';
import { MapScene } from './scripts/MapScene';

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
  resolution: 1       // default: 1
});


document.body.appendChild(app.view);
app.renderer.resize(window.innerWidth, window.innerHeight);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

let mapScene = new MapScene(app);

mapScene.init();




