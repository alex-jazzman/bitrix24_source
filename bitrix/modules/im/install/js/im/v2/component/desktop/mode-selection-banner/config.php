<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mode-selection-banner.bundle.css',
	'js' => 'dist/mode-selection-banner.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.const',
		'im.v2.lib.analytics',
		'im.v2.lib.promo',
		'im.v2.lib.desktop-api',
		'ui.vue3.components.button',
	],
	'skip_core' => true,
];
