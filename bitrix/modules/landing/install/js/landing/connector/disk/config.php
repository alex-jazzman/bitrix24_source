<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/connector.disk.bundle.css',
	'js' => 'dist/connector.disk.bundle.js',
	'rel' => [
		'main.core',
	],
	'skip_core' => false,
];