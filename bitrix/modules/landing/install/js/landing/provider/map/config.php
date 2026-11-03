<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/map.bundle.css',
	'js' => 'dist/map.bundle.js',
	'rel' => [
		'landing.collection.basecollection',
		'main.core',
		'main.core.events',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];