<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/confirm-page-public.bundle.css',
	'js' => 'dist/confirm-page-public.bundle.js',
	'rel' => [
		'booking.component.button',
		'booking.component.mixin.loc-mixin',
		'booking.component.popup',
		'booking.lib.currency-format',
		'main.core',
		'main.date',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.vue3',
	],
	'skip_core' => false,
];
