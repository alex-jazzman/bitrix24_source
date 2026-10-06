<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/base.bundle.css',
	'js' => 'dist/base.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.a11y',
		'landing.utils',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];