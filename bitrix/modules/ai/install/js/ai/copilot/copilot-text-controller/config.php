<?

use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isCP = Loader::includeModule('intranet');

return [
	'css' => 'dist/copilot-text-controller.bundle.css',
	'js' => 'dist/copilot-text-controller.bundle.js',
	'rel' => [
		'main.popup',
		'ai.engine',
		'ui.feedback.form',
		'ui.notification',
		'ai.ajax-error-handler',
		'main.core.events',
		'ui.icon-set.main',
		'main.core',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
	'settings' => [
		'hasRoleSelect' => Option::get('ai', 'ai_copilot_roles_enable', 'Y') === 'Y',
		'settingsPageLink' => $isCP ? \Bitrix\Intranet\PortalSettings::getInstance()->getSettingsUrl() . '?page=ai' : '/settings/configs/?page=ai',
	]
];
