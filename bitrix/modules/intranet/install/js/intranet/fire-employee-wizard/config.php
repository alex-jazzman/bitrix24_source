<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/fire-employee-wizard.bundle.css',
	'js' => 'dist/fire-employee-wizard.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.dialogs.tooltip',
	],
	'settings' => [
		'integrationUri' => SITE_DIR . 'devops/list/',
	],
	'skip_core' => false,
];
