/**
 * @module im/messenger/controller/folder/list/card
 */
jn.define('im/messenger/controller/folder/list/card', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Theme } = require('im/lib/theme');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	const getDotsDragSvg = (color) => [
		'<svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">',
		`<circle cx="2.5" cy="2" r="1.5" fill="${color}"/>`,
		`<circle cx="7.5" cy="2" r="1.5" fill="${color}"/>`,
		`<circle cx="2.5" cy="8" r="1.5" fill="${color}"/>`,
		`<circle cx="7.5" cy="8" r="1.5" fill="${color}"/>`,
		`<circle cx="2.5" cy="14" r="1.5" fill="${color}"/>`,
		`<circle cx="7.5" cy="14" r="1.5" fill="${color}"/>`,
		'</svg>',
	].join('');

	class FolderCard extends LayoutComponent
	{
		/**
		 * @param {object} props
		 * @param {string} props.title
		 * @param {string} props.description
		 * @param {boolean} props.isSystem
		 * @param {Function} [props.onMorePress] - (moreButtonRef) => void
		 */
		constructor(props)
		{
			super(props);

			this.moreButtonRef = null;
		}

		renderMoreButton()
		{
			if (this.props.isSystem)
			{
				return null;
			}

			return View(
				{
					ref: (ref) => {
						this.moreButtonRef = ref;
					},
					style: {
						paddingTop: 1,
						width: 24,
						height: 24,
						alignItems: 'center',
						justifyContent: 'center',
					},
					onClick: () => {
						this.props.onMorePress?.(this.moreButtonRef);
					},
				},
				IconView({
					icon: Icon.MORE,
					size: 24,
					color: Color.base4,
				}),
			);
		}

		render()
		{
			return View(
				{
					style: {
						borderWidth: 1,
						borderColor: Theme.colors.bgSeparatorPrimary,
						borderRadius: 12,
						paddingVertical: 12,
						paddingRight: 14,
						flexDirection: 'row',
						alignItems: 'flex-start',
						backgroundColor: Theme.colors.bgContentPrimary,
					},
				},
				View(
					{
						style: {
							width: 30,
							paddingTop: 3,
							alignItems: 'center',
						},
					},
					Image({
						style: {
							width: 10,
							height: 16,
						},
						svg: {
							content: getDotsDragSvg(Theme.colors.base5),
						},
					}),
				),
				View(
					{
						style: {
							flex: 1,
							paddingTop: 2,
						},
					},
					Text({
						style: {
							fontSize: 17,
							color: Theme.colors.base1,
						},
						text: this.props.title,
					}),
					Text({
						style: {
							fontSize: 15,
							color: Theme.colors.base4,
							marginTop: 2,
						},
						text: this.props.description,
					}),
				),
				this.renderMoreButton(),
			);
		}
	}

	module.exports = { FolderCard };
});
