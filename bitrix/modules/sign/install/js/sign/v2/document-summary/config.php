<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-summary.bundle.css',
	'js' => 'dist/document-summary.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sign.v2.api',
	],
	'skip_core' => false,
];