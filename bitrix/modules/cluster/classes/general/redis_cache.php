<?php

use Bitrix\Main\Application;
use Bitrix\Main\Data\RedisConnection;

class CPHPCacheRedisCluster extends \Bitrix\Main\Data\CacheEngineRedis
{
	private $bQueue = null;

	/** @var array|false $servers */
	private static $servers = false;
	private static $otherGroups = [];

	protected $timeout = null;
	protected $readTimeout = null;
	protected $failover = \RedisCluster::FAILOVER_NONE;

	public static function LoadConfig()
	{
		if (self::$servers === false)
		{
			$arList = false;
			if (file_exists($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/redis.php'))
			{
				include($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/redis.php');
			}

			if (defined('BX_REDIS_CLUSTER') && is_array($arList))
			{
				foreach ($arList as $server)
				{
					$otherGroup = defined('BX_CLUSTER_GROUP') && ($server['GROUP_ID'] !== BX_CLUSTER_GROUP);

					if (($server['STATUS'] !== 'ONLINE') || $otherGroup)
					{
						continue;
					}

					if ($otherGroup)
					{
						self::$otherGroups[$server['GROUP_ID']] = true;
					}

					self::$servers[] = [
						'host' => $server['HOST'],
						'port' => $server['PORT'],
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

	public function __construct($options = [])
	{
		if (self::$engine == null)
		{
			static::LoadConfig();
			if (defined("BX_CLUSTER_GROUP"))
			{
				$this->bQueue = true;
			}

			$config = $this->configure();
			if ($config && is_array($config))
			{
				if (isset($config['failover']))
				{
					$this->failover = $config['failover'];
				}

				if (isset($config['timeout']))
				{
					$config['timeout'] = (float) $config['timeout'];
					if ($config['timeout'] > 0)
					{
						$this->timeout = $config['timeout'];
					}
				}

				if (isset($config["read_timeout"]))
				{
					$config['read_timeout'] = (float) $config['read_timeout'];
					if ($config['read_timeout'] > 0)
					{
						$this->readTimeout = $config['read_timeout'];
					}
				}
			}

			$connectionPool = Application::getInstance()->getConnectionPool();
			$connectionPool->setConnectionParameters(
				$this->getConnectionName(),
				[
					'className' => RedisConnection::class,
					'servers' => self::$servers,
					'timeout' => $this->timeout,
					'readTimeout' => $this->readTimeout,
					'serializer' => $config['serializer'],
					'failover' => $this->failover,
					'persistent' => $config['persistent'],
				]
			);

			/** @var RedisConnection $engineConnection */
			$engineConnection = $connectionPool->getConnection($this->getConnectionName());
			self::$engine = $engineConnection->getResource();
			self::$isConnected = $engineConnection->isConnected();
		}

		$this->sid = BX_REDIS_CLUSTER . $this->sid;
	}

	public function QueueRun($param1, $param2, $param3)
	{
		$this->bQueue = false;
		$this->clean($param1, $param2, $param3);
	}

	public function clean($baseDir, $initDir = false, $filename = false)
	{
		if (self::isAvailable())
		{
			if (
				$this->bQueue
				&& class_exists('CModule')
				&& CModule::IncludeModule('cluster')
			)
			{
				foreach (self::$otherGroups as $group_id => $tmp)
				{
					CClusterQueue::Add($group_id, 'CPHPCacheRedisCluster', $baseDir, $initDir, $filename);
				}
			}

			parent::clean($baseDir, $initDir, $filename);
		}
	}
}