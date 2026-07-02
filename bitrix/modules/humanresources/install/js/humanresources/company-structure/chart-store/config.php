<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chart-store.bundle.css',
	'js' => 'dist/chart-store.bundle.js',
	'rel' => [
		'humanresources.company-structure.api',
		'humanresources.company-structure.chart-store',
		'humanresources.company-structure.utils',
		'main.core',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];