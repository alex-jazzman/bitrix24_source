<?php

use Bitrix\IntranetMobile\Provider\UserProvider;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Event;
use Bitrix\Main\EventManager;
use Bitrix\Main\EventResult;
use Bitrix\Main\IO\File;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UserTable;
use Bitrix\Mobile\Context;
use Bitrix\Mobile\Tourist;
use Bitrix\Intranet\Invitation;
use Bitrix\Crm\Terminal\AvailabilityManager;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $USER, $CACHE_MANAGER;

CModule::IncludeModule("mobile");
CModule::IncludeModule("mobileapp");

Loc::loadMessages(__DIR__ . '/.mobile_menu.php');

function sortMenu($item, $anotherItem)
{
	$itemSort = (array_key_exists("sort", $item) ? $item["sort"] : 100);
	$anotherSort = (array_key_exists("sort", $anotherItem) ? $anotherItem["sort"] : 100);
	if ($itemSort > $anotherSort)
	{
		return 1;
	}

	if ($itemSort == $anotherSort)
	{
		return 0;
	}

	return -1;
}

$isExtranetUser = (CModule::includeModule("extranet") && !CExtranet::isIntranetUser());
$isCollaber = (new Context())->isCollaber;
$apiVersion = Bitrix\MobileApp\Mobile::getApiVersion();
$canInviteUsers = (
	Loader::includeModule('intranet')
	&& Invitation::canCurrentUserInvite()
);

$registerUrl = $canInviteUsers ? Invitation::getRegisterUrl() : '';
$registerAdminConfirm = $canInviteUsers ? Invitation::getRegisterAdminConfirm() : false;
$disableRegisterAdminConfirm = !Invitation::canListDelete();
$registerSharingMessage = $canInviteUsers ? Invitation::getRegisterSharingMessage() : '';

$rootStructureSectionId = Invitation::getRootStructureSectionId();
$userId = $USER->getId();
$arResult = [];
$ttl = (defined("BX_COMP_MANAGED_CACHE") ? 2592000 : 600);
$extEnabled = IsModuleInstalled('extranet');
$menuSavedModificationTime = Option::get("mobile", "jscomponent.menu.date.modified.user_" . $userId, 0);
$menuFile = new File($this->path . ".mobile_menu.php");
$version = $this->getVersion();
$menuModificationTime = $menuFile->getModificationTime();
$cacheIsActual = ($menuModificationTime == $menuSavedModificationTime);
$clearOptionName = "clear_more_$userId";
$force = Option::get("mobile", $clearOptionName, false);

if (!$cacheIsActual || $force)
{
	$CACHE_MANAGER->ClearByTag('mobile_custom_menu' . $userId);
	$CACHE_MANAGER->ClearByTag('mobile_custom_menu');
	Option::set("mobile", "jscomponent.menu.date.modified.user_" . $userId, $menuModificationTime);
	Option::set("mobile", $clearOptionName, false);
}
$cache_id = 'more_menu_'
	. implode(
		'_',
		[
			$userId,
			$extEnabled,
			LANGUAGE_ID,
			CSite::GetNameFormat(false) . 'ver' . $version,
			$apiVersion,
			/**
			 * Should be removed after the release option release-spring-2023 is set to true!
			 */
			md5(
				serialize([
					'isTerminalAvailable' => (int)(
						Loader::includeModule('crm')
						&& AvailabilityManager::getInstance()->isAvailable()
					),
				])
			),
		]
	);
$cache_dir = '/bx/mobile_component/more/user_' . $userId;
$obCache = new CPHPCache;

if ($obCache->InitCache($ttl, $cache_id, $cache_dir))
{
	$arResult = $obCache->GetVars();
}
else
{
	$CACHE_MANAGER->StartTagCache($cache_dir);
	$arResult = include(".mobile_menu.php");
	$host = Bitrix\Main\Context::getCurrent()->getServer()->getHttpHost();
	$host = preg_replace("/:(80|443)$/", "", $host);
	$arResult["host"] = htmlspecialcharsbx($host);
	$user = $USER->GetByID($userId)->Fetch();
	$arResult["user"]["fullName"] = CUser::FormatName(CSite::GetNameFormat(false), $user);
	$arResult["user"]["avatar"] = "";

	if ($user["PERSONAL_PHOTO"])
	{
		$imageFile = CFile::GetFileArray($user["PERSONAL_PHOTO"]);
		if ($imageFile !== false)
		{
			$avatar = CFile::ResizeImageGet($imageFile, [
				"width" => 150,
				"height" => 150,
			], BX_RESIZE_IMAGE_EXACT, false, false, false, 50);
			$arResult["user"]["avatar"] = $avatar["src"];
		}
	}

	$CACHE_MANAGER->RegisterTag('sonet_group');
	$CACHE_MANAGER->RegisterTag('crm_initiated');
	$CACHE_MANAGER->RegisterTag('USER_CARD_' . intval($userId / TAGGED_user_card_size));
	$CACHE_MANAGER->RegisterTag('sonet_user2group_U' . $userId);
	$CACHE_MANAGER->RegisterTag('mobile_custom_menu' . $userId);
	$CACHE_MANAGER->RegisterTag('mobile_custom_menu');
	$CACHE_MANAGER->RegisterTag('crm_change_role');
	$CACHE_MANAGER->RegisterTag('bitrix24_left_menu');
	$CACHE_MANAGER->EndTagCache();

	if ($obCache->StartDataCache())
	{
		$obCache->EndDataCache($arResult);
	}
}
$events = EventManager::getInstance()->findEventHandlers("mobile", "onMobileMenuStructureBuilt");
if (count($events) > 0)
{
	$menu = $arResult["menu"];
	foreach ($events as $event)
	{
		$modifiedMenu = ExecuteModuleEventEx($event, [$menu, $this]);
		if ($modifiedMenu != null)
		{
			$menu = $modifiedMenu;
		}

	}

	$arResult["menu"] = $menu;
}

