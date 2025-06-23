<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/actions-popup.bundle.css',
	'js' => 'dist/actions-popup.bundle.js',
	'rel' => [
		'booking.component.popup-maker',
		'booking.component.popup',
		'main.sidepanel',
		'ui.vue3.directives.lazyload',
		'booking.component.note-popup',
		'booking.component.client-popup',
		'main.date',
		'ui.entity-selector',
		'booking.lib.deal-helper',
		'booking.provider.service.booking-actions-service',
		'ui.vue3.directives.hint',
		'ui.icon-set.api.core',
		'booking.component.cycle-popup',
		'booking.lib.aha-moments',
		'ui.vue3',
		'ui.icon-set.main',
		'booking.lib.help-desk',
		'booking.component.loader',
		'main.core',
		'main.popup',
		'ui.vue3.vuex',
		'ui.icon-set.api.vue',
		'booking.const',
		'booking.lib.limit',
		'booking.component.button',
	],
	'skip_core' => false,
];
