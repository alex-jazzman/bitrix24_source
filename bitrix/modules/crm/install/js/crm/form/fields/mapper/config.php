<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/mapper.bundle.css',
	'js' => 'dist/mapper.bundle.js',
	'rel' => [
		'landing.ui.collection.buttoncollection',
		'landing.ui.collection.formcollection',
		'landing.ui.panel.fieldspanel',
		'main.core',
		'main.core.events',
		'ui.sidepanel-content',
	],
	'skip_core' => false,
];