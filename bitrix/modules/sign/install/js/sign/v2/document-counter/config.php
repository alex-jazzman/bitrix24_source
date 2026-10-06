<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-counter.bundle.css',
	'js' => 'dist/document-counter.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.counterpanel',
	],
	'skip_core' => false,
];