<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sign.v2.api',
		'sign.v2.grid.components.action-panel',
		'sign.v2.grid.components.folder',
		'sign.v2.grid.components.users',
		'ui.buttons',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];
