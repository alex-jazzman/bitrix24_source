<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/sending.bundle.js',
	],
	'rel' => [
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.logger',
		'im.v2.lib.rest',
		'im.v2.lib.utils',
		'im.v2.provider.service.message',
		'main.core',
		'main.core.events',
		'ui.page-context',
	],
	'skip_core' => false,
];
