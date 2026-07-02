<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/menu.bundle.css',
	'js' => 'dist/menu.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.cnt',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
