<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/interface.bundle.js',
	'rel' => [
		'booking.const',
		'booking.lib.grid',
		'booking.lib.timezone',
		'booking.lib.utils',
		'main.core',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
