<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/datetime.bundle.css',
	'js' => 'dist/datetime.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];
