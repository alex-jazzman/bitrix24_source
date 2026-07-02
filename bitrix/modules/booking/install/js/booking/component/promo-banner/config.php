<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/promo-banner.bundle.css',
	'js' => 'dist/promo-banner.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.component.button',
		'booking.component.popup',
		'booking.provider.service.main-page-service',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
	],
	'skip_core' => true,
];
