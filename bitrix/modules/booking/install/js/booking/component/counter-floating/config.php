<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/counter-floating.bundle.css',
	'js' => 'dist/counter-floating.bundle.js',
	'rel' => [
		'booking.component.popup',
		'booking.const',
		'booking.lib.aha-moments',
		'booking.lib.filter-result-navigator',
		'main.core',
		'ui.icon-set.api.vue',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
