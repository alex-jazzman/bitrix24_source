/**
 * @module settings-v2/ui/items/src/theme-switch
 */
jn.define('settings-v2/ui/items/src/theme-switch', (require, exports, module) => {
	const { createTestIdGenerator } = require('utils/test');
	const { Card, CardDesign, BadgeStatusMode } = require('ui-system/layout/card');
	const { Text3 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');
	const { Loc } = require('loc');
	const { ASSET_PATH, ThemeType } = require('settings-v2/const');

	const THEME_ASSET_PATH = `${ASSET_PATH}theme/`;

	const ThemeTypeLoc = {
		[ThemeType.LIGHT]: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_THEME_LIGHT'),
		[ThemeType.DARK]: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_THEME_DARK'),
		[ThemeType.SYSTEM]: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_THEME_SYSTEM'),
	};

	class ThemeSwitchItem extends LayoutComponent
	{
		/**
		 * @param {ItemProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				testId: props.testId || 'settings-theme-item',
				context: this,
			});

			this.state.selectedTheme = props.value;

			props.controller.setOnCancel(() => {
				this.setState({
					selectedTheme: props.value,
				});
			});
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
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
							maxWidth: 500,
							paddingVertical: Indent.M.toNumber(),
						},
					},
					this.renderThemeCard(ThemeType.LIGHT, 0),
					this.renderThemeCard(ThemeType.DARK, 1),
					this.renderThemeCard(ThemeType.SYSTEM, 2),
				),
			);
		}

		renderThemeCard(themeType, index)
		{
			const selected = this.state.selectedTheme === themeType;

			return View(
				{
					onClick: () => this.onChange(themeType),
					style: {
						flex: 1,
						marginLeft: index === 0 ? 0 : Component.cardListGap.toNumber(),
					},
				},
				Card(
					{
						testId: this.getTestId(`theme-card-${themeType}`),
						design: CardDesign.PRIMARY,
						accent: selected,
						border: true,
						badgeMode: selected ? BadgeStatusMode.SUCCESS : null,
						style: {
							alignItems: 'center',
						},
					},
					this.renderImage(themeType),
				),

				Text3({
					text: ThemeTypeLoc[themeType],
					color: Color.base1,
					numberOfLines: 1,
					style: {
						alignSelf: 'center',
						marginTop: Indent.S.toNumber(),
					},
				}),
			);
		}

		renderImage(themeType)
		{
			return Image(
				{
					resizeMode: 'contain',
					style: {
						width: 29,
						height: 54,
					},
					svg: {
						uri: `${THEME_ASSET_PATH}${themeType}.svg`,
					},
				},
			);
		}

		onChange = (themeType) => {

			if (this.state.selectedTheme === themeType)
			{
				return;
			}

			const { id, controller, onChange } = this.props;

			this.setState({
				selectedTheme: themeType,
			}, () => {
				if (onChange)
				{
					onChange(id, controller, themeType);
				}
			});
		};
	}

	module.exports = {
		ThemeSwitchItem,
	};
});
