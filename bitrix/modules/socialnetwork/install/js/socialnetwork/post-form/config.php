<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/post-form.bundle.css',
	'js' => 'dist/post-form.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'ui.entity-selector',
		'ui.icon-set.actions',
		'ui.notification',
		'ui.uploader.core',
	],
	'skip_core' => false,
];