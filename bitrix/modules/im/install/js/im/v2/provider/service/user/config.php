<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user.bundle.css',
	'js' => 'dist/user.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.rest',
		'im.v2.lib.user',
	],
	'skip_core' => true,
];
