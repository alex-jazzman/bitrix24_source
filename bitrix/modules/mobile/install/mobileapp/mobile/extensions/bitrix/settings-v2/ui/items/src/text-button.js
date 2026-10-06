/**
 * @module settings-v2/ui/items/src/text-button
 */
jn.define('settings-v2/ui/items/src/text-button', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Text3 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');

	class TextButtonItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-text-button-item',
				context: this,
			});
		}

		render()
		{
			const {
				id,
				title,
				color = Color.base1,
				onClick,
				style = {},
			} = this.props;

			return View(
				{
					testId: this.getTestId(id),
					onClick,
					style: {
						width: '100%',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						...style,
						...this.#dividerStyles(),
					},
				},
				Text3({
					testId: this.getTestId(`${id}-title`),
					text: title,
					color,
					numberOfLines: 2,
					style: {
						textAlign: 'center',
						borderBottomWidth: 2,
						borderBottomColor: color.toHex(0.3),
						borderStyle: 'dash',
						borderDashSegmentLength: 4,
						borderDashGapLength: 4,
					},
				}),
			);
		}

		#dividerStyles()
		{
			const { divider } = this.props;

			if (!divider)
			{
				return {};
			}

			return {
				borderBottomWidth: 1,
				borderBottomColor: Color.bgSeparatorSecondary.toHex(),
			};
		}
	}

	module.exports = {
		TextButtonItem,
	};
});
