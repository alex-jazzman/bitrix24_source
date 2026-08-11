<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/call-background.bundle.css',
	'js' => 'dist/call-background.bundle.js',
	'rel' => [
		'call.adapter.desktop-api',
		'call.adapter.helpdesk',
		'call.adapter.im-const',
		'call.adapter.logger',
		'call.adapter.notifier',
		'call.adapter.uploader',
		'call.adapter.utils',
		'im.v2.lib.progressbar',
		'main.core',
		'main.core.events',
		'rest.client',
		'ui.buttons',
		'ui.fonts.opensans',
		'ui.info-helper',
		'ui.vue3',
	],
	'skip_core' => false,
];