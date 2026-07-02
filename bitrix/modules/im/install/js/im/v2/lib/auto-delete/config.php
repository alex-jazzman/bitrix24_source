<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/auto-delete.bundle.js',
	'rel' => [
		'im.v2.const',
		'im.v2.lib.permission',
		'main.core',
	],
	'skip_core' => false,
];
