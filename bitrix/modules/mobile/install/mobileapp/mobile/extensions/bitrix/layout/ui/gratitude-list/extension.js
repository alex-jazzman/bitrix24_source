/**
 * @module layout/ui/gratitude-list
 */
jn.define('layout/ui/gratitude-list', (require, exports, module) => {
	const { GratitudeList } = require('layout/ui/gratitude-list/src/list');
	const { Loc } = require('loc');

	/**
	 * @class GratitudeListManager
	 * @extends LayoutComponent
	 */
	class GratitudeListManager extends LayoutComponent
	{
		/**
		 * @param {Object} props
		 * @param {Object} props.parentLayout
		 * @param {string} props.title
		 * @param {number} props.ownerId
		 * @returns {Promise<void>}
		 */
		static openInComponentWithRedux(props)
		{
			const config = {
				enableNavigationBarBorder: false,
				titleParams: {
					text: props?.title ?? Loc.getMessage('M_UI_GRATITUDE_LIST_TITLE'),
					type: 'dialog',
				},
				onReady: (readyLayout) => {
					readyLayout.showComponent(new GratitudeList({
						withRedux: true,
						layout: readyLayout,
						parentLayout: props?.parentLayout ?? null,
						ownerId: props.ownerId ?? null,
					}));
				},
			};

			PageManager.openWidget('layout', config);
		}
	}

	module.exports = {
		GratitudeListManager,
	};
});
