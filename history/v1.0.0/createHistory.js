import invariant from 'invariant';
import deepEqual from 'deep-equal';
import { PUSH, REPLACE } from './Actions';
import createLocation from './createLocation';

var DefaultKeyLength = 6;

function createRandomKey(length) {
	return Math.random().toString(36).substr(2, length);
}

function locationsAreEqual(a, b) {
	return (
		a.pathname === b.pathname &&
		a.search === b.search &&
		//a.action === b.action && // Different action !== location change.
		a.key === b.key &&
		deepEqual(a.state, b.state)
	);
}

function createHistory(options = {}) {
	// histroy 发生改变时的钩子函数
	var transitionHooks = [];
	// histroy事件监听函数
	var changeListeners = [];

	var {
    getCurrentLocation,
    // history改变后的钩子函数
    finishTransition,
    // 取消history改变后钩子函数
		cancelTransition,
		go,
		keyLength,
		getUserConfirmation,
	} = options;
	// history key的长度
	if (typeof keyLength !== 'number') keyLength = DefaultKeyLength;

	var location;
	// 更新location对象，并执行所有监听函数
	function updateLocation(newLocation) {
		location = newLocation;

		changeListeners.forEach(function (listener) {
			listener(location);
		});
	}
	// 添加监听函数
	function addChangeListener(listener) {
		changeListeners.push(listener);
	}
	// 移除监听函数
	function removeChangeListener(listener) {
		changeListeners = changeListeners.filter(item => item !== listener);
	}
	// 注册history事件监听函数
	function listen(listener) {
		addChangeListener(listener);
		// 事件监听函数注册后会立即执行

		if (location) {
			listener(location);
		} else {
			// 首次执行获取当前location对象并保存
			updateLocation(getCurrentLocation());
		}
    // 返回一个移除监听函数的函数
		return function () {
			removeChangeListener(listener);
		};
	}
  // 注册history改变时的钩子函数
	function registerTransitionHook(hook) {
		if (transitionHooks.indexOf(hook) === -1) transitionHooks.push(hook);
	}
  // 移除history改变时的钩子函数
	function unregisterTransitionHook(hook) {
		transitionHooks = transitionHooks.filter(item => item !== hook);
	}
  // 获取history改变时的提示信息
	function getTransitionConfirmationMessage() {
		var message = null;
    // 只获取第一个有效的提示信息
		for (var i = 0, len = transitionHooks.length; i < len && typeof message !== 'string'; ++i)
			message = transitionHooks[i].call(this);

		return message;
	}
  // histroy即将发生改变 确认是否要继续
	function confirmTransition(callback) {
		var message;
    // 必须同时注册了getUserConfirmation函数，并且钩子函数有效的返回提示语
		if (getUserConfirmation && (message = getTransitionConfirmationMessage())) {
			getUserConfirmation(message, function (ok) {
				callback(ok !== false);
			});
		} else {
			callback(true);
		}
	}

	var pendingLocation;

  function transitionTo(nextLocation) {
    //? 相同的location对象不执行操作, 什么时候不同？ 使用window.history获取state?
		if (location && locationsAreEqual(location, nextLocation)) return; // Nothing to do.

    // 上一次改变之后，才可进行下一次改变
		invariant(
			pendingLocation == null,
			'transitionTo: Another transition is already in progress'
		);

		pendingLocation = nextLocation;
    
		confirmTransition(function (ok) {
			pendingLocation = null;

			if (ok) {
				finishTransition(nextLocation);
				updateLocation(nextLocation);
			} else if (cancelTransition) {
				cancelTransition(nextLocation);
			}
		});
	}

	function pushState(state, path) {
		transitionTo(createLocation(path, state, PUSH, createKey()));
	}

	function replaceState(state, path) {
		transitionTo(createLocation(path, state, REPLACE, createKey()));
	}
  // 后退
	function goBack() {
		go(-1);
	}
  // 前进
	function goForward() {
		go(1);
	}
  // 创建唯一的key
	function createKey() {
		return createRandomKey(keyLength);
	}

	return {
		listen,
		registerTransitionHook,
		unregisterTransitionHook,
		getTransitionConfirmationMessage,
		transitionTo,
		pushState,
		replaceState,
		go,
		goBack,
		goForward,
		createKey,
	};
}

export default createHistory;
