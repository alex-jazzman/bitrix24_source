<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/discuss-in-chat.bundle.css',
	'js' => 'dist/discuss-in-chat.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
