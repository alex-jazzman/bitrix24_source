<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/trial-banner.bundle.css',
	'js' => 'dist/trial-banner.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.component.button',
		'booking.component.popup',
		'ui.icon-set.api.vue',
		'ui.lottie',
	],
	'skip_core' => true,
];
