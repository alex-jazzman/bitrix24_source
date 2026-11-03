<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/air-popup.bundle.css',
	'js' => 'dist/air-popup.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.system.dialog',
		'ui.vue3',
	],
	'skip_core' => false,
];
