<?php
use Bitrix\Main\Loader;

class CPHPCacheMemcacheCluster extends \Bitrix\Main\Data\CacheEngineMemcache
{
	private bool $bQueue = false;
	private static null|array $servers = null;
	private static array $otherGroups = [];

	public function __construct($options = [])
	{
		$sid = 'bxcluster';
		require_once Bitrix\Main\Loader::getLocal('modules/cluster/lib/clustercacheconfig.php');

		if (static::$servers === null)
		{
			static::$servers = Bitrix\Cluster\ClusterCacheConfig::getInstance()->getConfig(true, self::$otherGroups);
		}

		if (defined('BX_MEMCACHE_CLUSTER'))
		{
			$sid = BX_MEMCACHE_CLUSTER;
		}

		if (!empty(static::$servers))
		{
			parent::__construct([
				'servers' => static::$servers,
				'type' => 'memcache',
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
					CClusterQueue::Add($group_id, 'CPHPCacheMemcacheCluster', $baseDir, $initDir, $filename);
				}
			}

			parent::clean($baseDir, $initDir, $filename);
		}
	}
}
