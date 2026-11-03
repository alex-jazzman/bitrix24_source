/**
 * @module tab-presets/managed/src/managed/preset-info
 */
jn.define('tab-presets/managed/src/managed/preset-info', (require, exports, module) => {
	const { getIcon } = require('tab-presets/managed/src/managed/utils');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Area } = require('ui-system/layout/area');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { IconView } = require('ui-system/blocks/icon');
	const { H3 } = require('ui-system/typography/heading');
	const { Text4 } = require('ui-system/typography/text');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');

	/**
	 * @extends {LayoutComponent<PresetInfoProps, void>}
	 */
	class PresetInfo extends LayoutComponent
	{
		/**
		 * @param {PresetInfoShowParams} params
		 * @return {void}
		 */
		static show({
			parentWidget,
			presetTitle,
			presetImagePath,
			isPresetSelected,
			tabsDescription,
			tabsIcons,
			testId,
			onPresetSelected,
		})
		{
			void new BottomSheet({
				component: (layout) => new PresetInfo({
					presetTitle,
					presetImagePath,
					isPresetSelected,
					tabsDescription,
					tabsIcons,
					testId,
					onPresetSelected,
					parentWidget: layout,
				}),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionPercent(70)
				.setBackgroundColor(Color.bgContentPrimary.toHex())
				.open();
		}

		/**
		 * @return {ReturnType<typeof Box>}
		 */
		render()
		{
			const {
				presetTitle,
				presetImagePath,
				isPresetSelected,
				tabsDescription = {},
				tabsIcons = {},
				parentWidget,
				onPresetSelected,
			} = this.props;

			return Box(
				{
					backgroundColor: Color.bgContentPrimary,
					footer: BoxFooter(
						{
							style: {
								width: '100%',
							},
							safeArea: true,
						},
						View(
							{
								style: {
									flexDirection: 'row',
								},
							},
							Button({
								testId: `${this.testId}_button_select`,
								disabled: isPresetSelected,
								stretched: true,
								size: ButtonSize.L,
								text: (
									isPresetSelected
										? Loc.getMessage('PRESET_INFO_SELECTED')
										: Loc.getMessage('PRESET_INFO_SELECT')
								),
								onClick: () => parentWidget.close(onPresetSelected),
							}),
							Button({
								style: {
									marginLeft: Indent.XL.toNumber(),
								},
								testId: `${this.testId}_button_cancel`,
								stretched: true,
								size: ButtonSize.L,
								text: Loc.getMessage('PRESET_INFO_CANCEL'),
								design: ButtonDesign.OUTLINE,
								onClick: () => parentWidget.close(),
							}),
						),
					),
				},
				Area(
					{
						isFirst: true,
					},
					this.renderImage(presetImagePath),
					H3({
						style: {
							marginVertical: Indent.XL3.toNumber(),
							alignSelf: 'center',
						},
						testId: `${this.testId}_title`,
						text: presetTitle,
					}),
					View(
						{
							style: {
								marginHorizontal: Indent.XL3.toNumber(),
							},
							testId: `${this.testId}_description`,
						},
						...Object.keys(tabsDescription).map((tabName) => {
							return this.renderDescriptionItem(tabName, tabsDescription[tabName], tabsIcons[tabName]);
						}),
					),
				),
			);
		}

		/**
		 * @param {string | undefined} presetImagePath
		 * @return {ReturnType<typeof Image> | null}
		 */
		renderImage(presetImagePath)
		{
			if (!presetImagePath)
			{
				return null;
			}

			const imageProps = String(presetImagePath).endsWith('.svg')
				? { svg: { uri: presetImagePath } }
				: { uri: presetImagePath, resizeMode: 'contain' };

			return Image({
				style: {
					width: 106,
					height: 106,
					alignSelf: 'center',
					marginTop: Indent.XL2.toNumber(),
				},
				...imageProps,
			});
		}

		/**
		 * @param {string} tabName
		 * @param {string} text
		 * @param {string | undefined} iconId
		 * @return {ReturnType<typeof View>}
		 */
		renderDescriptionItem(tabName, text, iconId)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						marginTop: Indent.XL2.toNumber(),
					},
					testId: `${this.testId}_description_item_${tabName}`,
				},
				IconView({
					testId: `${this.testId}_description_item_${tabName}_icon_${iconId}`,
					size: 28,
					color: Color.accentMainSuccess,
					icon: getIcon(iconId) || getIcon(tabName),
				}),
				Text4({
					text,
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
					testId: `${this.testId}_description_item_${tabName}_text`,
				}),
			);
		}

		/**
		 * @return {string}
		 */
		get testId()
		{
			return this.props.testId;
		}
	}

	module.exports = { PresetInfo };
});
