<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/clickable-user.bundle.css',
	'js' => 'dist/clickable-user.bundle.js',
	'rel' => [
		'main.core',
		'ui.icons',
	],
	'skip_core' => false,
];
