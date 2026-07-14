<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Socialnetwork\ComponentHelper;
use Bitrix\Socialnetwork\Helper\Feature;

if (!\Bitrix\Main\Loader::includeModule('socialnetwork'))
{
	return [];
}

return [
	'js' => '/bitrix/js/socialnetwork/slider/socialnetwork.slider.js',
	'lang_additional' => [
		'SONET_SLIDER_USER_SEF' => ComponentHelper::getUserSEFUrl(),
		'SONET_SLIDER_GROUP_SEF' => ComponentHelper::getWorkgroupSEFUrl(),
		'SONET_SLIDER_SPACES_SEF' => ComponentHelper::getSpacesSEFUrl(),
		'SONET_SLIDER_SITE_TEMPLATE_ID' => SITE_TEMPLATE_ID,
		'SONET_SLIDER_INTRANET_INSTALLED' => (\Bitrix\Main\ModuleManager::isModuleInstalled('intranet') ? 'Y' : 'N'),
	],
	'rel' => [
		'sidepanel',
		'ui.fonts.opensans',
		'im.public'
	],
	'settings' => [
		'isNewProjectsOn' => \Bitrix\Socialnetwork\V2\Feature::isNewProjectsOn(),
		'isOldPortal' => \Bitrix\Socialnetwork\V2\Feature::isOldPortalForNewProject(),
		'isRestricted' => !Feature::isFeatureEnabled(Feature::PROJECTS_GROUPS)
			&& !Feature::canTurnOnTrial(Feature::PROJECTS_GROUPS)
		,
	],
];
