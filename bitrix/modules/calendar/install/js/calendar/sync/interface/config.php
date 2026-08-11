<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/syncinterface.bundle.css',
	'js' => 'dist/syncinterface.bundle.js',
	'rel' => [
		'calendar.entry',
		'calendar.sync.manager',
		'calendar.util',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.alerts',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.forms',
		'ui.icon-set.actions',
		'ui.qrauthorization',
		'ui.tilegrid',
	],
	'skip_core' => false,
];
