/**
 * @module settings-v2/ui/items/src/style-switch
 */
jn.define('settings-v2/ui/items/src/style-switch', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Card, CardDesign, BadgeStatusMode } = require('ui-system/layout/card');
	const { CardList } = require('ui-system/layout/card-list');
	const { Indent } = require('tokens');
	const { NativeStyleService } = require('settings-v2/services/native');
	const { ASSET_PATH } = require('settings-v2/const');
	const { Color } = require('tokens');
	const AppTheme = require('apptheme');

	const STYLE_ASSET_PATH = `${ASSET_PATH}style/`;

	class StyleSwitchItem extends LayoutComponent
	{
		/**
		 * @param {ItemProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-style-item',
				context: this,
			});

			this.state = {
				selectedStyle: props.value,
				isLoading: true,
			};

			this.labels = {};
			this.options = [];
		}

		componentDidMount()
		{
			void this.loadOptions();
		}

		async loadOptions()
		{
			this.labels = await NativeStyleService.getOptionLabels();
			this.options = await NativeStyleService.getOptions();

			this.setState(
				{
					isLoading: false,
				},
			);
		}

		render()
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						justifyContent: 'center',
					},
				},
				CardList(
					{
						horizontal: false,
						withScroll: false,
						style: {
							flex: 1,
							justifyContent: 'center',
							paddingVertical: Indent.M.toNumber(),
							maxWidth: 700,
						},
					},
					...this.renderCards(),
				),
			);
		}

		renderCards()
		{
			return this.options.map((option) => this.renderStyleCard(option));
		}

		renderStyleCard(styleType)
		{
			const selected = this.state.selectedStyle === styleType;

			return Card(
				{
					excludePaddingSide: { all: true },
					onClick: () => this.onChange(styleType),
				},
				Card(
					{
						design: CardDesign.PRIMARY,
						accent: selected,
						border: true,
						badgeMode: selected ? BadgeStatusMode.SUCCESS : null,
					},
					this.renderImage(styleType),
				),
			);
		}

		renderImage(styleType)
		{
			return View(
				{
					style: {
						height: 70,
						width: '100%',
						position: 'relative',
						borderRadius: 12,
						borderWidth: styleType === 'default' ? 1 : 0,
						borderColor: Color.base7.toHex(),
					},
				},
				Image(
					{
						named: this.labels[styleType],
						resizeMode: 'stretch',
						style: {
							position: 'absolute',
							top: 0,
							left: 0,
							zIndex: 1,
							height: 70,
							width: '100%',
							opacity: 0.5,
						},
					},
				),
				Image(
					{
						svg: {
							uri: `${STYLE_ASSET_PATH}${AppTheme.id}/device-header.svg`,
						},
						style: {
							position: 'absolute',
							top: 0,
							left: 0,
							zIndex: 2,
							height: 70,
							width: '100%',
						},
					},
				),
			);
		}

		onChange = (styleType) => {
			const { id, controller, onChange } = this.props;

			this.setState({
				selectedStyle: styleType,
			}, () => {
				if (onChange)
				{
					onChange(id, controller, styleType);
				}
			});
		};
	}

	module.exports = {
		StyleSwitchItem,
	};
});
