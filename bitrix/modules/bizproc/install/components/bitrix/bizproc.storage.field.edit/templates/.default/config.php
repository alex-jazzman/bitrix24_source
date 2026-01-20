<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'script.js',
	'rel' => [
		'main.core',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'main.loader',
	],
	'skip_core' => false,
];
