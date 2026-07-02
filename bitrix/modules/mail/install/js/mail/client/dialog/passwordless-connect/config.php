<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/passwordless-connect.bundle.css',
	'js' => 'dist/passwordless-connect.bundle.js',
	'rel' => [
		'main.core',
		'ui.buttons',
		'ui.system.input',
		'ui.confetti',
		'mail.client.dialog.base-dialog',
	],
	'lang' => 'lang/ru/config.php',
	'skip_core' => false,
];
