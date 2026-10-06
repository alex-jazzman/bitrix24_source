<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/bulk-action-process.bundle.css',
	'js' => 'dist/bulk-action-process.bundle.js',
	'rel' => [
		'main.core',
		'sign.v2.api',
		'ui.a11y',
		'ui.dialogs.messagebox',
		'ui.notification',
		'ui.stepprocessing',
	],
	'skip_core' => false,
];
