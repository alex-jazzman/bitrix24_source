<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/check-in.bundle.css',
	'js' => 'dist/check-in.bundle.js',
	'rel' => [
		'im.v2.component.message.base',
		'im.v2.component.message.default',
		'im.v2.component.message.elements',
		'im.v2.lib.analytics',
		'main.core',
		'stafftrack.user-statistics-link',
	],
	'skip_core' => false,
];