$arResult['spotlights'] = [];

$event = new Event('mobile', 'onMobileMenuSpotlightBuildList', []);
$event->send();
foreach ($event->getResults() as $eventResult)
{
	/** @var EventResult $eventResult */
	$spotlight = $eventResult->getParameters();
	if (is_array($spotlight))
	{
		$arResult['spotlights'][] = $spotlight;
	}
}

$arResult["menu"][] = [
	"title" => "",
	"sort" => 0,
	"items" => [],
];

$counterList = [];

usort($arResult["menu"], 'sortMenu');

usort($arResult['spotlights'], function ($item1, $item2) {
	$delayCount1 = (int)($item1['delayCount'] ?? 0);
	$delayCount2 = (int)($item2['delayCount'] ?? 0);

	if ($delayCount1 !== $delayCount2)
	{
		return $delayCount1 - $delayCount2;
	}

	$sort1 = (int)($item1['sort'] ?? 100);
	$sort2 = (int)($item2['sort'] ?? 100);

	return $sort1 - $sort2;
});

array_walk($arResult["menu"], function (&$section) use (&$counterList) {
	if (isset($section["items"]) && is_array($section["items"]))
	{
		array_walk($section["items"], function (&$item) use (&$counterList, $section) {
			if (isset($item["hidden"]) && $item["hidden"] == true)
			{
				return;
			}

			$item["sectionCode"] = "section_" . $section["sort"];
			if (!empty($item["attrs"]))
			{
				$item["params"] = $item["attrs"];
				unset($item["attrs"]);
			}
			else
			{
				if (!$item["params"])
				{
					$item["params"] = [];
				}
			}

			unset($item["attrs"]);

			if (!empty($item["params"]["counter"]) && !in_array($item["params"]["counter"], $counterList))
			{
				$counterList[] = $item["params"]["counter"];
			}

			$type = $item["type"] ?? "";
			if ($type != "destruct" && $type != "button")
			{
				if (empty($item["styles"]))
				{
					$item["styles"] = [];
				}

				if (empty($item["styles"]["title"]["font"]))
				{
					$item["styles"]["title"] = [
						"font" => [
							"fontStyle" => "medium",
							"size" => 16,
							"color" => "#333333",
						],
					];
				}

				if ($type != "userinfo")
				{
					$item["height"] = 60;
				}
			}

		});
	}
});

$events = Tourist::getEvents();
$winter2024RuReleaseTime = 1732579200; // 26.11.2024
$winter2024WorldReleaseTime = 1733875200; // 11.12.2024

$isCloud = Loader::includeModule('bitrix24');
$isRussianRegion = false;
if ($isCloud)
{
	$isRussianRegion = CBitrix24::getPortalZone() === 'ru';
}
$thresholdTime = $isRussianRegion ? $winter2024RuReleaseTime : $winter2024WorldReleaseTime;

$showPresetsCounter = false;
if (!isset($events['visited_tab_presets']))
{
	$user = UserTable::getById($USER->GetID())->fetchObject();
	if ($user && $user->getDateRegister())
	{
		$showPresetsCounter = $user->getDateRegister()->getTimestamp() > $thresholdTime;
	}
}

$hasMoreThanOneUser = false;
$isUserFirstTimeInInvitations = !isset($events['visit_invitations']);
$isUserAdmin = (($isCloud ? CBitrix24::isPortalAdmin($USER->GetID()) : $USER->isAdmin()));

if (
	$isUserFirstTimeInInvitations
	&& $isUserAdmin
	&& Loader::includeModule('intranet')
	&& Loader::includeModule('intranetmobile')
)
{
	$hasMoreThanOneUser = (new UserProvider())->hasMoreThanOneUser();
}

$showDiskCounter = !isset($events['visited_disk_tabs']);
if ($showDiskCounter)
{
	$portalCreatedTime = null;
	if ($isCloud)
	{
		$portalCreatedTime = (int)CBitrix24::getCreateTime();
	}
	else
	{
		$userQueryResult = UserTable::query()
			->setSelect(['ID', 'DATE_REGISTER'])
			->where('ID', 1)
			->setLimit(1)
			->fetchObject();

		$portalCreatedTime = $userQueryResult?->getDateRegister()->getTimestamp();
	}

	if ($portalCreatedTime !== null)
	{
		$showDiskCounter = $portalCreatedTime < $thresholdTime;
	}
}

$arResult = array_merge($arResult, [
	"counterList" => $counterList,
	"invite" => [
		"canInviteUsers" => $canInviteUsers,
		"registerUrl" => $registerUrl,
		"registerAdminConfirm" => $registerAdminConfirm,
		"disableRegisterAdminConfirm" => $disableRegisterAdminConfirm,
		"registerSharingMessage" => $registerSharingMessage,
		"rootStructureSectionId" => $rootStructureSectionId,
	],
	'customCounters' => [
		'menu_invite' => ($isUserAdmin && $hasMoreThanOneUser && $isUserFirstTimeInInvitations) ? 1 : 0,
		'menu_tab_presets' => $showPresetsCounter ? 1 : 0,
		'menu_disk_tabs' => $showDiskCounter ? 1 : 0,
	],
]);

unset($obCache);

return $arResult;
