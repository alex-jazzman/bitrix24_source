<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/grid.bundle.css',
	'js' => ['dist/grid.bundle.js'],
	'rel' => [
		'mail.migration-state',
		'main.core',
		'main.date',
		'main.popup',
		'ui.analytics',
		'ui.avatar',
		'ui.buttons',
		'ui.cnt',
		'ui.dialogs.messagebox',
		'ui.icon',
		'ui.icons.b24',
		'ui.notification',
		'ui.system.chip',
	],
	'skip_core' => false,
];
