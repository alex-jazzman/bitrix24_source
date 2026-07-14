<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-growing-text-area.bundle.css',
	'js' => 'dist/ui-growing-text-area.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
