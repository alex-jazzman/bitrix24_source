/**
 * @module im/messenger/lib/ui/selector/button-section
 */
jn.define('im/messenger/lib/ui/selector/button-section', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { Corner, Color } = require('tokens');
	const { mergeImmutable } = require('utils/object');

	class ButtonSection extends LayoutComponent
	{
		/**
		 *
		 * @param {Object}props
		 *
		 */
		constructor(props)
		{
			super(props);
			if (props.ref)
			{
				props.ref(this);
			}
		}

		render()
		{
			return Area(
				mergeImmutable({
					style: {
						backgroundColor: Color.bgContentPrimary.getValue(),
						borderRadius: Corner.L.getValue(),
					},
					excludePaddingSide: {
						horizontal: true,
					},
					isFirst: true,
				}, this.props),
				...this.props.buttons,
			);
		}
	}

	module.exports = { ButtonSection };
});