/**
 * @module more-menu/ui/list/item
 */
jn.define('more-menu/ui/list/item', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { Color, Corner, Indent } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text6 } = require('ui-system/typography/text');
	const { Ellipsize } = require('utils/enums/style');
	const { BadgeCounter, BadgeCounterDesign, BadgeCounterSize } = require('ui-system/blocks/badges/counter');
	const { createTestIdGenerator } = require('utils/test');
	const { PropTypes } = require('utils/validation');
	const { RefRegistry } = require('more-menu/ref-registry');

	const MODE = {
		ALERT: 'alert',
	};

	/**
	 * @enum {string}
	 */
	const TagType = {
		NEW: 'new',
	};

	/**
	 * @typedef {Object} TagConfig
	 * @property {string} text - Text to display
	 * @property {Color} color - Text color
	 */
	const TAG_CONFIG = {
		[TagType.NEW]: {
			text: Loc.getMessage('MENU_UI_LIST_ITEM_TAG_NEW'),
			color: Color.accentMainSuccess,
		},
	};

	/**
	 * @class ListItem
	 */
	class ListItem extends PureComponent
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: props.testId,
			});
		}

		componentDidMount()
		{
			if (this.props.id === 'call_list')
			{
				RefRegistry.register('call_list_menu_settings_button', this.itemRef);
			}

			if (this.props.id === 'mail_list')
			{
				RefRegistry.register('mail_list_menu_settings_button', this.itemRef);
			}
		}

		render()
		{
			const { style = {}, title, mode } = this.props;

			return View(
				{
					ref: (ref) => {
						this.itemRef = ref;
					},
					testId: this.getTestId('wrapper'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Indent.XL.toNumber(),
						borderRadius: Corner.M.toNumber(),
						height: 49,
						...style,
					},
					onClick: this.#handleOnClick,
				},
				this.renderLeftContent(),
				View(
					{
						style: {
							flex: 2,
							flexDirection: 'row',
							height: 49,
							alignItems: 'center',
						},
					},
					Text2({
						text: title,
						testId: this.getTestId('title'),
						color: mode === MODE.ALERT ? Color.accentMainAlert : Color.base1,
						numberOfLines: 1,
						ellipsize: Ellipsize.MIDDLE.toString(),
						style: {
							flexShrink: 2,
						},
					}),
					this.renderTag(),
				),
				this.renderBadge(),
				IconView({
					testId: this.getTestId('right-icon'),
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base4,
					size: 22,
					style: {
						marginLeft: Indent.XL.toNumber(),
					},
				}),
			);
		}

		#handleOnClick = () => {
			const { onClick, itemData } = this.props;

			onClick(itemData);
		};

		renderLeftContent()
		{
			const { icon, mode } = this.props;

			const iconValue = typeof icon === 'string'
				? Icon[icon.toUpperCase()]
				: icon;

			if (iconValue)
			{
				return IconView({
					testId: this.getTestId('icon-left'),
					icon: iconValue,
					color: mode === MODE.ALERT ? Color.accentMainAlert : Color.accentMainPrimary,
					size: 26,
					style: {
						marginRight: Indent.XL.toNumber(),
					},
				});
			}

			return null;
		}

		renderBadge()
		{
			const { badge } = this.props;

			if (!badge)
			{
				return null;
			}

			return BadgeCounter({
				testId: this.getTestId('badge'),
				value: badge,
				size: BadgeCounterSize.M,
				showRawValue: true,
				design: BadgeCounterDesign.ALERT,
				style: {
					marginLeft: Indent.XL.toNumber(),
				},
			});
		}

		renderTag()
		{
			const { tag } = this.props;

			if (!tag)
			{
				return null;
			}

			const tagConfig = TAG_CONFIG[tag];

			if (!tagConfig)
			{
				return null;
			}

			return Text6({
				text: tagConfig.text,
				color: tagConfig.color,
				testId: this.getTestId('tag'),
				style: {
					alignSelf: 'flex-start',
					marginTop: Indent.L.toNumber(),
					marginLeft: Indent.XS.toNumber(),
				},
			});
		}
	}

	ListItem.propTypes = {
		testId: PropTypes.string,
		itemData: PropTypes.object.isRequired,
		icon: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
		title: PropTypes.string.isRequired,
		badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		onClick: PropTypes.func.isRequired,
		divider: PropTypes.bool,
		style: PropTypes.object,
		tag: PropTypes.oneOf(Object.values(TagType)),
	};

	module.exports = {
		ListItem,
		TagType,
	};
});
