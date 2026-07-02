<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent.bundle.css',
	'js' => 'dist/recent.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.channel',
		'im.v2.lib.message',
		'im.v2.lib.utils',
		'main.core',
	],
	'skip_core' => false,
];
