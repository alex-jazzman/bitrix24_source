<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

$presetData = [
	'CRM_PRESET_AVAILABLE' => Loader::includeModule('crm') && CCrmPerms::IsAccessEnabled(),
	'TASKS_PRESET_AVAILABLE' => false,
	'SITES_PRESET_AVAILABLE' => false,
];

if (Loader::includeModule('socialnetwork'))
{
	$arUserActiveFeatures = CSocNetFeatures::GetActiveFeatures(SONET_ENTITY_USER, $GLOBALS['USER']->GetID());
	$arSocNetFeaturesSettings = CSocNetAllowed::GetAllowedFeatures();

	$isFeatureAllowed = (
		array_key_exists('tasks', $arSocNetFeaturesSettings)
		&& array_key_exists('allowed', $arSocNetFeaturesSettings['tasks'])
		&& in_array(SONET_ENTITY_USER, $arSocNetFeaturesSettings['tasks']['allowed'])
		&& is_array($arUserActiveFeatures)
		&& in_array('tasks', $arUserActiveFeatures)
	);
	if ($isFeatureAllowed)
	{
		$presetData['TASKS_PRESET_AVAILABLE'] = true;
	}
}

if (
	Loader::includeModule('bitrix24')
	&& ModuleManager::isModuleInstalled('landing')
	&& (
		in_array(\CBitrix24::getPortalZone(), array('ru', 'kz', 'by', 'uz'))
		|| Bitrix\Bitrix24\Release::isAvailable('landing')
	)
)
{
	$presetData['SITES_PRESET_AVAILABLE'] = true;
}

return [
	'css' => 'dist/menu-preset.bundle.css',
	'js' => 'dist/menu-preset.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3',
	],
	'skip_core' => false,
	'settings' => [
		'presetData' => $presetData
	]
];
