<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/provider-showcase.bundle.css',
	'js' => 'dist/provider-showcase.bundle.js',
	'rel' => [
		'main.core',
		'ui.buttons',
		'ui.forms',
		'ui.info-helper',
		'ui.mail.sender-editor',
		'ui.sidepanel.layout',
		'ui.sidepanel-content',
	],
	'skip_core' => false,
];