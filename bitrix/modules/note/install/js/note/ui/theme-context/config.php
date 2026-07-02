<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/theme-context.bundle.js',
	'css' => './dist/theme-context.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];
