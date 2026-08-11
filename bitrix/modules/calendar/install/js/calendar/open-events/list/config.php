<?php

use Bitrix\Calendar\Event\Service\OpenEventPullService;
use Bitrix\Calendar\Util;
use Bitrix\Main\Engine\CurrentUser;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!\Bitrix\Main\Loader::includeModule('calendar'))
{
	return [];
}

$currentUserId = (int)CurrentUser::get()->getId();
$openEventSection = \CCalendarSect::GetList([
	'arSelect' => ['ID', 'NAME', 'CAL_TYPE', 'OWNER_ID', 'COLOR'],
	'arFilter' => [
		'CAL_TYPE' => \Bitrix\Calendar\Core\Event\Tools\Dictionary::CALENDAR_TYPE['open_event'],
	],
	'limit' => 1,
	'checkPermissions' => false,
	'getPermissions' => false,
])[0] ?? null;

return [
	'css' => 'dist/list.bundle.css',
	'js' => 'dist/list.bundle.js',
	'rel' => [
		'calendar.open-events.filter',
		'im.public.iframe',
		'im.v2.const',
		'main.core',
		'main.core.events',
		'main.date',
		'main.loader',
		'main.polyfill.intersectionobserver',
		'main.popup',
		'ui.buttons',
		'ui.cnt',
		'ui.entity-selector',
		'ui.icon-set.actions',
		'ui.icon-set.main',
		'ui.switcher',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'settings' => [
		'currentUserId' => $currentUserId,
		'currentUserTimeOffset' => Util::getTimezoneOffsetUTC(\CCalendar::GetUserTimezoneName($currentUserId)),
		'openEventSection' => $openEventSection,
		'pullEventUserFieldsKey' => OpenEventPullService::EVENT_USER_FIELDS_KEY,
	],
	'skip_core' => false,
];
