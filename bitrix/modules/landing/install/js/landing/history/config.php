<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/history.bundle.css',
	'js' => 'dist/history.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.env',
		'landing.main',
		'landing.pageobject',
		'landing.tailwind.runtimesync',
		'landing.ui.highlight',
		'main.core',
	],
	'skip_core' => false,
];
