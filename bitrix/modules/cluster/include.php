<?php

IncludeModuleLangFile(__FILE__);
// Never increase caching time here. There were cache clenup problems noticed.
if (!defined('CACHED_b_cluster_dbnode'))
{
	define('CACHED_b_cluster_dbnode', 3600);
}

$dbType = \Bitrix\Main\Application::getConnection()->getType();

CModule::AddAutoloadClasses(
	'cluster', [
		'CClusterGroup' => 'classes/general/group.php',
		'CClusterQueue' => 'classes/general/queue.php',
		'CAllClusterDBNode' => 'classes/general/dbnode.php',
		'CClusterDBNode' => 'classes/' . $dbType . '/dbnode.php',
		'CAllClusterDBNodeCheck' => 'classes/general/dbnode_check.php',
		'CClusterDBNodeCheck' => 'classes/' . $dbType . '/dbnode_check.php',
		'CClusterSlave' => 'classes/' . $dbType . '/slave.php',
		'CClusterMemcache' => 'classes/general/memcache.php',
		'CClusterRedis' => 'classes/general/redis.php',
		'CClusterWebNode' => 'classes/general/webnode.php',
	]
);

if (defined('BX_CLUSTER_GROUP'))
{
	CClusterQueue::Run();
}

class CCluster
{
	public static function checkForServers($toBeAddedCount = 0)
	{
		$countLimit = (int) \Bitrix\Main\Config\Option::get('main', '~PARAM_MAX_SERVERS', 0);
		if ($countLimit > 0)
		{
			return (self::getServersCount() + $toBeAddedCount) <= $countLimit;
		}
		else
		{
			return true;
		}
	}

	public static function getServersCount()
	{
		static $cache = null;
		if ($cache === null)
		{
			$hosts = [];
			foreach (self::getServerList() as $server)
			{
				if ($server['DEDICATED'] == 'Y')
				{
					$hosts[] = $server['HOST'];
				}
			}
			$cache = count(array_unique($hosts));
		}
		return $cache;
	}

	public static function getServerList()
	{
		$cacheType = COption::GetOptionString('cluster', 'cache_type', 'memcache');
		if ($cacheType == 'memcache')
		{
			$cacheServers = CClusterMemcache::getServerList();
		}
		else
		{
			$cacheServers = CClusterRedis::getServerList();
		}
		$servers = array_merge(
			CClusterDBNode::getServerList()
			,$cacheServers
			,CClusterWebNode::getServerList()
		);
		if (empty($servers))
		{
			$servers[] = [
				'ID' => 0,
				'HOST' => '',
				'DEDICATED' => 'Y',
				'EDIT_URL' => '',
			];
		}
		return $servers;
	}
}
