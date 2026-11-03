<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/transport-testing.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.engine.transport',
	],
	'skip_core' => true,
];
