<?php

use Bitrix\Main\Application;
use Bitrix\Main\Data\RedisConnection;
use Bitrix\Main\Loader;

class CPHPCacheRedisCluster extends \Bitrix\Main\Data\CacheEngineRedis
{
	private bool $bQueue = false;
	private static array $servers = [];
	private static array $otherCroups = [];

	protected float|null $timeout = null;
	protected float|null $readTimeout = null;
	protected int $failover = \RedisCluster::FAILOVER_NONE;

	public static function LoadConfig() : array
	{

		static $firstExec = true;
		if ($firstExec)
		{
			$arList = false;
			$firstExec = false;

			if (file_exists($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/redis.php'))
			{
				include $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/redis.php';
			}

			if (defined('BX_REDIS_CLUSTER') && is_array($arList))
			{
				foreach ($arList as $server)
				{
					if ($server['STATUS'] !== 'ONLINE')
					{
						continue;
					}

					if (defined('BX_CLUSTER_GROUP') && ($server['GROUP_ID'] !== constant('BX_CLUSTER_GROUP')))
					{
						self::$otherCroups[$server['GROUP_ID']] = true;
						continue;
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
		if (self::$engine === null)
		{
			static::LoadConfig();
			if (defined('BX_CLUSTER_GROUP'))
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

				if (isset($config['read_timeout']))
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
					'serializer' => $config['serializer'] ?? null,
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
