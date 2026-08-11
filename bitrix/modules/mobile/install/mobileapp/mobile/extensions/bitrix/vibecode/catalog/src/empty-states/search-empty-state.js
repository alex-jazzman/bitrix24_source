/**
 * @module vibecode/catalog/src/empty-states/search-empty-state
 */
jn.define('vibecode/catalog/src/empty-states/search-empty-state', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Loc } = require('loc');
	const { Color, Component, Indent } = require('tokens');
	const { H3 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');

	const VIBECODE_SEARCH_EMPTY_ASSET_FOLDER = 'vibecode/catalog/search-empty-state';
	const VIBECODE_SEARCH_EMPTY_IMAGE_SIZE = 162;
	const VIBECODE_SEARCH_EMPTY_IMAGE_CONTAINER_HEIGHT = 140;
	const VIBECODE_EMPTY_TEXT_GAP = Indent.XL2.toNumber();

	function VibeCodeCatalogSearchEmptyState({ testId })
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
					paddingTop: Indent.XL.toNumber(),
					paddingBottom: Indent.XL.toNumber(),
				},
			},
			View(
				{
					testId: `${testId}-image-container`,
					style: {
						width: '100%',
						height: VIBECODE_SEARCH_EMPTY_IMAGE_CONTAINER_HEIGHT,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Image({
					testId: `${testId}-image`,
					uri: makeLibraryImagePath(
						'empty-state.png',
						VIBECODE_SEARCH_EMPTY_ASSET_FOLDER,
						undefined,
						false,
					),
					resizeMode: 'contain',
					style: {
						width: VIBECODE_SEARCH_EMPTY_IMAGE_SIZE,
						height: VIBECODE_SEARCH_EMPTY_IMAGE_SIZE,
					},
				}),
			),
			View(
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
					text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SEARCH_EMPTY_TITLE'),
					style: {
						textAlign: 'center',
					},
				}),
				Text3({
					testId: `${testId}-description`,
					text: Loc.getMessage('MOBILE_VIBECODE_CATALOG_SEARCH_EMPTY_DESCRIPTION'),
					color: Color.base2,
					style: {
						marginTop: Indent.L.toNumber(),
						textAlign: 'center',
					},
				}),
			),
		);
	}

	module.exports = {
		VibeCodeCatalogSearchEmptyState,
	};
});
