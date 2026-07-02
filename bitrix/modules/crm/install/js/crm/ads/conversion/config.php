<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.core',
		'seo.ads.login',
		'ui.fonts.opensans',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];