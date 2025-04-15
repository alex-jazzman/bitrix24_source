<?php

use Bitrix\Main\Loader;
use Bitrix\Main\Config\Configuration;

class CPHPCacheRedisCluster extends \Bitrix\Main\Data\CacheEngineRedis
{
	private bool $bQueue = false;
	private static null|array $servers = null;
	private static array $otherCroups = [];

	public function __construct()
	{
		$sid = 'bxcluster';
		require_once Bitrix\Main\Loader::getLocal('modules/cluster/lib/clustercacheconfig.php');

		if (static::$servers === null)
		{
			static::$servers = Bitrix\Cluster\ClusterCacheConfig::getInstance('redis')->getConfig(true, static::$otherCroups);
		}

		if (defined('BX_REDIS_CLUSTER'))
		{
			$sid = BX_REDIS_CLUSTER;
		}

		if (!empty(static::$servers))
		{
			parent::__construct([
				'servers' => static::$servers,
				'sid' => $sid
			]);
		}

		if (defined('BX_CLUSTER_GROUP'))
		{
			$this->bQueue = true;
		}
	}

	protected function configure($options = []): array
	{
		$config = parent::configure($options);

		$cacheConfig = Configuration::getValue('cache');

		$config['failover'] = $cacheConfig['failover'] ?? RedisCluster::FAILOVER_NONE;

		return $config;
	}

	public function QueueRun($param1, $param2, $param3): void
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
				foreach (self::$otherCroups as $group_id => $_)
				{
					CClusterQueue::Add($group_id, 'CPHPCacheRedisCluster', $baseDir, $initDir, $filename);
				}
			}

			parent::clean($baseDir, $initDir, $filename);
		}
	}
}
