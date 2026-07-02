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
		'im.v2.application.core',
		'im.v2.const',
		'im.v2.lib.local-storage',
		'main.core',
		'ui.dexie',
	],
	'skip_core' => false,
	'settings' => [
		'lastUpdate' => $lastUpdate
	]
];