<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/field-hover-button.bundle.css',
	'js' => 'dist/field-hover-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
	],
	'skip_core' => true,
];
