<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'im.old-chat-embedding.const',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];