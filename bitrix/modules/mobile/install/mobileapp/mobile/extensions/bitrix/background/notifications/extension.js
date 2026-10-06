/**
 * @module background/notifications
 */
jn.define('background/notifications', (require, exports, module) => {
	const { DemoWebNotification } = require('background/notifications/demo-web');
	const { OpenCopilotChatTabNotification } = require('background/notifications/open-copilot-chat-tab');
	const { OpenDesktopNotification } = require('background/notifications/open-desktop');
	const { OpenHelpdeskNotification } = require('background/notifications/open-helpdesk');
	const { OpenReturnNotification } = require('background/notifications/open-return');
	const { OpenInviteNotification } = require('background/notifications/open-invite');
	const { OpenPromotionNotification } = require('background/notifications/promotion');
	const { SetNotificationsNotification } = require('background/notifications/set-notifications');

	module.exports = () => {
		new DemoWebNotification();
		new OpenCopilotChatTabNotification();
		new OpenDesktopNotification();
		new OpenHelpdeskNotification();
		new OpenReturnNotification();
		new OpenInviteNotification();
		new OpenPromotionNotification();
		new SetNotificationsNotification();
		OpenDesktopNotification.bindOpenDesktopEvent();
		OpenHelpdeskNotification.bindOpenHelpdeskEvent();
		OpenPromotionNotification.bindPromotionEvent();
	};
});
