<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/role.bundle.css',
	'js' => 'dist/role.bundle.js',
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'main.core',
	],
	'skip_core' => false,
];
