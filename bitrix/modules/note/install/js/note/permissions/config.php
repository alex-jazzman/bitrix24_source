<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/permissions.bundle.js',
	'css' => 'dist/permissions.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'main.sidepanel',
		'note.ui.theme-context',
		'ui.buttons',
		'ui.entity-selector',
		'ui.hint',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.system.dialog',
	],
	'skip_core' => false,
];
