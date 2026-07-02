<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => ['dist/grid.bundle.js'],
	'rel' => [
		'main.core',
		'main.date',
		'ui.avatar',
		'ui.dialogs.messagebox',
		'ui.notification',
		'ui.system.chip',
	],
	'skip_core' => false,
];
