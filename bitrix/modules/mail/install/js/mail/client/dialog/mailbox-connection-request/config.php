<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mailbox-connection-request.bundle.css',
	'js' => 'dist/mailbox-connection-request.bundle.js',
	'rel' => [
		'main.core',
		'ui.buttons',
		'ui.system.input',
		'mail.client.dialog.base-dialog',
	],
	'lang' => 'lang/ru/config.php',
	'skip_core' => false,
];
