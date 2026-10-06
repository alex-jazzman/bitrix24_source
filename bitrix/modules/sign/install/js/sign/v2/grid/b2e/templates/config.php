<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'main.core',
		'sign.feature-storage',
		'sign.type',
		'sign.v2.analytics',
		'sign.v2.api',
		'sign.v2.grid.components.action-panel',
		'sign.v2.grid.components.folder',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.switcher',
	],
	'skip_core' => false,
];
