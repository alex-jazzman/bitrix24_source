<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}


return [
	'js' => 'dist/cloud-client-registration.bundle.js',
	'css' => 'dist/cloud-client-registration.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.forms',
		'ui.layout-form',
	],
	'skip_core' => false,
	'settings' => [],
];
