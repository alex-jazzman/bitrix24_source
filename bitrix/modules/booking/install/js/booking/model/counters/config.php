<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/counters.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'booking.const',
	],
	'skip_core' => true,
];
