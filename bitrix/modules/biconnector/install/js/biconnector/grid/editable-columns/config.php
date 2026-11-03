<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/editable-columns.bundle.css',
	'js' => 'dist/editable-columns.bundle.js',
	'rel' => [
		'biconnector.error-message',
		'main.core',
		'ui.notification',
	],
	'skip_core' => false,
];
