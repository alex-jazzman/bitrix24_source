<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/booking-info.bundle.css',
	'js' => 'dist/booking-info.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
