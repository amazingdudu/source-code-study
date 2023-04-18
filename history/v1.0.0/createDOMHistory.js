import invariant from 'invariant';
import { canUseDOM } from './ExecutionEnvironment';
import { addEventListener, removeEventListener, saveState, readState, go } from './DOMUtils';
import createHistory from './createHistory';

function getUserConfirmation(message, callback) {
  callback(window.confirm(message));
}
// 当浏览器窗口关闭或者刷新时，会触发 beforeunload 事件。当前页面不会直接关闭，可以点击确定按钮关闭或刷新，也可以取消关闭或刷新。
function startBeforeUnloadListener({ getTransitionConfirmationMessage }) {
  function listener(event) {
    var message = getTransitionConfirmationMessage();

    if (typeof message === 'string') {
      (event || window.event).returnValue = message;
      return message;
    }
  }

  addEventListener(window, 'beforeunload', listener);

  return function () {
    removeEventListener(window, 'beforeunload', listener);
  };
}

function createDOMHistory(options) {
  var history = createHistory({
    getUserConfirmation,
    ...options,
    saveState,
    readState,
    go
  });

  var listenerCount = 0;
  var stopBeforeUnloadListener;

  function listen(listener) {
    invariant(
      canUseDOM,
      'DOM history needs a DOM'
    );
    // 注册第一个监听函数时，注册beforeunload事件
    if (++listenerCount === 1)
      stopBeforeUnloadListener = startBeforeUnloadListener(history);

    var unlisten = history.listen(listener);

    return function () {
      unlisten();

      if (--listenerCount === 0)
        stopBeforeUnloadListener();
    };
  }

  return {
    ...history,
    listen
  };
}

export default createDOMHistory;
