<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sku.bundle.css',
	'js' => 'dist/sku.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
