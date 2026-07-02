<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/booking-card.bundle.css',
	'js' => 'dist/booking-card.bundle.js',
	'rel' => [
		'booking.component.client-popup',
		'booking.component.note-popup',
		'booking.component.popup',
		'booking.const',
		'booking.core',
		'booking.lib.currency-format',
		'booking.lib.limit',
		'main.core',
		'main.popup',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.main',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
