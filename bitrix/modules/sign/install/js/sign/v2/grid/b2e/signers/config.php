<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/signers.bundle.css',
	'js' => 'dist/signers.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'sign.v2.api',
		'ui.avatar',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
