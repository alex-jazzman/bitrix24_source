<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/conference-channel.bundle.css',
	'js' => 'dist/conference-channel.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.v2.lib.desktop-api',
		'call.core',
	],
	'skip_core' => true,
];
