<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/settings-panel.bundle.css',
	'js' => 'dist/settings-panel.bundle.js',
	'rel' => [
		'date',
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.countdown',
		'ui.date-picker',
		'ui.design-tokens',
		'ui.hint',
		'ui.notification',
		'ui.switcher',
		'ui.system.input',
	],
	'skip_core' => false,
];
