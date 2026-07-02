<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/file-limit.bundle.css',
	'js' => 'dist/file-limit.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.notification',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];