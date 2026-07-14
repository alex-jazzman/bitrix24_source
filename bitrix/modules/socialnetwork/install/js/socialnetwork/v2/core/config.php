<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Socialnetwork\Helper\Feature as TariffFeature;
use Bitrix\Socialnetwork\V2\Feature;

$userId = (int)CurrentUser::get()->getId();

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
	]
];
