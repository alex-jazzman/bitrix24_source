<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/search-item-layout.bundle.css',
	'js' => 'dist/search-item-layout.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
