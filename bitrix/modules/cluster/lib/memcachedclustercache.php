<?php

namespace Bitrix\Cluster;

use Bitrix\Main\Loader;

class MemcachedClusterCache extends \Bitrix\Main\Data\CacheEngineMemcached
{
	private bool $bQueue = false;
	private static null|array $servers = null;
	private static array $otherGroups = [];

	public function __construct($options = [])
	{
		$sid = 'bxcluster';
		require_once \Bitrix\Main\Loader::getLocal('modules/cluster/lib/clustercacheconfig.php');

		if (static::$servers === null)
		{
			static::$servers = ClusterCacheConfig::getInstance('memcached')->getConfig(true, self::$otherGroups);
		}

		if (defined('BX_MEMCACHED_CLUSTER'))
		{
			$sid = BX_MEMCACHED_CLUSTER;
		}

		if (!empty(static::$servers))
		{
			parent::__construct([
				'servers' => static::$servers,
				'type' => 'memcached',
				'sid' => $sid
			]);
		}

		if (defined('BX_CLUSTER_GROUP'))
		{
			$this->bQueue = true;
		}
	}

	public function QueueRun($param1, $param2, $param3)
	{
		$this->bQueue = false;
		$this->clean($param1, $param2, $param3);
	}

	public function clean($baseDir, $initDir = false, $filename = false)
	{
		if ($this->isAvailable())
		{
			if ($this->bQueue && Loader::includeModule('cluster'))
			{
				foreach (self::$otherGroups as $group_id => $_)
				{
					\CClusterQueue::Add($group_id, 'MemcachedClusterCache', $baseDir, $initDir, $filename);
				}
			}

			parent::clean($baseDir, $initDir, $filename);
		}
	}
}
