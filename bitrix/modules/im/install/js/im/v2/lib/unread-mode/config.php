<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/unread-mode.bundle.css',
	'js' => 'dist/unread-mode.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.application.core',
	],
	'skip_core' => true,
];
