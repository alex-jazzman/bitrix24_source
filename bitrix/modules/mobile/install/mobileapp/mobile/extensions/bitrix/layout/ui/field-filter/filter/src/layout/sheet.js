/**
 * @module layout/ui/field-filter/filter/src/layout/sheet
 */
jn.define('layout/ui/field-filter/filter/src/layout/sheet', (require, exports, module) => {
	const { Type } = require('type');
	const { BottomSheet } = require('bottom-sheet');

	/**
	 * How much of the screen a sheet opened to its content may take. Content taller than that keeps
	 * the default behaviour: pinning a sheet to a height that does not fit would only cut the rest
	 * of the list off, while the default position can be dragged up.
	 *
	 * @type {number}
	 */
	const CONTENT_HEIGHT_LIMIT_PERCENT = 85;

	/**
	 * Every screen of the filter is the same sheet: pinned above whatever opened it, closing into
	 * the widget that owns it. Written once so that the fifth screen does not have to guess which
	 * title mode and which parent rule the previous four settled on.
	 *
	 * `largeTitle` is what puts the title at the left edge and lets it take the whole width; the
	 * `dialog` type centers it and truncates, which is right for the short titles of the inner
	 * screens and wrong for the drawer itself.
	 *
	 * A screen that knows how tall it is passes `contentHeight` and the sheet opens exactly that
	 * tall instead of the default position, so a list of three rows does not leave two thirds of the
	 * screen empty. The height is what the screen draws; the frame around it - the title bar and the
	 * safe area under the content - belongs to the sheet and is counted by it. Erring on the short
	 * side is deliberate: a sheet a little shorter than its content scrolls, while one that is too
	 * tall leaves the empty space this is meant to remove.
	 *
	 * @param {FilterSheetOptions} options
	 * @return {Promise}
	 */
	const openFilterSheet = (options) => {
		const { title, largeTitle = false, parentWidget = null, contentHeight = null, component } = options;

		const bottomSheet = new BottomSheet({
			titleParams: largeTitle
				? { text: title, useLargeTitleMode: true }
				: { text: title, type: 'dialog' },
		}).alwaysOnTop();

		if (parentWidget)
		{
			bottomSheet.setParentWidget(parentWidget);
		}

		applyContentHeight(bottomSheet, contentHeight);

		bottomSheet.setComponent((widget) => component({
			widget,
			close: () => bottomSheet.close(),
		}));

		return bottomSheet.open();
	};

	/**
	 * @param {BottomSheet} bottomSheet
	 * @param {?number} contentHeight
	 */
	function applyContentHeight(bottomSheet, contentHeight)
	{
		if (!Type.isNumber(contentHeight) || contentHeight <= 0)
		{
			return;
		}

		const height = contentHeight;
		const screenHeight = device?.screen?.height || 0;
		const limit = screenHeight * CONTENT_HEIGHT_LIMIT_PERCENT / 100;

		// a screen height that did not arrive leaves the sheet at its default position rather than
		// pinning it to a height nothing was checked against
		if (height > limit)
		{
			return;
		}

		// the second argument adds the bottom safe area on Android, where the sheet stands above the
		// navigation buttons; on iOS it is left as it is
		bottomSheet
			.setMediumPositionHeight(height, true)
			.enableOnlyMediumPosition()
		;
	}

	module.exports = { openFilterSheet };
});
