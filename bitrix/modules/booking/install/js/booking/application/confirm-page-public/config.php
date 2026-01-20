<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/confirm-page-public.bundle.css',
	'js' => 'dist/confirm-page-public.bundle.js',
	'rel' => [
		'ui.vue3',
		'booking.component.mixin.loc-mixin',
		'main.core',
		'ui.icon-set.main',
		'main.date',
		'booking.lib.currency-format',
		'ui.icon-set.api.vue',
		'main.popup',
		'booking.component.popup',
		'ui.icon-set.actions',
		'booking.component.button',
		'booking.model.bookings',
	],
	'skip_core' => false,
];
