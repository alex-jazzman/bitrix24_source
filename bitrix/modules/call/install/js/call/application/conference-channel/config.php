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
		'call.adapter.desktop-api',
		'call.infrastructure.broadcast-channel',
	],
	'skip_core' => true,
];
