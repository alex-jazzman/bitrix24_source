<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/alert.bundle.css',
	'js' => 'dist/alert.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.typography',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.system.typography.vue',
		'ui.icon-set.api.vue',
	],
	'skip_core' => false,
];
