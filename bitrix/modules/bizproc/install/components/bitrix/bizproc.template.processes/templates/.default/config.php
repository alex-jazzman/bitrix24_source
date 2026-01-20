<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'script.js',
	'css' => 'style.css',
	'rel' => [
		'main.core',
		'ui.dialogs.messagebox',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
