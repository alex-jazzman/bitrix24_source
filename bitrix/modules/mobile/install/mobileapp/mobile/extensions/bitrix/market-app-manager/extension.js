/**
 * @module market-app-manager
 */
jn.define('market-app-manager', (require, exports, module) => {
	/**
	 * @typedef {object} PlacementRecord
	 * @property {number} APP_ID - Internal application ID.
	 * @property {number} ID - Placement handler ID.
	 * @property {string} PLACEMENT - Placement code (e.g. 'IM_CONTEXT_MENU').
	 * @property {string} HANDLER - URL of the placement handler.
	 * @property {string} [TITLE] - Localized placement title.
	 * @property {string} [APP_NAME] - Application name.
	 */

	class MarketAppManager
	{
		/**
		 * @param {object} props
		 * @param {PlacementRecord} props.app - Placement record returned by getList().
		 * @param {object} [props.placementOptions] - Context params passed to the app as PLACEMENT_OPTIONS.
		 *   Serialized as `bx24_placementOptions` GET parameter (bx24_ prefix prevents collisions
		 *   with arbitrary query params on the shared /mobile/marketplace/ endpoint).
		 *   The app receives them via BX24.placement.info().
		 */
		static openApp({ app, placementOptions })
		{
			const title = app.TITLE || app.APP_NAME || '';

			let url = `/mobile/marketplace/?id=${app.APP_ID}`
				+ `&bx24_placement=${encodeURIComponent(app.PLACEMENT)}`
				+ `&bx24_placementId=${app.ID}`;

			if (placementOptions)
			{
				url += `&bx24_placementOptions=${encodeURIComponent(JSON.stringify(placementOptions))}`;
			}

			PageManager.openPage({
				url,
				titleParams: {
					text: title,
					type: 'dialog',
				},
				backdrop: {
					showOnTop: true,
					topPosition: 100,
					swipeAllowed: false,
					horizontalSwipeAllowed: false,
				},
			});
		}

		/**
		 * @param {string} placement - Placement location identifier,
		 *   e.g. 'CRM_LEAD_LIST_MENU', 'TASK_LIST_TOOLBAR', 'IM_CONTEXT_MENU'.
		 * @returns {Promise<PlacementRecord[]>} Resolves with an array of placement records.
		 */
		static getList(placement)
		{
			return BX.ajax.runAction('rest.application.embeddingList', { data: { placement } })
				.then((response) => (response.data ?? []).map((item) => ({
					...item,
					PLACEMENT: placement,
				})));
		}
	}

	module.exports = { MarketAppManager };
});
