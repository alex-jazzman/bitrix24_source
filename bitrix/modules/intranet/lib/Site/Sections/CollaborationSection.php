<?php

namespace Bitrix\Intranet\Site\Sections;

use Bitrix\Intranet\Settings\Tools\TeamWork;
use Bitrix\Intranet\Settings\Tools\ToolsManager;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Data\Cache;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

class CollaborationSection
{
	private static ?array $allowedFeatures = null;
	private static ?TeamWork $teamWorkTools = null;
	private const CACHE_TTL = 604800;
	private const CACHE_PATH = '/bx/intranet/sections/collaboration/';

	public static function getMenuData(): array
	{
		$result = [];
		$items = static::getItems();
		foreach ($items as $item)
		{
			$menuData = $item['menuData'] ?? [];
			$result[] = [
				$item['title'] ?? '',
				$item['url'] ?? '',
				$item['extraUrls'] ?? [],
				$menuData,
				'',
			];
		}

		return $result;
	}

	public static function getItems(): array
	{
		$items = static::getItemsInternal();

		$items = array_filter($items, static function ($item) {
			return $item['available'] ?? false;
		});

		$counters = \CUserCounter::GetValues(CurrentUser::get()->getId());
		foreach ($items as &$item)
		{
			if (isset($item['menuData']['counter_id']))
			{
				$item['menuData']['counter_num'] = $counters[$item['menuData']['counter_id']] ?? 0;
			}
		}

		return $items;
	}

	private static function getItemsInternal(): array
	{
		$userId = (int)CurrentUser::get()->getId();
		$cache = Cache::createInstance();
		$cacheId = md5($userId . LANGUAGE_ID . SITE_ID);
		$cachePath = static::CACHE_PATH . '/' . substr(md5($userId), 0, 2) . '/' . $userId . '/';

		if ($cache->initCache(static::CACHE_TTL, $cacheId, $cachePath))
		{
			$vars = $cache->getVars();
			if (is_array($vars['items']))
			{
				return $vars['items'];
			}
		}

		$items = [
			static::getFeed(),
			static::getMessenger(),
			static::getCalendar(true),
			static::getOnlineDocs(),
			static::getBoards(),
			static::getDisk(),
			static::getMail(),
			static::getWorkGroups(),
		];

		$cache->startDataCache();

		$taggedCache = \Bitrix\Main\Application::getInstance()->getTaggedCache();
		$taggedCache->startTagCache($cachePath);
		$taggedCache->registerTag('bitrix24_left_menu');
		$taggedCache->endTagCache();

		$cache->endDataCache(['items' => $items]);

		return $items;
	}

	public static function isFeatureEnabled(string $feature): bool
	{
		if (static::$allowedFeatures === null)
		{
			static::$allowedFeatures = [];
			if ($GLOBALS['USER']->isAuthorized() && Loader::includeModule('socialnetwork'))
			{
				$arUserActiveFeatures = \CSocNetFeatures::getActiveFeatures(SONET_ENTITY_USER, $GLOBALS["USER"]->GetID());
				$arSocNetFeaturesSettings = \CSocNetAllowed::getAllowedFeatures();
				foreach (['tasks', 'files', 'photo', 'blog', 'calendar'] as $feature)
				{
					static::$allowedFeatures[$feature] = (
						array_key_exists($feature, $arSocNetFeaturesSettings)
						&& array_key_exists('allowed', $arSocNetFeaturesSettings[$feature])
						&& in_array(SONET_ENTITY_USER, $arSocNetFeaturesSettings[$feature]['allowed'])
						&& is_array($arUserActiveFeatures)
						&& in_array($feature, $arUserActiveFeatures)
					);
				}
			}
		}

		return static::$allowedFeatures[$feature] ?? false;
	}

	public static function isToolAvailable(string $toolId): bool
	{
		return ToolsManager::getInstance()->checkAvailabilityByToolId($toolId);
	}

	public static function isBitrix24Cloud(): bool
	{
		return ModuleManager::isModuleInstalled('bitrix24');
	}

	public static function isDiskEnabled(): bool
	{
		return (
			ModuleManager::isModuleInstalled('disk')
			&& Option::get('disk', 'successfully_converted', false)
		);
	}

	private static function getTitle(string $id): string
	{
		if (static::$teamWorkTools === null)
		{
			static::$teamWorkTools = new TeamWork();
		}

		return static::$teamWorkTools->getSubgroupNameById($id);
	}

	public static function getFeed(): array
	{
		return [
			'id' => 'news',
			'title' => static::getTitle('news'),
			'available' => static::isToolAvailable('news'),
			'url' => '/stream/',
			'menuData' => [
				'menu_item_id' => 'menu_live_feed',
				'counter_id' => '**',
			],
			'extraUrls' => [
				SITE_DIR . 'company/personal/user/' . CurrentUser::get()->getId() . '/blog/',
			],
		];
	}

