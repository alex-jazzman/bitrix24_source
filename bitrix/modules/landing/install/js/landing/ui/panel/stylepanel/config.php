<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/stylepanel.bundle.css',
	'js' => 'dist/stylepanel.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.pageobject',
		'landing.ui.panel.content',
		'main.core',
		'main.loader',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];