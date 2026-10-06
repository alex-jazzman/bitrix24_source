<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/img.bundle.css',
	'js' => 'dist/img.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'landing.env',
		'landing.node.base',
		'landing.ui.field.image',
		'landing.utils',
		'ui.icon-set.outline',
	],
	'skip_core' => true,
];