<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/checkbox.bundle.css',
	'js' => 'dist/checkbox.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.component.ui.icon',
		'ui.vue3',
	],
	'skip_core' => true,
];
