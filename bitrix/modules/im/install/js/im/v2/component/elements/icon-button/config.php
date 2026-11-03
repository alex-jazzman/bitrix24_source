<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/icon-button.bundle.css',
	'js' => 'dist/icon-button.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.css.classes',
		'ui.icon-set.api.vue',
		'ui.vue3',
	],
	'skip_core' => true,
];
