<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/growing-text-area.bundle.css',
	'js' => 'dist/growing-text-area.bundle.js',
	'rel' => [
		'ui.vue3.components.popup',
		'main.core',
	],
	'skip_core' => false,
];
