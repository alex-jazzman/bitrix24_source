<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/api-client.bundle.css',
	'js' => 'dist/api-client.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
