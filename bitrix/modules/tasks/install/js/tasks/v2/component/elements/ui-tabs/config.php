<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-tabs.bundle.css',
	'js' => 'dist/ui-tabs.bundle.js',
	'rel' => [
		'main.core',
		'ui.system.typography.vue',
	],
	'skip_core' => false,
];
