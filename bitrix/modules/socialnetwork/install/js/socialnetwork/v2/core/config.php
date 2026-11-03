<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Application;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Socialnetwork\Collab\Requirement;
use Bitrix\Socialnetwork\Helper\Feature as TariffFeature;
use Bitrix\Socialnetwork\V2\Feature;
use Bitrix\Socialnetwork\V2\Internal\Integration\HumanResources\Structure;
use Bitrix\Socialnetwork\V2\Public\Provider\ProjectProvider;

if (!\Bitrix\Main\Loader::includeModule('socialnetwork'))
{
	return [];
}

$userId = (int)CurrentUser::get()->getId();

$projectProvider = null;
$notificationDefaults = null;
try
{
	$projectProvider = new ProjectProvider();
	$notificationDefaults = $projectProvider->getNotificationCatalogDefaults()->toArray();
}
catch (\Throwable $e)
{
	$notificationDefaults = null;
}

// The create form has no project to be asked about its switchable tools, so the portal answers for it here.
// The list is the server policy itself: the client must not keep a copy of it that can go stale.
$toggleableFeaturesOnCreate = [];
try
{
	$toggleableFeaturesOnCreate = $projectProvider?->getToggleableFeatureIdsForCreate() ?? [];
}
catch (\Throwable $e)
{
	// The form keeps working without the switch, but the failure has to stay apart from an honest "no such tool".
	Application::getInstance()->getExceptionHandler()->writeToLog($e);

	$toggleableFeaturesOnCreate = [];
}

return [
	'css' => 'dist/core.bundle.css',
	'js' => 'dist/core.bundle.js',
	'rel' => [
		'main.core',
		'socialnetwork.v2.model.interface',
		'socialnetwork.v2.model.project',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
	'settings' => [
		'currentUserId' => $userId,
		'isOldPortal' => Feature::isOldPortalForNewProject(),
		'isAccessRestricted' => !TariffFeature::isFeatureEnabled(TariffFeature::PROJECTS_ACCESS_PERMISSIONS),
		'canProposeProjectsTrial' => TariffFeature::canTurnOnTrial(TariffFeature::PROJECTS_GROUPS),
		'isTeamsAvailable' => Structure::isTeamsAvailable(),
		'isExtranetConfigured' => Requirement::checkExtranetConfigured()->isSuccess(),
		'toggleableFeaturesOnCreate' => $toggleableFeaturesOnCreate,
		'notificationDefaults' => $notificationDefaults,
	],
];
