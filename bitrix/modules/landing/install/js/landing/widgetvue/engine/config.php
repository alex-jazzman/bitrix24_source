<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/engine.bundle.css',
	'js' => 'dist/engine.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.vue3',
	],
	'skip_core' => false,
];
