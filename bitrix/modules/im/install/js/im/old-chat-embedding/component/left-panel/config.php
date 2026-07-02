<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'dist/left-panel.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'im.old-chat-embedding.component.recent-list',
		'im.old-chat-embedding.component.search',
		'im.old-chat-embedding.const',
		'main.core.events',
	],
	'skip_core' => true,
];