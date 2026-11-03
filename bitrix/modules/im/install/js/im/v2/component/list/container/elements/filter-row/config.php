<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/filter-row.bundle.css',
	'js' => 'dist/filter-row.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.css.classes',
		'im.v2.lib.counter',
		'im.v2.lib.menu',
		'ui.cnt',
		'ui.system.chip.vue',
		'ui.vue3',
		'ui.vue3.components.counter',
	],
	'skip_core' => true,
];
