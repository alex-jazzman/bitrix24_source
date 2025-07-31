<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chart-store.bundle.css',
	'js' => 'dist/chart-store.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3.pinia',
		'humanresources.company-structure.api',
		'humanresources.company-structure.utils',
	],
	'skip_core' => false,
];