<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/interface.bundle.css',
	'js' => 'dist/interface.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.vue3.pinia',
	],
	'skip_core' => true,
];
