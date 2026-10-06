<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/backend.bundle.js',
	'rel' => [
		'landing.env',
		'main.core',
	],
	'skip_core' => false,
];