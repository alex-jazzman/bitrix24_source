<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/yandex-integration-wizard.bundle.css',
	'js' => 'dist/yandex-integration-wizard.bundle.js',
	'rel' => [
		'booking.application.sku-resources-editor',
		'booking.component.avatar',
		'booking.component.button',
		'booking.component.help-desk-loc',
		'booking.component.loader',
		'booking.component.mixin.loc-mixin',
		'booking.component.ui-error-message',
		'booking.component.ui-resource-wizard-item',
		'booking.const',
		'booking.core',
		'booking.lib.deep-to-raw',
		'booking.lib.side-panel-instance',
		'booking.lib.utils',
		'booking.model.yandex-integration-wizard',
		'booking.provider.service.main-page-service',
		'booking.provider.service.resource-dialog-service',
		'booking.provider.service.yandex-integration-wizard-service',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.dialogs.messagebox',
		'ui.icon-set.api.vue',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
