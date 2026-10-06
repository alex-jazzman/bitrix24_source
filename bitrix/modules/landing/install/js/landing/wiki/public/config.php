<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/public.bundle.css',
	'js' => 'dist/public.bundle.js',
	'rel' => [
		'landing.sliderhacks',
		'main.core',
	],
	'skip_core' => false,
];