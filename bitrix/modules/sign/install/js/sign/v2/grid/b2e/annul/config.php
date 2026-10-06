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
		'sign.v2.grid.components.action-panel',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
