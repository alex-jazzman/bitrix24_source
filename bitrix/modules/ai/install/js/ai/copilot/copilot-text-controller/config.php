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
		'ai.ajax-error-handler',
		'ai.engine',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.feedback.form',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.notification',
	],
	'skip_core' => false,
	'settings' => [
		'settingsPageLink' => $isCP ? \Bitrix\Intranet\PortalSettings::getInstance()->getSettingsUrl() . '?page=ai' : '/settings/configs/?page=ai',
	]
];
