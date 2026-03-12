/**
 * @module im/messenger/lib/element/dialog/src/message/banner/banners/admin/utils
 */
jn.define('im/messenger/lib/element/dialog/src/message/banner/banners/admin/utils', (require, exports, module) => {
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');

	/**
	 * @param {number} supportDialogId
	 * @param {string} senderPage
	 * @returns {void}
	 */
	const openSupport = (supportDialogId, senderPage) => {
		if (supportDialogId > 0)
		{
			void DialogOpener.open({ dialogId: supportDialogId });

			return;
		}

		openSupportForm(senderPage);
	};

	/**
	 * @param {string} [senderPage='']
	 * @returns {void}
	 */
	const openSupportForm = (senderPage = '') => {
		(new FeedbackForm({
			sender_page: senderPage,
		})).openInBackdrop({
			hideNavigationBar: true,
			swipeAllowed: true,
			forceDismissOnSwipeDown: false,
			showOnTop: true,
			adoptHeightByKeyboard: true,
			shouldResizeContent: true,
		});
	};

	/**
	 * @returns {void}
	 */
	const openHelpdesk = () => {
		const articleCode = '27859766';
		helpdesk.openHelpArticle(articleCode, 'helpdesk');
	};

	module.exports = {
		openSupport,
		openHelpdesk,
	};
});
