<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;

return [
	'css' => 'dist/index.bundle.css',
	'js' => 'dist/index.bundle.js',
	'rel' => [
		'ai.agreement',
		'ai.ajax-error-handler',
		'ai.engine',
		'ai.payload.textpayload',
		'clipboard',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.icon.actions',
		'ui.icon-set.main',
		'ui.notification',
	],
	'skip_core' => false,
	'settings' => [
		'isRestrictedByEula' => Loader::includeModule('ai') && Bitrix\AI\Facade\Bitrix24::isFeatureEnabled('ai_available_by_version') === false,
	]
];