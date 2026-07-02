<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/filter.bundle.css',
	'js' => 'dist/filter.bundle.js',
	'rel' => [
		'booking.const',
		'main.core',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
