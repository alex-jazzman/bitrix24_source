<?php

use Bitrix\Main\Config\Option;
use Bitrix\Cluster\ClusterCacheConfig;
use Bitrix\Main\Localization\Loc;

IncludeModuleLangFile(__FILE__);

class CClusterRedis extends \Bitrix\Cluster\ClusterCache
{
	public static null|bool $systemConfigurationUpdate = null;
	protected static string $type = 'redis';

	public static function saveConfig($servers): void
	{
		self::$systemConfigurationUpdate = ClusterCacheConfig::getInstance('redis')->saveConfig(
			$servers,
			[
				'type' => [
					'class_name' => 'CPHPCacheRedisCluster',
					'extension' => 'redis',
					'required_file' => 'modules/cluster/classes/general/redis_cache.php',
				],
				'failover' => Option::get('cluster', 'failower_settings'),
				'timeout' => Option::get('cluster', 'redis_timeoit'),
				'read_timeout' => Option::get('cluster', 'redis_read_timeout'),
				'persistent' => (Option::get('cluster', 'redis_persistent') === 'Y'),
			],
			'CPHPCacheRedisCluster'
		);
	}

	public static function getStatus($server): array
	{
		$stats = [
			'message' => null,
			'redis_version' => null,
			'redis_mode' => null,
			'os' => null,
			'uptime_in_seconds' => null,
			'connected_clients' => null,
			'total_system_memory' => null,
			'used_memory' => null,
			'maxmemory' => null,
			'maxmemory_policy' => null,
			'mem_fragmentation_ratio' => null,
			'loading' => null,
			'keyspace_hits' => null,
			'keyspace_misses' => null,
			'evicted_keys' => null,
			'expired_keys' => null,
			'expired_stale_perc' => null,
			'used_cpu_sys' => null,
			'used_cpu_user' => null,
			'used_cpu_sys_children' => null,
			'used_cpu_user_children' => null,
			'role' => null,
			'cluster_enabled' => null,
			'connected_slaves' => null,
			'master_replid' => null,
			'master_replid2' => null,
			'master_repl_offset' => null,
			'slave_expires_tracked_keys' => null
		];

		if (is_array($server))
		{
			try
			{
				$redis = new \Redis();
				if (@$redis->connect($server['HOST'], $server['PORT']))
				{
					$info = $redis->info();
					foreach ($stats as $key => $_)
					{
						$stats[$key] = $info[$key];
					}
				}

				$stats['uptime'] = $stats['uptime_in_seconds'];
			}
			catch (RedisException $e)
			{
				$stats['message'] = $e->getMessage();
			}
		}

		return $stats;
	}
}