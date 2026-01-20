<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => ['dist/grid.bundle.js'],
	'rel' => [
		'ui.cnt',
		'main.date',
		'ui.notification',
		'ui.system.chip',
		'main.popup',
		'ui.avatar',
		'ui.icons.b24',
		'ui.icon',
		'ui.buttons',
		'ui.analytics',
		'main.core',
	],
	'skip_core' => false,
];
