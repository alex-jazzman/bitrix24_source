<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-block.bundle.css',
	'js' => 'dist/document-block.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
