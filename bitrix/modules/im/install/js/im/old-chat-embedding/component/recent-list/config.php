<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/recent-list.bundle.css',
	'js' => 'dist/recent-list.bundle.js',
	'rel' => [
		'im.old-chat-embedding.component.elements',
		'im.old-chat-embedding.const',
		'im.old-chat-embedding.lib.logger',
		'im.old-chat-embedding.lib.menu',
		'im.old-chat-embedding.lib.utils',
		'im.old-chat-embedding.provider.service',
		'im.v2.lib.parser',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'ui.design-tokens',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];