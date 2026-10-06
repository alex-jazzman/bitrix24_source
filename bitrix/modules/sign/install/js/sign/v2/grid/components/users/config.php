<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/users.bundle.js',
	'css' => 'dist/users.bundle.css',
	'rel' => [
		'main.core',
		'main.loader',
		'main.popup',
		'ui.icons.b24',
	],
	'skip_core' => false,
];
