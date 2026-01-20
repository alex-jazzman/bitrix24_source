<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sku-resources-editor.bundle.css',
	'js' => 'dist/sku-resources-editor.bundle.js',
	'rel' => [
		'ui.vue3',
		'booking.component.mixin.loc-mixin',
		'booking.model.sku-resources-editor',
		'booking.component.ui-tabs',
		'booking.lib.currency-format',
		'booking.component.avatar',
		'booking.lib.side-panel-instance',
		'booking.provider.service.catalog-service-sku-service',
		'main.core',
		'booking.lib.deep-to-raw',
		'ui.vue3.components.counter',
		'ui.cnt',
		'booking.component.button',
		'main.core.events',
		'ui.entity-selector',
		'ui.vue3.vuex',
		'ui.icon-set.api.vue',
		'booking.core',
		'booking.const',
		'booking.provider.service.resource-dialog-service',
	],
	'skip_core' => false,
];
