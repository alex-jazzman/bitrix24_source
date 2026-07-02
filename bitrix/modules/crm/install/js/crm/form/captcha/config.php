<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/captcha.bundle.css',
	'js' => 'dist/captcha.bundle.js',
	'rel' => [
		'main.core',
		'ui.notification',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];