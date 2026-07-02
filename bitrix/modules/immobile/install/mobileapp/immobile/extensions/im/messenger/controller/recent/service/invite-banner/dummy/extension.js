/**
 * @module im/messenger/controller/recent/service/invite-banner/dummy
 */
jn.define('im/messenger/controller/recent/service/invite-banner/dummy', (require, exports, module) => {
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IInviteBannerService}
	 * @class DummyInviteBannerService
	 */
	class DummyInviteBannerService extends BaseUiRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		/**
		 * @param {BaseList} ui
		 */
		async onUiReady(ui)
		{
			this.logger.log('onUiReady');

			this.ui = ui;
		}

		subscribeEvents()
		{
			this.logger.log('subscribeEvents');
		}

		redraw()
		{
			this.logger.log('redraw');
		}
	}

	module.exports = DummyInviteBannerService;
});
