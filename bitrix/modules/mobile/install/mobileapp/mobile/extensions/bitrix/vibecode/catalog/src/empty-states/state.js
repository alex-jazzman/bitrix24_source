/**
 * @module vibecode/catalog/src/empty-states/state
 */
jn.define('vibecode/catalog/src/empty-states/state', (require, exports, module) => {
	const { Color, Component, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { H4 } = require('ui-system/typography/heading');
	const { Text5 } = require('ui-system/typography/text');

	function renderVibeCodeCatalogState({
		testId,
		title,
		description = '',
		actionText = '',
		onActionClick = null,
	})
	{
		const descriptionNode = description
			? Text5({
				testId: `${testId}-description`,
				text: description,
				color: Color.base3,
				style: {
					marginTop: Indent.M.toNumber(),
					textAlign: 'center',
				},
			})
			: null;
		const actionNode = actionText
			? Button({
				testId: `${testId}-action`,
				text: actionText,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				size: ButtonSize.M,
				style: {
					marginTop: Indent.XL.toNumber(),
				},
				onClick: onActionClick,
			})
			: null;

		return View(
			{
				testId,
				style: {
					flex: 1,
					paddingHorizontal: Component.paddingLr.toNumber(),
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: Color.bgContentPrimary.toHex(),
				},
			},
			H4({
				testId: `${testId}-title`,
				text: title,
				style: {
					textAlign: 'center',
				},
			}),
			descriptionNode,
			actionNode,
		);
	}

	module.exports = {
		renderVibeCodeCatalogState,
	};
});
