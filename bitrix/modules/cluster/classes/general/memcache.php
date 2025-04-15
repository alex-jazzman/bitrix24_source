<?php

use Bitrix\Cluster\ClusterCacheConfig;

IncludeModuleLangFile(__FILE__);

class CClusterMemcache extends \Bitrix\Cluster\ClusterCache
{
	public static null|bool $systemConfigurationUpdate = null;
	protected static string $type = 'memcache';

	public static function SaveConfig($servers): void
	{
		self::$systemConfigurationUpdate = ClusterCacheConfig::getInstance('memcache')->saveConfig(
			$servers,
			[
				'type' => [
					'class_name' => 'CPHPCacheMemcacheCluster',
					'extension' => 'memcache',
					'required_file' => 'modules/cluster/classes/general/memcache_cache.php',
				],
			],
			'CPHPCacheMemcacheCluster'
		);
	}

	public static function getStatus(array $server): array
	{
		$status = [];
		if (is_array($server))
		{
			$ob = new Memcache;
			if (@$ob->connect($server['HOST'], $server['PORT']))
			{
				$status = [
					'uptime' => null,
					'version' => null,
					'cmd_get' => null,
					'cmd_set' => null,
					'get_misses' => null,
					'get_hits' => null,
					'evictions' => null,
					'limit_maxbytes' => null,
					'bytes' => null,
					'curr_items' => null,
					'listen_disabled_num' => null,
				];

				$ar = $ob->getStats();
				foreach ($status as $key => $_)
				{
					$status[$key] = $ar[$key];
				}
			}
		}

		return $status;
	}
}