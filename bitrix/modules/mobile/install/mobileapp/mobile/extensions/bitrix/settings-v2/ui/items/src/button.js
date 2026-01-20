/**
 * @module settings-v2/ui/items/src/button
 */
jn.define('settings-v2/ui/items/src/button', (require, exports, module) => {
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons');
	const { Color } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');

	class ButtonItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				testId: props.testId || 'settings-button-item',
				context: this,
			});
		}

		render()
		{
			const {
				id,
				design = ButtonDesign.OUTLINE_ACCENT_1,
				size = ButtonSize.MEDIUM,
				color = Color.base1,
			} = this.props;

			return Button({
				...this.props,
				testId: this.getTestId(id),
				design,
				size,
				color,
				stretched: true,
			});
		}
	}

	module.exports = {
		ButtonItem,
	};
});
