import $$observable from './utils/symbol-observable';

import ActionTypes from './utils/actionTypes';
import isPlainObject from './utils/isPlainObject';
import { kindOf } from './utils/kindOf';

/**
 * Creates a Redux store that holds the state tree.
 * * 创建一个保存状态树的redux store
 * The only way to change the data in the store is to call `dispatch()` on it.
 * * 更改store中的数据的唯一方法是对其调用' dispatch() '
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 * * 一个应用只应该有一个store
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 * * 给定当前状态树和要处理的action，返回下一个状态树的函数。
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 * * 初始state， 可以选择指定服务端渲染初始state，或恢复以前序列化的用户会话
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 * * store增强器。可以选择指定它，以便使用第三方功能(如中间件、时间旅行、持久性等)来增强store。
 * * Redux附带的唯一store增强器是“applyMiddleware()”。
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 * * Redux存储，允许您读取状态、分派操作和订阅更改。
 */
export default function createStore(reducer, preloadedState, enhancer) {
	// *校验参数是否合法，enchaner 只能是一个函数，多个enchaner可以使用compose函数组合起来
	if (
		(typeof preloadedState === 'function' && typeof enhancer === 'function') ||
		(typeof enhancer === 'function' && typeof arguments[3] === 'function')
	) {
		throw new Error(
			'It looks like you are passing several store enhancers to ' +
				'createStore(). This is not supported. Instead, compose them ' +
				'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
		);
	}
	// 没有preloadedState时，修正参数
	if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
		enhancer = preloadedState;
		preloadedState = undefined;
	}
	// 校验enhancer是否为函数
	if (typeof enhancer !== 'undefined') {
		if (typeof enhancer !== 'function') {
			throw new Error(
				`Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`
			);
		}
		// 增强store直接返回，enhancer内部会再次执行createStore
		return enhancer(createStore)(reducer, preloadedState);
	}
	// 校验reducer是否为函数
	if (typeof reducer !== 'function') {
		throw new Error(
			`Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`
		);
	}

	let currentReducer = reducer;
	let currentState = preloadedState;
	let currentListeners = [];
	let nextListeners = currentListeners;
	// 用于标记是否正在dispatching
	let isDispatching = false;

	/**
	 * This makes a shallow copy of currentListeners so we can use
	 * nextListeners as a temporary list while dispatching.
	 * * 这将创建一个currentListeners的浅拷贝，这样我们就可以在调度时使用nextListeners作为临时列表。
	 *
	 * This prevents any bugs around consumers calling
	 * subscribe/unsubscribe in the middle of a dispatch.
	 * * 这可以防止在调度过程中调用subscribe/unsubscribe的消费者出现任何bug。
	 * * 在依次执行listeners事件时，再次subscribe一个listener，会导致数组长度改变，新添加的listener也会被执行
	 */

	/*
	 * 防止下面情况造成异常
	 *
	 * store.subscribe(function () {
	 *	  store.subscribe(function () {
	 *		  console.log(2);
	 *	  });
	 *    console.log(1);
	 *   });
	 *
	 */

	function ensureCanMutateNextListeners() {
		if (nextListeners === currentListeners) {
			nextListeners = currentListeners.slice();
		}
	}

	/**
	 * Reads the state tree managed by the store.
	 * * 返回应用程序的当前状态树。
	 * @returns {any} The current state tree of your application.
	 */
	function getState() {
		if (isDispatching) {
			throw new Error(
				'You may not call store.getState() while the reducer is executing. ' +
					'The reducer has already received the state as an argument. ' +
					'Pass it down from the top reducer instead of reading it from the store.'
			);
		}

		return currentState;
	}

	/**
	 * Adds a change listener. It will be called any time an action is dispatched,
	 * and some part of the state tree may potentially have changed. You may then
	 * call `getState()` to read the current state tree inside the callback.
	 * * 添加listener，每次dispatch action 都会被调用，并且状态树的某些部分可能已经改变，
	 * * 可以调用' getState() '来读取回调函数中的当前状态树。
	 *
	 * You may call `dispatch()` from a change listener, with the following
	 * caveats:
	 *
	 * 1. The subscriptions are snapshotted just before every `dispatch()` call.
	 * If you subscribe or unsubscribe while the listeners are being invoked, this
	 * will not have any effect on the `dispatch()` that is currently in progress.
	 * However, the next `dispatch()` call, whether nested or not, will use a more
	 * recent snapshot of the subscription list.
	 * * 订阅在每次' dispatch() '调用之前都会被快照。如果您在调用侦听器时订阅或取消订阅，
	 * * 这将不会对当前正在进行的' dispatch() '产生任何影响。
	 * * 然而，下一个' dispatch() '调用，无论是否嵌套，都将使用订阅列表的最新快照。
	 *
	 * 2. The listener should not expect to see all state changes, as the state
	 * might have been updated multiple times during a nested `dispatch()` before
	 * the listener is called. It is, however, guaranteed that all subscribers
	 * registered before the `dispatch()` started will be called with the latest
	 * state by the time it exits.
	 * ? 侦听器不应期望看到所有状态更改，因为在调用侦听器之前，状态可能在嵌套的`dispatch()` 期间已多次更新。
	 * ? 但是，可以保证在 `dispatch()` 开始之前注册的所有订阅者将在退出时以最新状态调用。
	 *
	 * @param {Function} listener A callback to be invoked on every dispatch.
	 * @returns {Function} A function to remove this change listener.
	 */
	function subscribe(listener) {
		// 检验listener是否为函数
		if (typeof listener !== 'function') {
			throw new Error(
				`Expected the listener to be a function. Instead, received: '${kindOf(listener)}'`
			);
		}

		/*
		 * 不允许如下操作，这会导致每次dispatch都会添加重复的listener
		 * function reducer(state, action) {
		 *		switch (action.type) {
		 *			case 'increment':
		 *				return state + 1;
		 *			case 'decrement': {
		 *				store.subscribe(function () {
		 *					console.log(1);
		 *				});
		 *				return state - 1;
		 *			}
		 *			default:
		 *				return state;
		 *		}
		 *	}
		 */

		// 在reducer执行阶段不能添加新的listener
		if (isDispatching) {
			throw new Error(
				'You may not call store.subscribe() while the reducer is executing. ' +
					'If you would like to be notified after the store has been updated, subscribe from a ' +
					'component and invoke store.getState() in the callback to access the latest state. ' +
					'See https://redux.js.org/api/store#subscribelistener for more details.'
			);
		}
		// 标记是否订阅
		let isSubscribed = true;
		// 拷贝新的订阅列表，以防止加入到旧的订阅列表
		ensureCanMutateNextListeners();
		// 添加至订阅队列中
		nextListeners.push(listener);

		return function unsubscribe() {
			// 如果取消了订阅，不需要再次取消请阅
			if (!isSubscribed) {
				return;
			}

			if (isDispatching) {
				throw new Error(
					'You may not unsubscribe from a store listener while the reducer is executing. ' +
						'See https://redux.js.org/api/store#subscribelistener for more details.'
				);
			}
			// 取消订阅
			isSubscribed = false;

			/*
			 * 如下场景，可以保证第三个listener在首次dispatch时正常执行， 在下次dispatch时不会执行
			 * const un1 = store.subscribe(function () {
			 *	  console.log(1);
			 * });
			 *
			 * const un2 = store.subscribe(function () {
			 *	  console.log(2);
			 *	  un3();
			 * });
			 *
			 * const un3 = store.subscribe(function () {
			 *	 console.log(3);
			 * });
			 */

			ensureCanMutateNextListeners();
			const index = nextListeners.indexOf(listener);
			nextListeners.splice(index, 1);
			currentListeners = null;
		};
	}

	/**
	 * Dispatches an action. It is the only way to trigger a state change.
	 * * 派发 action， 触发state改变的唯一方式
	 *
	 * The `reducer` function, used to create the store, will be called with the
	 * current state tree and the given `action`. Its return value will
	 * be considered the **next** state of the tree, and the change listeners
	 * will be notified.
	 * * 用来创建存储的“reducer”函数将被当前状态树和给定的“action”调用。
	 * * 它的返回值将被认为是树的**下一个**状态，并将通知更改侦听器。
	 *
	 * The base implementation only supports plain object actions. If you want to
	 * dispatch a Promise, an Observable, a thunk, or something else, you need to
	 * wrap your store creating function into the corresponding middleware. For
	 * example, see the documentation for the `redux-thunk` package. Even the
	 * middleware will eventually dispatch plain object actions using this method.
	 * * 基本实现仅支持普通对象操作。 如果你想分发一个 Promise、一个 Observable、一个 thunk 或其他东西，你需要将你的 store 创建函数包装到相应的中间件中。
	 * * 例如，查看 `redux-thunk` 包的文档。 甚至中间件最终也将使用此方法调度普通对象操作。
	 *
	 * @param {Object} action A plain object representing “what changed”. It is
	 * a good idea to keep actions serializable so you can record and replay user
	 * sessions, or use the time travelling `redux-devtools`. An action must have
	 * a `type` property which may not be `undefined`. It is a good idea to use
	 * string constants for action types.
	 * * 表示“发生了什么变化”的普通对象。保持动作可序列化是一个好主意，这样你就可以记录和重放用户会话，或者使用时间旅行的“redux-devtools”。
	 * * 一个动作必须有一个不能为“未定义”的“类型”属性。对动作类型使用字符串常量是一个好主意。
	 *
	 * @returns {Object} For convenience, the same action object you dispatched.
	 *  * 返回与disapatch传入的相同的action
	 *
	 * Note that, if you use a custom middleware, it may wrap `dispatch()` to
	 * return something else (for example, a Promise you can await).
	 * * 如果使用中间件，可能返回其他的东西
	 */
	function dispatch(action) {
		// 校验action
		if (!isPlainObject(action)) {
			throw new Error(
				`Actions must be plain objects. Instead, the actual type was: '${kindOf(
					action
				)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
			);
		}
		// 必须指定type
		if (typeof action.type === 'undefined') {
			throw new Error(
				'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
			);
		}
		// 在reducer中不可以dispatch
		if (isDispatching) {
			throw new Error('Reducers may not dispatch actions.');
		}

		try {
			// 正在执行reducer， 将此设置为true，用于判断reducer执行过程中不可dispath
      // 会导致栈溢出等问题
			isDispatching = true;
			currentState = currentReducer(currentState, action);
		} finally {
			// reducer执行结束
			isDispatching = false;
		}
    // 依次调用listener
		const listeners = (currentListeners = nextListeners);
		for (let i = 0; i < listeners.length; i++) {
			const listener = listeners[i];
			listener();
		}

		return action;
	}

	/**
	 * Replaces the reducer currently used by the store to calculate the state.
	 *
	 * You might need this if your app implements code splitting and you want to
	 * load some of the reducers dynamically. You might also need this if you
	 * implement a hot reloading mechanism for Redux.
	 * * 如果你的应用程序实现了代码分割，并且你想动态加载一些reducers，你可能需要这个。
   * * 如果为Redux实现热重载机制，可能也需要这样做。
	 * @param {Function} nextReducer The reducer for the store to use instead.
	 * @returns {void}
	 */
	function replaceReducer(nextReducer) {
		if (typeof nextReducer !== 'function') {
			throw new Error(
				`Expected the nextReducer to be a function. Instead, received: '${kindOf(
					nextReducer
				)}`
			);
		}

		currentReducer = nextReducer;

		// This action has a similiar effect to ActionTypes.INIT.
		// Any reducers that existed in both the new and old rootReducer
		// will receive the previous state. This effectively populates
		// the new state tree with any relevant data from the old one.
		dispatch({ type: ActionTypes.REPLACE });
	}

	/**
	 * Interoperability point for observable/reactive libraries.
	 * @returns {observable} A minimal observable of state changes.
	 * For more information, see the observable proposal:
	 * https://github.com/tc39/proposal-observable
	 */
	function observable() {
		const outerSubscribe = subscribe;
		return {
			/**
			 * The minimal observable subscription method.
			 * @param {Object} observer Any object that can be used as an observer.
			 * The observer object should have a `next` method.
			 * @returns {subscription} An object with an `unsubscribe` method that can
			 * be used to unsubscribe the observable from the store, and prevent further
			 * emission of values from the observable.
			 */
			subscribe(observer) {
				if (typeof observer !== 'object' || observer === null) {
					throw new TypeError(
						`Expected the observer to be an object. Instead, received: '${kindOf(
							observer
						)}'`
					);
				}

				function observeState() {
					if (observer.next) {
						observer.next(getState());
					}
				}

				observeState();
				const unsubscribe = outerSubscribe(observeState);
				return { unsubscribe };
			},

			[$$observable]() {
				return this;
			},
		};
	}

	// When a store is created, an "INIT" action is dispatched so that every
	// reducer returns their initial state. This effectively populates
	// the initial state tree.
  // 当一个store被创建时，一个“INIT”动作被分派，以便每个reducer返回他们的初始状态。这有效地填充了初始状态树。
  // * 主要是初始化state
	dispatch({ type: ActionTypes.INIT });

	return {
		dispatch,
		subscribe,
		getState,
		replaceReducer,
		[$$observable]: observable,
	};
}
