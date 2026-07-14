<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/list-slider.bundle.css',
	'js' => 'dist/list-slider.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];