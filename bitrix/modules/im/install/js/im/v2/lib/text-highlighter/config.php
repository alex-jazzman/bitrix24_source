<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/text-highlighter.bundle.css',
	'js' => 'dist/text-highlighter.bundle.js',
	'rel' => [
		'im.v2.lib.utils',
		'main.core',
	],
	'skip_core' => false,
];