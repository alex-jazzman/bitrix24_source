<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/engine-legacy.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.core',
		'call.engine.registry',
	],
	'skip_core' => true,
];
