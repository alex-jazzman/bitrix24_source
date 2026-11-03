<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/result-message-service.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
	],
	'skip_core' => true,
];
