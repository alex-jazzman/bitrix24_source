<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-feedback.bundle.css',
	'js' => 'dist/call-feedback.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.lib.logger',
		'main.popup',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.forms',
		'ui.vue',
	],
	'skip_core' => true,
];