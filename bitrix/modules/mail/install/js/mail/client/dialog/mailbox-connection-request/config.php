<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mailbox-connection-request.bundle.css',
	'js' => 'dist/mailbox-connection-request.bundle.js',
	'rel' => [
		'mail.client.dialog.base-dialog',
		'main.core',
		'ui.buttons',
		'ui.info-helper',
		'ui.system.input',
	],
	'lang' => 'lang/ru/config.php',
	'skip_core' => false,
];
