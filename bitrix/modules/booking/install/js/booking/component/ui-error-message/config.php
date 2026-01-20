<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ui-error-message.bundle.css',
	'js' => 'dist/ui-error-message.bundle.js',
	'rel' => [
		'main.polyfill.core',
	],
	'skip_core' => true,
];
