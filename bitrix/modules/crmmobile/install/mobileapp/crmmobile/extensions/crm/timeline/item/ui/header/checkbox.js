/**
 * @module crm/timeline/item/ui/header/checkbox
 */
jn.define('crm/timeline/item/ui/header/checkbox', (require, exports, module) => {
	const { Checkbox: CheckboxView } = require('ui-system/form/checkbox');

	const CHECKBOX_SIZE = 14;

	/**
	 * @extends {LayoutComponent<TimelineItemHeaderCheckboxProps, TimelineItemHeaderCheckboxState>}
	 */
	class Checkbox extends LayoutComponent
	{
		/**
		 * @param {TimelineItemHeaderCheckboxProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = { checked: Boolean(props.checked) };
		}

		/**
		 * @param {TimelineItemHeaderCheckboxProps} props
		 */
		componentWillReceiveProps(props)
		{
			this.state.checked = Boolean(props.checked);
		}

		uncheck()
		{
			this.setState({ checked: false });
		}

		render()
		{
			const { testId } = this.props;

			return View(
				{
					testId,
					style: {
						paddingVertical: 10,
						paddingHorizontal: 13,
						justifyContent: 'center',
						alignItems: 'center',
					},
					onClick: () => this.#handleClick(),
				},
				new CheckboxView({
					testId: `${testId}-view`,
					size: CHECKBOX_SIZE,
					checked: this.state.checked,
					useState: false,
				}),
			);
		}

		#handleClick()
		{
			const { isReadonly, onClick } = this.props;

			if (isReadonly)
			{
				return;
			}

			this.setState({ checked: !this.state.checked });

			if (onClick)
			{
				onClick();
			}
		}
	}

	module.exports = { Checkbox };
});
