<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/actions-popup.bundle.css',
	'js' => 'dist/actions-popup.bundle.js',
	'rel' => [
		'booking.component.button',
		'booking.component.client-popup',
		'booking.component.cycle-popup',
		'booking.component.loader',
		'booking.component.note-popup',
		'booking.component.popup',
		'booking.component.popup-maker',
		'booking.const',
		'booking.lib.aha-moments',
		'booking.lib.currency-format',
		'booking.lib.deal-helper',
		'booking.lib.duration',
		'booking.lib.help-desk',
		'booking.lib.limit',
		'booking.provider.service.booking-actions-service',
		'booking.provider.service.booking-service',
		'booking.provider.service.resource-dialog-service',
		'main.core',
		'main.date',
		'main.popup',
		'main.sidepanel',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.label',
		'ui.vue3',
		'ui.vue3.directives.hint',
		'ui.vue3.directives.lazyload',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
