<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'style.css',
	'js' => 'dist/users.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.design-tokens',
	],
	'skip_core' => false,
];
