<?php

return [
	'extensions' => [
		'analytics',
		'analytics-label',
		'alert',
		'rest',
		'loc',
		'haptics',
		'layout/ui/stage-list',
		'layout/ui/detail-card/action/check-for-changes',
		'layout/ui/detail-card/tabs/factory/type',
		'layout/ui/widget-header-button',
		'layout/ui/plan-restriction',
		'layout/ui/info-helper',
		'native/contacts',
		'notify',
		'notify-manager',
		'ui-system/blocks/icon',
		'utils/prop',
		'utils/object',
		'utils/string',
		'utils/function',
		'utils/type',
		'event-emitter',
		'pull/client/events',
		'tokens',
		'ui-system/form/buttons/button',
		'ui-system/layout/box',
		'ui-system/layout/dialog-footer',
		'ui-system/layout/area',
		'ui-system/layout/area-list',
		'ui-system/typography/text',
		'layout/ui/stage-list/item/step',
		'utils/page-manager',

		'crm:assets/entity',
		'crm:loc',
		'crm:required-fields',
		'crm:timeline/scheduler',
		'crm:type',
		'crm:entity-actions',
		'crm:stage-list-view',
		'crm:entity-detail/component/additional-button-provider',
		'crm:entity-detail/component/floating-button-provider',
		'crm:entity-detail/component/right-buttons-provider',
		'crm:entity-detail/component/aha-moments-manager',
		'crm:entity-detail/component/smart-activity-menu-item',
		'crm:document/list',
		'crm:receive-payment/mode-selection',
		'crm:entity-document',
		'crm:entity-chat-opener',

		'statemanager/redux/connect',
		'statemanager/redux/store',
		'crm:terminal/entity/payment-create',
		'crm:terminal/entity/payment-pay-opener',
		'crm:statemanager/redux/slices/kanban-settings',
		'crm:statemanager/redux/slices/stage-settings',

		'catalog:store/document-card/manager',

		'imconnector:connectors/telegram',
	],
	'bundle' => [
		'./ajax-error-handler',
		'./analytics-provider',
		'./custom-events',
		'./global-events',
		'./header-processor',
		'./menu-provider',
		'./on-close-handler',
		'./on-model-ready',
		'./set-available-tabs',
		'./payment-automation-menu-item',
		'./timeline-push-processor',
		'./open-lines-menu-items',
	],
];
