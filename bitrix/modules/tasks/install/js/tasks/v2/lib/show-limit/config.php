<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/show-limit.bundle.css',
	'js' => 'dist/show-limit.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
