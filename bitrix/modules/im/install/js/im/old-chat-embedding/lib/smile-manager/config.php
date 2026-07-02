<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$lastUpdate = \CSmile::getLastUpdate()->format(\DateTime::ATOM);

return [
	'css' => 'dist/smile-manager.bundle.css',
	'js' => 'dist/smile-manager.bundle.js',
	'rel' => [
		'im.old-chat-embedding.application.core',
		'im.old-chat-embedding.const',
		'im.old-chat-embedding.lib.local-storage',
		'main.core',
		'rest.client',
		'ui.dexie',
	],
	'skip_core' => false,
	'settings' => [
		'lastUpdate' => $lastUpdate
	]
];