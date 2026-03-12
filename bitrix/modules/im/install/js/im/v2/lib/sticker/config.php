<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/sticker.bundle.css',
	'js' => 'dist/sticker.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
