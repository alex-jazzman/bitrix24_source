/**
 * @module im/messenger/provider/services/recent/service
 */
jn.define('im/messenger/provider/services/recent/service', (require, exports, module) => {
	const { PinService } = require('im/messenger/provider/services/recent/pin');
	const { HideService } = require('im/messenger/provider/services/recent/hide');

	/**
	 * @class RecentService
	 */
	class RecentService
	{
		/** @type {PinService} */
		#pinService;
		/** @type {HideService} */
		#hideService;

		get pinService()
		{
			this.#pinService = this.#pinService ?? new PinService();

			return this.#pinService;
		}

		get hideService()
		{
			this.#hideService = this.#hideService ?? new HideService();

			return this.#hideService;
		}

		pinChat(dialogId)
		{
			this.pinService.pinChat(dialogId);
		}

		unpinChat(dialogId)
		{
			this.pinService.unpinChat(dialogId);
		}

		hideChat(dialogId)
		{
			this.hideService.hideChat(dialogId);
		}
	}

	module.exports = {
		RecentService,
	};
});
