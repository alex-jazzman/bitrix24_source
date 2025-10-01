<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/dialog.bundle.css',
	'js' => 'dist/dialog.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.system.typography',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
