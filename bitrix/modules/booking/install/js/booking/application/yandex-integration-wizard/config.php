<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/yandex-integration-wizard.bundle.css',
	'js' => 'dist/yandex-integration-wizard.bundle.js',
	'rel' => [
		'ui.vue3',
		'booking.component.mixin.loc-mixin',
		'booking.lib.side-panel-instance',
		'booking.model.yandex-integration-wizard',
		'booking.core',
		'booking.component.loader',
		'booking.component.avatar',
		'booking.application.sku-resources-editor',
		'booking.lib.deep-to-raw',
		'booking.component.help-desk-loc',
		'booking.component.ui-error-message',
		'ui.icon-set.api.vue',
		'booking.utils',
		'booking.component.ui-resource-wizard-item',
		'booking.provider.service.main-page-service',
		'ui.vue3.vuex',
		'main.core.events',
		'booking.const',
		'booking.component.button',
		'booking.provider.service.yandex-integration-wizard-service',
		'main.core',
		'main.popup',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
