<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/resources.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'booking.const',
		'ui.vue3.vuex',
	],
	'skip_core' => true,
];
