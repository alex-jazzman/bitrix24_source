<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/hotkeys.bundle.js',
	'css' => './dist/hotkeys.bundle.css',
	'rel' => [
		'main.core',
		'ui.hint',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
