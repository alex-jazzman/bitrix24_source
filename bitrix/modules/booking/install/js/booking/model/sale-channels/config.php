<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sale-channels.bundle.css',
	'js' => 'dist/sale-channels.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];

