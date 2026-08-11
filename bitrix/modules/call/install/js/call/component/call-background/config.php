<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-background.bundle.css',
	'js' => 'dist/call-background.bundle.js',
	'rel' => [
		'im.const',
		'im.lib.uploader',
		'im.lib.utils',
		'main.core',
		'rest.client',
		'ui.fonts.opensans',
		'ui.info-helper',
		'ui.notification',
		'ui.progressbarjs.uploader',
		'ui.vue',
	],
	'skip_core' => false,
];