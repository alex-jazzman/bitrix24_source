/**
 * @module more-menu/block/company/specialists/list/src/reactive-row-slot
 */
jn.define('more-menu/block/company/specialists/list/src/reactive-row-slot', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');

	/**
	 * Renders a row slot from a render function and re-renders it in place when its owner
	 * signals a change. Subscribes to the owner's invalidation source on mount and forces
	 * a re-render on notification, letting a plain (non-component) owner refresh one slot.
	 *
	 * @class ReactiveRowSlot
	 */
	class ReactiveRowSlot extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.state = { rev: 0 };
			this.unsubscribe = null;
			this.invalidate = () => this.setState({ rev: (this.state.rev || 0) + 1 });
		}

		componentDidMount()
		{
			if (typeof this.props.subscribe === 'function')
			{
				this.unsubscribe = this.props.subscribe(this.invalidate);
			}
		}

		componentWillUnmount()
		{
			if (typeof this.unsubscribe === 'function')
			{
				this.unsubscribe();
				this.unsubscribe = null;
			}
		}

		render()
		{
			const content = typeof this.props.renderContent === 'function'
				? this.props.renderContent()
				: null;

			// JaNative doesn't detach mounted native views when a component re-renders to null and the
			// slot then stops applying updates; return an empty View so the slot clears in place and can
			// re-render again.
			return content ?? View({});
		}
	}

	module.exports = { ReactiveRowSlot };
});
