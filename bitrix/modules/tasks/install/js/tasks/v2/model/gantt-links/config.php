<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/gantt-links.bundle.css',
	'js' => 'dist/gantt-links.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.vuex',
		'tasks.v2.const',
	],
	'skip_core' => true,
];
