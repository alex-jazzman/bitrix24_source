<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/engine-core.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'call.engine.registry',
		'main.core.events',
	],
	'skip_core' => true,
];
