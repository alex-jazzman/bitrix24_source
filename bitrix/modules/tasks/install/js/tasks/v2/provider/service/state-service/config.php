<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/state-service.bundle.css',
	'js' => 'dist/state-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'tasks.v2.lib.api-client',
		'tasks.v2.const',
	],
	'skip_core' => true,
];