	public static function getMessenger(): array
	{
		$available = (
			static::isToolAvailable('instant_messenger')
			&& ModuleManager::isModuleInstalled('im')
			&& \CBXFeatures::isFeatureEnabled('WebMessenger')
		);

		return [
			'id' => 'instant_messenger',
			'title' => static::getTitle('instant_messenger'),
			'available' => $available,
			'url' => SITE_DIR . 'online/',
			'menuData' => [
				'menu_item_id' => 'menu_im_messenger',
				'counter_id' => 'im-message',
				'my_tools_section' => true,
				'can_be_first_item' => defined('AIR_SITE_TEMPLATE'),
			],
		];
	}

	public static function getCalendar(bool $includeSubMenu = false): array
	{
		$available = static::isToolAvailable('calendar') && ModuleManager::isModuleInstalled('calendar');
		if (!static::isBitrix24Cloud())
		{
			$available = (
				$available
				&& static::isFeatureEnabled('calendar')
				&& (\CBXFeatures::isFeatureEnabled('Calendar') || \CBXFeatures::isFeatureEnabled('CompanyCalendar'))
			);
		}

		$subMenu = [];
		if ($includeSubMenu)
		{
			foreach (CalendarSection::getItems() as $item)
			{
				if ($item['available'])
				{
					$menuData = $item['menuData'] ?? [];
					$subMenu[] = [
						'ID' => $menuData['menu_item_id'] ?? $item['id'],
						'TEXT' => $item['title'],
						'URL' => $item['url'],
						'COUNTER' => $menuData['counter_num'] ?? '',
						'COUNTER_ID' => $menuData['counter_id'] ?? '',
					];
				}
			}
		}

		$url = SITE_DIR . 'company/personal/user/' . CurrentUser::get()->getId() . '/calendar/';

		return [
			'id' => 'calendar',
			'title' => static::getTitle('calendar'),
			'available' => $available,
			'url' => $url,
			'menuData' => [
				'menu_item_id' => 'menu_calendar',
				// 'counter_id' => 'calendar',
				'sub_link' => $url . '?EVENT_ID=NEW',
				'sub_menu' => $subMenu,
			],
		];
	}

	public static function getOnlineDocs(): array
	{
		$available = (
			static::isToolAvailable('docs')
			&& static::isDiskEnabled()
			&& Option::get('disk', 'documents_enabled', 'N') === 'Y'
		);

		return [
			'id' => 'docs',
			'title' => static::getTitle('docs'),
			'available' => $available,
			'url' => SITE_DIR . 'company/personal/user/' . CurrentUser::get()->getId() . '/disk/documents/',
			'menuData' => [
				'menu_item_id' => 'menu_documents',
			],
		];
	}

	public static function getBoards(): array
	{
		$available = (
			static::isToolAvailable('boards')
			&& static::isDiskEnabled()
			&& Option::get('disk', 'boards_enabled', 'N') === 'Y'
		);

		return [
			'id' => 'boards',
			'title' => static::getTitle('boards'),
			'available' => $available,
			'url' => SITE_DIR . 'company/personal/user/' . CurrentUser::get()->getId() . '/disk/boards/',
			'menuData' => [
				'menu_item_id' => 'menu_boards',
			],
		];
	}

	public static function getDisk(): array
	{
		$available = static::isToolAvailable('disk');
		if (!static::isBitrix24Cloud())
		{
			$available = (
				ModuleManager::isModuleInstalled('disk')
				&& static::isFeatureEnabled('files')
				&& (\CBXFeatures::IsFeatureEnabled('PersonalFiles') || \CBXFeatures::IsFeatureEnabled('CommonDocuments'))
			);
		}

		$url = (
			static::isDiskEnabled()
				? SITE_DIR . 'company/personal/user/' . CurrentUser::get()->getId() . '/disk/path/'
				: SITE_DIR . 'company/personal/user/' . CurrentUser::get()->getId() . '/files/lib/'
		);

		return [
			'id' => 'disk',
			'title' => static::getTitle('disk'),
			'available' => $available,
			'url' => '/docs/',
			'menuData' => [
				'real_link' => $url,
				'menu_item_id' => 'menu_files',
			],
		];
	}

	public static function getMail(): array
	{
		$available = (
			static::isToolAvailable('mail')
			&& Loader::includeModule('intranet')
			&& \CIntranetUtils::isExternalMailAvailable()
		);

		return [
			'id' => 'mail',
			'title' => static::getTitle('mail'),
			'available' => $available,
			'url' => Option::get('intranet', 'path_mail_client', SITE_DIR . 'mail/'),
			'menuData' => [
				'counter_id' => 'mail_unseen',
				'menu_item_id' => 'menu_external_mail',
			],
		];
	}

	public static function getWorkGroups(): array
	{
		$available = (
			static::isToolAvailable('workgroups')
			&& ModuleManager::isModuleInstalled('socialnetwork')
			&& \CBXFeatures::IsFeatureEnabled('Workgroups')
		);

		return [
			'id' => 'workgroups',
			'title' => static::getTitle('workgroups'),
			'available' => $available,
			'url' => SITE_DIR . 'workgroups/',
			'menuData' => [
				'menu_item_id' => 'menu_all_groups',
			],
		];
	}
}
