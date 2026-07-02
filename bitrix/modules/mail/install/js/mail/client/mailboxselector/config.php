<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mailboxselector.bundle.css',
	'js' => 'dist/mailboxselector.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
