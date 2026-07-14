<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-hint.bundle.css',
	'js' => 'dist/ui-hint.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
