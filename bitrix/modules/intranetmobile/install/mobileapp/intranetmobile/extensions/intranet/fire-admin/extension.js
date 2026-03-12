/**
 * @module intranet/fire-admin
 */
jn.define('intranet/fire-admin', (require, exports, module) => {
	const { FireAdminConfirmation } = require('intranet/fire-admin/src/ui');
	const { FireAdminStrategy } = require('intranet/fire-admin/src/fire-admin-strategy');
	const { TransferAdminRightsStrategy } = require('intranet/fire-admin/src/transfer-admin-rights-strategy');
	const { RequestAdminFireStrategy } = require('intranet/fire-admin/src/request-admin-fire-strategy');
	const { BottomSheet } = require('bottom-sheet');
	const { Color } = require('tokens');
	const { FirstAdminAction, sendFirstAdminRequest } = require('intranet/fire-admin/src/utils');

	/**
	 * @typedef {Object} ConfirmationOptions
	 * @property {Number} initiatorId
	 * @property {Number} currentAdminId
	 * @property {String} [initiatorFullName]
	 * @property {Object} [parentWidget]
	 */

	/**
	 * @param {ConfirmationStrategy} StrategyClass
	 * @returns {Function}
	 */
	function makeOpen(StrategyClass)
	{
		if (!StrategyClass)
		{
			console.error('FireAdminConfirmation: strategy is required');

			return () => {};
		}

		return (options = {}) => {
			if (!options.currentAdminId || !options.initiatorId)
			{
				console.error('FireAdminConfirmation: currentAdminId & initiatorId are required');

				return;
			}

			const parentWidget = options.parentWidget ?? PageManager;
			const component = (layoutWidget) => FireAdminConfirmation({
				layoutWidget,
				parentWidget,
				strategy: new StrategyClass(),
				...options,
			});

			void new BottomSheet({ component })
				.setParentWidget(parentWidget)
				.setNavigationBarColor(Color.bgSecondary)
				.setBackgroundColor(Color.bgSecondary)
				.alwaysOnTop()
				.open()
			;
		};
	}

	module.exports = {
		/** @type {{ open: (options?: ConfirmationOptions) => void }} */
		FireAdminConfirmation: { open: makeOpen(FireAdminStrategy) },
		/** @type {{ open: (options?: ConfirmationOptions) => void }} */
		TransferAdminRightsConfirmation: { open: makeOpen(TransferAdminRightsStrategy) },
		/** @type {{ open: (options?: ConfirmationOptions) => void }} */
		RequestAdminFireConfirmation: { open: makeOpen(RequestAdminFireStrategy) },
		FirstAdminAction,
		sendFirstAdminRequest,
	};
});
