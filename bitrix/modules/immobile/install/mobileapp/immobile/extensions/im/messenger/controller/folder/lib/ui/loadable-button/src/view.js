/**
 * @module im/messenger/controller/folder/lib/ui/loadable-button/view
 */
jn.define('im/messenger/controller/folder/lib/ui/loadable-button/view', (require, exports, module) => {
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');

	class FolderLoadableButton extends LayoutComponent
	{
		static defaultProps = {
			ref: () => {},
		};

		constructor(props)
		{
			super(props);
			this.state = {
				isLoading: false,
				enabled: props.enabled !== false,
			};
		}

		componentDidMount()
		{
			super.componentDidMount();
			this.props.ref(this);
		}

		componentWillReceiveProps(nextProps)
		{
			const enabled = nextProps.enabled !== false;
			if (enabled === this.state.enabled)
			{
				return;
			}

			this.state.enabled = enabled;
		}

		render()
		{
			return Button({
				testId: this.props.testId,
				text: this.props.text,
				stretched: true,
				size: ButtonSize.L,
				disabled: !this.state.enabled,
				loading: this.state.isLoading,
				onClick: () => {
					if (!this.state.enabled || this.state.isLoading)
					{
						return;
					}

					this.setState({ isLoading: true });
					this.props.onClick?.();
				},
			});
		}

		setLoading(isLoading)
		{
			this.setState({ isLoading });
		}

		setEnabled(enabled)
		{
			this.setState({ enabled });
		}
	}

	module.exports = { FolderLoadableButton };
});
