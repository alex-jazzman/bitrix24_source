<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/dialog-markup.bundle.js',
	'css' => './dist/dialog-markup.bundle.css',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
