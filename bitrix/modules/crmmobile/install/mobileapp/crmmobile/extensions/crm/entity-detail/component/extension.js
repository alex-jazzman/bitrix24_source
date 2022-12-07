/**
 * @module crm/entity-detail/component
 */
jn.define('crm/entity-detail/component', (require, exports, module) => {

	const { ajaxErrorHandler } = require('crm/entity-detail/component/ajax-error-handler');
	const { onCloseHandler } = require('crm/entity-detail/component/on-close-handler');
	const { headerProcessor } = require('crm/entity-detail/component/header-processor');
	const { menuProvider } = require('crm/entity-detail/component/menu-provider');
	const { rightButtonsProvider } = require('crm/entity-detail/component/right-buttons-provider');
	const { additionalButtonProvider } = require('crm/entity-detail/component/additional-button-provider');
	const { setAvailableTabs } = require('crm/entity-detail/component/set-available-tabs');
	const { listenTimelinePush } = require('crm/entity-detail/component/timeline-push-processor');
	const { customEvents } = require('crm/entity-detail/component/custom-events');
	const { globalEvents } = require('crm/entity-detail/component/global-events');
	const { getSmartActivityMenuItem } = require('crm/entity-detail/component/smart-activity-menu-item');
	const { onEntityModelReady } = require('crm/entity-detail/component/on-model-ready');

	module.exports = {
		ajaxErrorHandler,
		onCloseHandler,
		headerProcessor,
		menuProvider,
		rightButtonsProvider,
		setAvailableTabs,
		additionalButtonProvider,
		listenTimelinePush,
		customEvents,
		globalEvents,
		getSmartActivityMenuItem,
		onEntityModelReady,
	};
});
