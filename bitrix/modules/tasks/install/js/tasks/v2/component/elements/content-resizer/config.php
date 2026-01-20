<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/content-resizer.bundle.css',
	'js' => 'dist/content-resizer.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
