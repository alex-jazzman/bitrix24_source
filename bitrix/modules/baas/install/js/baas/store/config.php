<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Main;
use \Bitrix\Baas;

$settings = [
	'isBitrix24License' => Main\ModuleManager::isModuleInstalled('bitrix24'),
];

if (Main\Loader::includeModule('baas'))
{
	$settings['pull'] = Baas\Integration\Pull\Channel::getSettings();
	Baas\Integration\Pull\Channel::subscribe();

	$settings['isCurrentUserAdmin'] = Baas\Entity\CurrentUser::get()->isAdmin();
	$settings['isBaasActive'] = Baas\Baas::getInstance()->isActive();
	$settings['canBaasOnlyBePurchasedByAdmin'] = Baas\Baas::getInstance()->isSellableToAll() === false;
}

return [
	'css' => 'dist/list.bundle.css',
	'js' => 'dist/list.bundle.js',
	'rel' => [
		'ui.icons.b24',
		'ui.progressbar',
		'main.date',
		'ui.label',
		'ui.info-helper',
		'main.popup',
		'bitrix24.license',
		'ui.notification',
		'ui.buttons',
		'ui.popup-with-header',
		'ui.analytics',
		'main.core',
		'main.core.events',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
	'settings' => $settings
];
