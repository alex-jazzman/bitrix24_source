/**
 * @module mail/statemanager/redux/connect
 */
jn.define('mail/statemanager/redux/connect', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const store = require('statemanager/redux/store');
	const { bindActionCreators } = require('statemanager/redux/toolkit');
	const { isEqual } = require('utils/object');

	function connect(mapStateToProps = null, mapDispatchToProps = null)
	{
		return function(WrappedComponent) {
			class Connect extends PureComponent
			{
				constructor(props)
				{
					super(props);
					this.isConnected = true;
					this.storeStateAtConstruct = store.getState();

					this.state = prepareMapStateToProps(this.props);

					this.bindForwardedRef = this.bindForwardedRef.bind(this);
				}

				getComponentDisplayName()
				{
					return `Connected(${WrappedComponent.name})`;
				}

				componentWillReceiveProps(newProps)
				{
					this.state = prepareMapStateToProps(newProps);
				}

				componentDidMount()
				{
					if (!this.unsubscribe)
					{
						this.unsubscribe = store.subscribe(this.handleStorageChange.bind(this));

						if (this.storeStateAtConstruct !== store.getState())
						{
							this.handleStorageChange();
						}
					}
				}

				handleStorageChange()
				{
					const newState = prepareMapStateToProps(this.props);
					if (!isEqual(this.state, newState))
					{
						this.setState(newState);
					}
				}

				componentWillUnmount()
				{
					this.unsubscribe();
				}

				render()
				{
					const passedProps = {
						ref: this.bindForwardedRef,
						...this.props,
						...this.state,
						...prepareMapDispatchToProps(this.props),
					};

					if (WrappedComponent.prototype)
					{
						return new WrappedComponent(passedProps);
					}

					return WrappedComponent(passedProps);
				}

				bindForwardedRef(ref)
				{
					if (this.props.forwardedRef)
					{
						this.props.forwardedRef(ref);
					}
				}
			}

			return (ownProps = {}) => new Connect({ ...ownProps, mapStateToProps, mapDispatchToProps });
		};
	}

	function prepareMapStateToProps(props)
	{
		return props.mapStateToProps && typeof props.mapStateToProps === 'function'
			? props.mapStateToProps(store.getState(), props)
			: {};
	}

	function prepareMapDispatchToProps(props)
	{
		const { dispatch } = store;

		if (props.mapDispatchToProps && typeof props.mapDispatchToProps === 'object')
		{
			return bindActionCreators(props.mapDispatchToProps, dispatch);
		}

		if (props.mapDispatchToProps && typeof props.mapDispatchToProps === 'function')
		{
			return props.mapDispatchToProps(dispatch);
		}

		return { dispatch };
	}

	module.exports = { connect };
});
