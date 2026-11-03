<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/tag.bundle.css',
	'js' => 'dist/tag.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.notification',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];