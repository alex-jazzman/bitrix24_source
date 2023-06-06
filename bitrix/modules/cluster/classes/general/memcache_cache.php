<?php

class CPHPCacheMemcacheCluster extends \Bitrix\Main\Data\CacheEngineMemcache
{
	private $bQueue = null;

	/** @var array|false $servers */
	private static $servers = false;
	private static $arOtherGroups = array();

	public static function LoadConfig()
	{
		if (self::$servers === false)
		{
			$arList = false;
			if (file_exists($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/memcache.php'))
			{
				include($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/memcache.php');
			}

			if (defined('BX_MEMCACHE_CLUSTER') && is_array($arList))
			{
				foreach ($arList as $i => $server)
				{
					$bOtherGroup = defined("BX_CLUSTER_GROUP") && ($server["GROUP_ID"] !== BX_CLUSTER_GROUP);

					if (($server["STATUS"] !== "ONLINE") || $bOtherGroup)
					{
						continue;
					}

					if ($bOtherGroup)
					{
						self::$arOtherGroups[$server["GROUP_ID"]] = true;
					}

					self::$servers[] = [
						'host' => $server['HOST'],
						'port' => $server['PORT'],
						'weight' => $server['WEIGHT']
					];
				}
			}
			else
			{
				self::$servers = [];
			}
		}
		return self::$servers;
	}

	function __construct($options = [])
	{
		parent::__construct([
			'servers' => static::LoadConfig(),
			'type' => 'memcache'
		]);

		if (defined("BX_CLUSTER_GROUP"))
		{
			$this->bQueue = true;
		}

		$this->sid = BX_MEMCACHE_CLUSTER . $this->sid;
	}

	function QueueRun($param1, $param2, $param3)
	{
		$this->bQueue = false;
		$this->clean($param1, $param2, $param3);
	}

	function clean($baseDir, $initDir = false, $filename = false)
	{
		if (self::isAvailable())
		{
			if (
				$this->bQueue
				&& class_exists('CModule')
				&& CModule::IncludeModule('cluster')
			)
			{
				foreach (self::$arOtherGroups as $group_id => $tmp)
				{
					CClusterQueue::Add($group_id, 'CPHPCacheMemcacheCluster', $baseDir, $initDir, $filename);
				}
			}

			parent::clean($baseDir, $initDir, $filename);
		}
	}
}