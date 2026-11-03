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
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.typography',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];
