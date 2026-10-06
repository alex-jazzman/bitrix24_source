/**
 * @module market/empty-state
 */
jn.define('market/empty-state', (require, exports, module) => {
	const { makeLibraryImagePath } = require('asset-manager');
	const { Color, Component, Indent } = require('tokens');
	const { H3 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');

	const ASSET_FOLDER = 'market/empty-state';
	const IMAGE_SIZE = 162;
	const IMAGE_CONTAINER_HEIGHT = 140;
	const TEXT_GAP = Indent.XL2.toNumber();

	function MarketEmptyState({
		testId = 'market-empty-state',
		title = '',
		description = '',
		style = {},
	} = {})
	{
		const normalizedDescription = String(description ?? '').trim();

		return View(
			{
				testId,
				style: {
					width: '100%',
					alignItems: 'center',
					paddingHorizontal: Component.paddingLr.toNumber(),
					paddingTop: Indent.XL.toNumber(),
					paddingBottom: Indent.XL.toNumber(),
					...style,
				},
			},
			View(
				{
					testId: `${testId}-image-container`,
					style: {
						width: '100%',
						height: IMAGE_CONTAINER_HEIGHT,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Image({
					testId: `${testId}-image`,
					uri: makeLibraryImagePath('empty-state.png', ASSET_FOLDER, undefined, false),
					resizeMode: 'contain',
					style: {
						width: IMAGE_SIZE,
						height: IMAGE_SIZE,
					},
				}),
			),
			View(
				{
					testId: `${testId}-text`,
					style: {
						width: '100%',
						alignItems: 'center',
						marginTop: TEXT_GAP,
						paddingHorizontal: Component.paddingLrMore.toNumber(),
					},
				},
				H3({
					testId: `${testId}-title`,
					text: title,
					style: {
						textAlign: 'center',
					},
				}),
				normalizedDescription
					? Text3({
						testId: `${testId}-description`,
						text: normalizedDescription,
						color: Color.base2,
						style: {
							marginTop: Indent.L.toNumber(),
							textAlign: 'center',
						},
					})
					: null,
			),
		);
	}

	module.exports = {
		MarketEmptyState,
	};
});
