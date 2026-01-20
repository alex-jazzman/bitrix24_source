<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/select.bundle.css',
	'js' => 'dist/select.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.system.input.vue',
		'ui.system.menu.vue',
	],
	'skip_core' => true,
];
