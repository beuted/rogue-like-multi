export function keyboard(value: string): { press: Function, release: Function, unsubscribe: Function, isDown: boolean } {
  let key: any = {
    value: value,
    isDown: false,
    isUp: true,
    press: undefined,
    release: undefined,
    downHandler: undefined,
    upHandler: undefined,
  }
  //The `downHandler`
  key.downHandler = (event: KeyboardEvent) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
  };

  //The `upHandler`
  key.upHandler = (event: KeyboardEvent) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener(
    "keydown", downListener, false
  );
  window.addEventListener(
    "keyup", upListener, false
  );

  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };

  return key;
}