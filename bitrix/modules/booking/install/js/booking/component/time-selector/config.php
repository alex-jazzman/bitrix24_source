<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/time-selector.bundle.css',
	'js' => 'dist/time-selector.bundle.js',
	'rel' => [
		'booking.const',
		'booking.lib.duration',
		'main.core',
		'main.date',
		'main.popup',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
