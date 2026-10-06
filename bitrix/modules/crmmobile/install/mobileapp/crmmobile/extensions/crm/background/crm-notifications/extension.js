/**
 * @module crm/background/crm-notifications
 */
jn.define('crm/background/crm-notifications', (require, exports, module) => {
	const { CrmTabsOpenNotification } = require('crm/background/crm-notifications/crm-tab-open');
	const { BackgroundTimelineNotifications } = require('crm/background/crm-notifications/timeline-notifications');
	const { CrmTabsOpenFromMoreNotification } = require('crm/background/crm-notifications/crm-tab-open-from-more');

	module.exports = () => {
		new CrmTabsOpenNotification();
		new BackgroundTimelineNotifications();
		new CrmTabsOpenFromMoreNotification();
	};
});
