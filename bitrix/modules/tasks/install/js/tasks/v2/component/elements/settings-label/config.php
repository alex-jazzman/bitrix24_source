<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/settings-label.bundle.css',
	'js' => 'dist/settings-label.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
	'skip_core' => true,
];
