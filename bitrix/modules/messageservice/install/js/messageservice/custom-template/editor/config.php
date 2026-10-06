<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/editor.bundle.js',
	'css' => 'dist/editor.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.system.chip',
		'ui.system.dialog',
		'ui.system.input',
	],
	'skip_core' => false,
];
