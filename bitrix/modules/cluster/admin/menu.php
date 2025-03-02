<?php
IncludeModuleLangFile(__FILE__);
/** @global CUser $USER */
global $USER;
/** @global CMain $APPLICATION */
global $DB;

if (!$USER->isAdmin())
{
	return false;
}

if (!CModule::IncludeModule('cluster'))
{
	return false;
}

$arMenu = [
	'parent_menu' => 'global_menu_settings',
	'section' => 'cluster',
	'sort' => 1600,
	'text' => GetMessage('CLU_MENU_ITEM'),
	'title' => GetMessage('CLU_MENU_TITLE'),
	'icon' => 'cluster_menu_icon',
	'page_icon' => 'cluster_page_icon',
	'items_id' => 'menu_cluster',
	'items' => [],
];

$cacheType = COption::GetOptionString('cluster', 'cache_type', 'memcache');

if ($DB->type == 'MYSQL')
{
	$arMenu['items'][] = [
		'text' => GetMessage('CLU_MENU_SLAVE_ITEM'),
		'url' => 'cluster_slave_list.php?lang=' . LANGUAGE_ID . '&group_id=all',
		'title' => GetMessage('CLU_MENU_SLAVE_ITEM_TITLE'),
	];

	$rsGroups = $DB->Query('SELECT ID, NAME from b_cluster_group ORDER BY ID asc');
	while ($arGroup = $rsGroups->GetNext())
	{
		$arGroupItems = [];
		$arGroupItems[] = [
			'text' => GetMessage('CLU_MENU_SLAVE_ITEM'),
			'url' => 'cluster_slave_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
			'more_url' => ['cluster_slave_list.php?group_id=' . $arGroup['ID'], 'cluster_slave_edit.php?group_id=' . $arGroup['ID']],
			'title' => GetMessage('CLU_MENU_SLAVE_ITEM_TITLE'),

		];

		if ($cacheType == 'memcache')
		{
			$arGroupItems[] = [
				'text' => GetMessage('CLU_MENU_MEMCACHE_ITEM'),
				'url' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
				'more_url' => ['cluster_memcache_list.php?group_id=' . $arGroup['ID'], 'cluster_memcache_edit.php?group_id=' . $arGroup['ID']],
				'title' => GetMessage('CLU_MENU_MEMCACHE_ITEM_TITLE'),
				'page_icon' => 'cluster_page_icon',
			];
		}
		else
		{
			$arGroupItems[] = [
				'text' => GetMessage('CLU_MENU_REDIS_ITEM'),
				'url' => 'cluster_redis_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
				'more_url' => ['cluster_redis_list.php?group_id=' . $arGroup['ID'], 'cluster_redis_edit.php?group_id=' . $arGroup['ID']],
				'title' => GetMessage('CLU_MENU_REDIS_ITEM_TITLE'),
				'page_icon' => 'cluster_page_icon',
			];
		}

		$arGroupItems[] = [
			'text' => GetMessage('CLU_MENU_WEBNODE_ITEM'),
			'url' => 'cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $arGroup['ID'],
			'more_url' => ['cluster_webnode_list.php?group_id=' . $arGroup['ID'], 'cluster_webnode_edit.php?group_id=' . $arGroup['ID']],
			'title' => GetMessage('CLU_MENU_WEBNODE_ITEM_TITLE'),
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
	if ($cacheType == 'memcache')
	{
		$arMenu['items'][] = [
			'text' => GetMessage('CLU_MENU_MEMCACHE_ITEM'),
			'url' => 'cluster_memcache_list.php?lang=' . LANGUAGE_ID . '&group_id=1',
			'more_url' => ['cluster_memcache_list.php?group_id=1', 'cluster_memcache_edit.php?group_id=1'],
			'title' => GetMessage('CLU_MENU_MEMCACHE_ITEM_TITLE'),
		];
	}
	else
	{
		$arGroupItems[] = [
			'text' => GetMessage('CLU_MENU_REDIS_ITEM'),
			'url' => 'cluster_redis_list.php?lang=' . LANGUAGE_ID . '&group_id=1',
			'more_url' => ['cluster_redis_list.php?group_id=1', 'cluster_redis_edit.php?group_id=1'],
			'title' => GetMessage('CLU_MENU_REDIS_ITEM_TITLE'),
			'page_icon' => 'cluster_page_icon',
		];
	}

	$arMenu['items'][] = [
		'text' => GetMessage('CLU_MENU_WEBNODE_ITEM'),
		'url' => 'cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=1',
		'more_url' => ['cluster_webnode_list.php?group_id=1', 'cluster_webnode_edit.php?group_id=1'],
		'title' => GetMessage('CLU_MENU_WEBNODE_ITEM_TITLE'),
	];
}

$arMenu['items'][] = [
	'text' => GetMessage('CLU_MENU_DBNODE_ITEM'),
	'url' => 'cluster_dbnode_list.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_dbnode_list.php', 'cluster_dbnode_edit.php'],
	'title' => GetMessage('CLU_MENU_DBNODE_TITLE'),
];

$arMenu['items'][] = [
	'text' => GetMessage('CLU_MENU_SESSION_ITEM'),
	'url' => 'cluster_session.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_session.php'],
	'title' => GetMessage('CLU_MENU_SESSION_ITEM_TITLE'),
];

$arMenu['items'][] = [
	'text' => GetMessage('CLU_MENU_GROUP_ITEM'),
	'url' => 'cluster_index.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_index.php', 'cluster_group_edit.php'],
	'title' => GetMessage('CLU_MENU_GROUP_ITEM_TITLE'),
];

$arMenu['items'][] = [
	'text' => GetMessage('CLU_MENU_SERVER_ITEM'),
	'url' => 'cluster_server_list.php?lang=' . LANGUAGE_ID,
	'more_url' => ['cluster_server_list.php'],
	'title' => GetMessage('CLU_MENU_SERVER_ITEM_TITLE'),
];

return $arMenu;
