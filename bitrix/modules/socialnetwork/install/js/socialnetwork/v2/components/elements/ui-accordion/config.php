<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-accordion.bundle.css',
	'js' => 'dist/ui-accordion.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
	],
	'skip_core' => true,
];
