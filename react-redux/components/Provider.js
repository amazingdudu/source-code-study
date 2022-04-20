import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ReactReduxContext } from './Context';

class Provider extends Component {
	constructor(props) {
		super(props);
		// 使用store初始化state
		const { store } = props;

		this.state = {
			storeState: store.getState(),
			store,
		};
	}

	componentDidMount() {
		this._isMounted = true;
		// 订阅
		this.subscribe();
	}

	componentWillUnmount() {
		// 组件卸载后，取消订阅
		if (this.unsubscribe) this.unsubscribe();

		this._isMounted = false;
	}

	componentDidUpdate(prevProps) {
		// 当组件更新后，如果新的store与原来的store不一样，则取消之前的订阅，新增订阅
		if (this.props.store !== prevProps.store) {
			// ?为何需要判断是否存在
			if (this.unsubscribe) this.unsubscribe();

			this.subscribe();
		}
	}

	subscribe() {
		const { store } = this.props;

		this.unsubscribe = store.subscribe(() => {
			const newStoreState = store.getState();
			// 防止组件卸载后，还会触发setState
      // ?什么情况下会发生，异步action ?
			if (!this._isMounted) {
				return;
			}

			this.setState(providerState => {
				// If the value is the same, skip the unnecessary state update.
				// 优化
				if (providerState.storeState === newStoreState) {
					return null;
				}

				return { storeState: newStoreState };
			});
		});

		// Actions might have been dispatched between render and mount - handle those
		// action可能在render和mount之间被dispatch, 可能在componentWillMount
		const postMountStoreState = store.getState();
		if (postMountStoreState !== this.state.storeState) {
			this.setState({ storeState: postMountStoreState });
		}
	}

	render() {
		const Context = this.props.context || ReactReduxContext;

		return <Context.Provider value={this.state}>{this.props.children}</Context.Provider>;
	}
}

Provider.propTypes = {
	store: PropTypes.shape({
		subscribe: PropTypes.func.isRequired,
		dispatch: PropTypes.func.isRequired,
		getState: PropTypes.func.isRequired,
	}),
	context: PropTypes.object,
	children: PropTypes.any,
};

export default Provider;
