<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/title-pattern.bundle.js',
	'css' => 'dist/title-pattern.bundle.css',
	'rel' => [
		'main.core',
		'ui.entity-selector',
		'ui.system.input.vue',
		'ui.vue3',
	],
	'skip_core' => false,
];
