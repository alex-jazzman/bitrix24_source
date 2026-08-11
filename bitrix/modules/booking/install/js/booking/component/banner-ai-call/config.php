<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/banner-ai-call.bundle.css',
	'js' => 'dist/banner-ai-call.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.component.button',
		'booking.component.popup',
		'main.popup',
		'ui.confetti',
		'ui.icon-set.actions',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
	],
	'skip_core' => true,
];
