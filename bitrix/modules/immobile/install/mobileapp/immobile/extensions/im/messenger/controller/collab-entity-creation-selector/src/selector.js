/**
 * @module im/messenger/controller/collab-entity-creation-selector/src/selector
 */
jn.define('im/messenger/controller/collab-entity-creation-selector/src/selector', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { Area } = require('ui-system/layout/area');
	const { Text2 } = require('ui-system/typography');

	const { MessengerIcon } = require('im/messenger/assets/icon');

	/**
	 * @class CollabEntityCreationSelector
	 * @typedef {LayoutComponent<
	 * CollabEntityCreationSelectorProps,
	 * CollabEntityCreationSelectorState
	 * >} CollabEntityCreationSelector
	 */
	class CollabEntityCreationSelector extends LayoutComponent
	{
		/**
		 * @param {CollabEntityCreationSelectorProps} props
		 */
		constructor(props)
		{
			super(props);
			this.state = {};
		}

		render()
		{
			return View(
				{},
				Area(
					{
						isFirst: true,
						divider: false,
						excludePaddingSide: {
							horizontal: true,
						},
					},
					...this.#renderItems(this.props.items),
				),
			);
		}

		/**
		 * @param {Array<CollabEntityCreationSelectorItem>} items
		 * @return {BaseMethods[]}
		 */
		#renderItems(items)
		{
			return items.map((item) => this.#renderItem(item));
		}

		/**
		 * @param {CollabEntityCreationSelectorItem} item
		 * @return {BaseMethods}
		 */
		#renderItem(item)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						height: 69,
						width: '100%',
						justifyContent: 'center',
					},
					onClick: () => {
						this.props.widget.on('onViewRemoved', () => {
							item.onClick();
						});

						this.props.widget.close();
					},
				},
				this.#renderIcon(item.iconType),
				this.#renderTitle(item.text),
			);
		}

		#renderIcon(iconType)
		{
			return View(
				{
					style: {
						justifyContent: 'center',
						alignItems: 'center',
						paddingLeft: Component.paddingLr.toNumber(),
					},
				},
				Image({
					style: {
						width: 40,
						height: 40,
					},
					resizeMode: 'contain',
					uri: MessengerIcon.getByType(iconType),
				}),
			);
		}

		#renderTitle(text)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'flex-start',
						alignItems: 'center',
						marginLeft: Indent.XL.toNumber(),
						paddingRight: Component.paddingLr.toNumber(),
						flexGrow: 2,
						borderBottomWidth: 1,
						borderBottomColor: Color.bgSeparatorSecondary.toHex(),
					},
				},
				Text2({
					text,
				}),
			);
		}
	}

	module.exports = { CollabEntityCreationSelector };
});
