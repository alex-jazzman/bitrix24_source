<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/fire-system-user-wizard.bundle.js',
	'css' => './dist/fire-system-user-wizard.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.system.alert',
	],
	'skip_core' => false,
];
