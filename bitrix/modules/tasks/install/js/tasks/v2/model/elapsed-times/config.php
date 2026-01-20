<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/elapsed-times.bundle.css',
	'js' => 'dist/elapsed-times.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.vuex',
		'tasks.v2.const',
	],
	'skip_core' => false,
];
