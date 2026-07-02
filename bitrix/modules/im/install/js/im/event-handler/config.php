<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/event-handler.bundle.css',
	'js' => 'dist/event-handler.bundle.js',
	'rel' => [
		'im.const',
		'im.lib.clipboard',
		'im.lib.logger',
		'im.lib.timer',
		'im.lib.uploader',
		'im.lib.utils',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];