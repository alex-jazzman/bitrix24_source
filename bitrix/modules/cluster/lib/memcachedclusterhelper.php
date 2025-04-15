<?php

namespace Bitrix\Cluster;

IncludeModuleLangFile(__FILE__);

class MemcachedClusterHelper extends \Bitrix\Cluster\ClusterCache
{
	public static null|bool $systemConfigurationUpdate = null;
	protected static string $type = 'memcached';

	public static function saveConfig($servers): void
	{
		self::$systemConfigurationUpdate = ClusterCacheConfig::getInstance('memcached')->saveConfig(
			$servers,
			[
				'type' => [
					'class_name' => '\Bitrix\Cluster\MemcachedClusterCache',
					'extension' => 'memcached',
					'required_file' => 'modules/cluster/lib/memcachedclustercache.php',
				],
			],
			'\Bitrix\Cluster\MemcachedClusterCache'
		);
	}

	public static function getStatus(array $server): array
	{
		$status = [];
		$memcached = new \Memcached;
		if ($memcached->addServer($server['HOST'], $server['PORT']))
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

			$info = $memcached->getStats();
			if (is_array($info) && ($serverStatus = array_shift($info)))
			{
				foreach ($status as $key => $_)
				{
					$status[$key] = $serverStatus[$key];
				}
			}
		}

		return $status;
	}
}