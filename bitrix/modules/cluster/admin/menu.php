<?php
use Bitrix\Main\Localization\Loc;

IncludeModuleLangFile(__FILE__);

/** @global CUser $USER */
global $USER;

if (!$USER->isAdmin())
{
	return false;
}

if (!Bitrix\Main\Loader::includeModule('cluster'))
{
	return false;
}

$connection = \Bitrix\Main\Application::getConnection();

$arMenu = [
	'parent_menu' => 'global_menu_settings',
	'section' => 'cluster',
	'sort' => 1600,
	'text' => Loc::getMessage('CLU_MENU_ITEM'),
	'title' => Loc::getMessage('CLU_MENU_TITLE'),
	'icon' => 'cluster_menu_icon',
	'page_icon' => 'cluster_page_icon',
	'items_id' => 'menu_cluster',
	'items' => [],
];

$cacheType = Bitrix\Main\Config\Option::get('cluster', 'cache_type', 'memcache');

if ($connection->getType() === 'mysql' || $connection->getType() === 'pgsql')
{
	$arMenu['items'][] = [
		'text' => Loc::getMessage('CLU_MENU_SLAVE_ITEM'),
		'url' => 'cluster_slave_list.php?lang=' . LANGUAGE_ID . '&group_id=all',
		'title' => Loc::getMessage('CLU_MENU_SLAVE_ITEM_TITLE'),
	];

	$rsGroups = $connection->query('SELECT ID, NAME from b_cluster_group ORDER BY ID asc');
	while ($arGroup = $rsGroups->fetch())
	{
		$arGroupItems = [];

		if ($connection->getType() === 'mysql')
		{
			$arGroupItems[] = [
				'text' => Loc::getMessage('CLU_MENU_SLAVE_ITEM'),
				'url' => 'cluster_slave_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
				'more_url' => ['cluster_slave_list.php?group_id=' . $arGroup['ID'], 'cluster_slave_edit.php?group_id=' . $arGroup['ID']],
				'title' => Loc::getMessage('CLU_MENU_SLAVE_ITEM_TITLE'),
			];
		}

		if ($cacheType == 'memcache' || $cacheType == 'memcached')
		{
			$arGroupItems[] = [
				'text' => Loc::getMessage('CLU_MENU_MEMCACHE_ITEM'),
				'url' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
				'more_url' => ['cluster_memcache_list.php?group_id=' . $arGroup['ID'], 'cluster_memcache_edit.php?group_id=' . $arGroup['ID']],
				'title' => Loc::getMessage('CLU_MENU_MEMCACHE_ITEM_TITLE'),
				'page_icon' => 'cluster_page_icon',
			];
		}
		else
		{
			$arGroupItems[] = [
				'text' => Loc::getMessage('CLU_MENU_REDIS_ITEM'),
				'url' => 'cluster_redis_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
				'more_url' => ['cluster_redis_list.php?group_id=' . $arGroup['ID'], 'cluster_redis_edit.php?group_id=' . $arGroup['ID']],
				'title' => Loc::getMessage('CLU_MENU_REDIS_ITEM_TITLE'),
				'page_icon' => 'cluster_page_icon',
			];
		}

		$arGroupItems[] = [
			'text' => Loc::getMessage('CLU_MENU_WEBNODE_ITEM'),
			'url' => 'cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
			'more_url' => ['cluster_webnode_list.php?group_id=' . $arGroup['ID'], 'cluster_webnode_edit.php?group_id=' . $arGroup['ID']],
			'title' => Loc::getMessage('CLU_MENU_WEBNODE_ITEM_TITLE'),
			'page_icon' => 'cluster_page_icon',
		];

		$arMenu['items'][] = [
			'text' => $arGroup['NAME'],
			'title' => '',
			'items_id' => 'cluser_group_' . $arGroup['ID'],
			'module_id' => 'cluster',
			'items' => $arGroupItems,
			'page_icon' => 'cluster_page_icon',
		];
	}
}
else
{
	if ($cacheType == 'memcache' || $cacheType == 'memcached')
	{
		$arMenu['items'][] = [
			'text' => Loc::getMessage('CLU_MENU_MEMCACHE_ITEM'),
			'url' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=1',
			'more_url' => ['cluster_memcache_list.php?group_id=1', 'cluster_memcache_edit.php?group_id=1'],
			'title' => Loc::getMessage('CLU_MENU_MEMCACHE_ITEM_TITLE'),
		];
	}
	else
	{
		$arMenu['items'][] = [
			'text' => Loc::getMessage('CLU_MENU_REDIS_ITEM'),
			'url' => 'cluster_redis_list.php?lang=' . LANGUAGE_ID . '&group_id=1',
			'more_url' => ['cluster_redis_list.php?group_id=1', 'cluster_redis_edit.php?group_id=1'],
			'title' => Loc::getMessage('CLU_MENU_REDIS_ITEM_TITLE'),
			'page_icon' => 'cluster_page_icon',
		];
	}

	$arMenu['items'][] = [
		'text' => Loc::getMessage('CLU_MENU_WEBNODE_ITEM'),
		'url' => 'cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=1',
		'more_url' => ['cluster_webnode_list.php?group_id=1', 'cluster_webnode_edit.php?group_id=1'],
		'title' => Loc::getMessage('CLU_MENU_WEBNODE_ITEM_TITLE'),
	];
}

if (CClusterDBNode::GetModulesForSharding())
{
	$arMenu['items'][] = [
		'text' => Loc::getMessage('CLU_MENU_DBNODE_ITEM'),
		'url' => 'cluster_dbnode_list.php?lang=' . LANGUAGE_ID,
		'more_url' => ['cluster_dbnode_list.php', 'cluster_dbnode_edit.php'],
		'title' => Loc::getMessage('CLU_MENU_DBNODE_TITLE'),
	];
}

$arMenu['items'][] = [
	'text' => Loc::getMessage('CLU_MENU_SESSION_ITEM'),
	'url' => 'cluster_session.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_session.php'],
	'title' => Loc::getMessage('CLU_MENU_SESSION_ITEM_TITLE'),
];

$arMenu['items'][] = [
	'text' => Loc::getMessage('CLU_MENU_GROUP_ITEM'),
	'url' => 'cluster_index.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_index.php', 'cluster_group_edit.php'],
	'title' => Loc::getMessage('CLU_MENU_GROUP_ITEM_TITLE'),
];

$arMenu['items'][] = [
	'text' => Loc::getMessage('CLU_MENU_SERVER_ITEM'),
	'url' => 'cluster_server_list.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_server_list.php'],
	'title' => Loc::getMessage('CLU_MENU_SERVER_ITEM_TITLE'),
];

return $arMenu;