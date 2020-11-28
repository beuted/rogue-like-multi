import { settings, utils, Application, SCALE_MODES } from 'pixi.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './scripts/App';

let type = "WebGL";
if (!utils.isWebGLSupported()) {
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

ReactDOM.render(
  <React.StrictMode>
    <App app={app} />
  </React.StrictMode>,
  document.getElementById('react-root')
);




