<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/popup-request-install.bundle.css',
	'js' => 'dist/popup-request-install.bundle.js',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.buttons',
		'ui.system.typography',
	],
	'skip_core' => false,
];
