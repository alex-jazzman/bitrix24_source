<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sku-resources-editor.bundle.css',
	'js' => 'dist/sku-resources-editor.bundle.js',
	'rel' => [
		'booking.component.avatar',
		'booking.component.button',
		'booking.component.mixin.loc-mixin',
		'booking.component.ui-tabs',
		'booking.const',
		'booking.core',
		'booking.lib.currency-format',
		'booking.lib.deep-to-raw',
		'booking.lib.side-panel-instance',
		'booking.model.resource-types',
		'booking.model.resources',
		'booking.model.sku-resources-editor',
		'booking.provider.service.catalog-service-sku-service',
		'booking.provider.service.resource-dialog-service',
		'main.core',
		'main.core.events',
		'ui.cnt',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.vue3',
		'ui.vue3.components.counter',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
