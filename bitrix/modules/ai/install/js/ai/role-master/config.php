<?

use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$currentUserId = -1;

if (Loader::includeModule('ai'))
{
	$currentUserId = Bitrix\AI\Facade\User::getCurrentUserId();
}

return [
	'css' => 'dist/role-master.bundle.css',
	'js' => 'dist/role-master.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.alerts',
		'ui.buttons',
		'ui.entity-selector',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.main',
		'ui.layout-form',
		'ui.notification',
		'ui.uploader.core',
		'ui.vue3',
		'ui.vue3.components.hint',
	],
	'skip_core' => false,
	'settings' => [
		'currentUserId' => $currentUserId,
	],
];
