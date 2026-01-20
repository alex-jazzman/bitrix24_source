<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bottom-sheet.bundle.css',
	'js' => 'dist/bottom-sheet.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
