/**
 * @module vibecode/catalog/src/empty-states/empty-apps-state
 */
jn.define('vibecode/catalog/src/empty-states/empty-apps-state', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { H3 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');

	const VIBECODE_EMPTY_ASSET_FOLDER = 'vibecode/catalog/empty-state';
	const VIBECODE_EMPTY_IMAGE_SIZE = 178;
	const VIBECODE_EMPTY_VERTICAL_PADDING = 36;
	const VIBECODE_EMPTY_TEXT_GAP = Indent.XL2.toNumber();
	const VIBECODE_EMPTY_DESCRIPTION_GAP = Indent.L.toNumber();
	const VIBECODE_EMPTY_ACTION_GAP = Indent.XL2.toNumber();

	function VibeCodeCatalogEmptyAppsState({ testId, onActionClick = null })
	{
		return View(
			{
				testId,
				style: {
					flex: 1,
					width: '100%',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: Color.bgContentPrimary.toHex(),
					paddingHorizontal: Component.paddingLr.toNumber(),
					paddingTop: VIBECODE_EMPTY_VERTICAL_PADDING,
					paddingBottom: VIBECODE_EMPTY_VERTICAL_PADDING,
				},
			},
			Image({
				testId: `${testId}-image`,
				uri: makeLibraryImagePath('empty-apps.png', VIBECODE_EMPTY_ASSET_FOLDER, undefined, false),
				resizeMode: 'contain',
				style: {
					width: VIBECODE_EMPTY_IMAGE_SIZE,
					height: VIBECODE_EMPTY_IMAGE_SIZE,
				},
			}),
			renderEmptyAppsText(testId),
			Button({
				testId: `${testId}-action`,
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_EMPTY_ACTION'),
				design: ButtonDesign.FILLED,
				size: ButtonSize.M,
				onClick: onActionClick,
				style: {
					marginTop: VIBECODE_EMPTY_ACTION_GAP,
				},
			}),
		);
	}

	function renderEmptyAppsText(testId)
	{
		return View(
			{
				testId: `${testId}-text`,
				style: {
					width: '100%',
					alignItems: 'center',
					marginTop: VIBECODE_EMPTY_TEXT_GAP,
					paddingHorizontal: Component.paddingLrMore.toNumber(),
				},
			},
			H3({
				testId: `${testId}-title`,
				value: Loc.getMessage('MOBILE_VIBECODE_CATALOG_EMPTY_TITLE', {
					'#COLOR#': Color.accentMainSuccess.toHex(),
				}),
				nativeElement: BBCodeText,
				linksUnderline: false,
				style: {
					textAlign: 'center',
				},
			}),
			Text3({
				testId: `${testId}-description`,
				text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_EMPTY_DESCRIPTION'),
				color: Color.base2,
				style: {
					marginTop: VIBECODE_EMPTY_DESCRIPTION_GAP,
					textAlign: 'center',
				},
			}),
		);
	}

	module.exports = {
		VibeCodeCatalogEmptyAppsState,
	};
});
