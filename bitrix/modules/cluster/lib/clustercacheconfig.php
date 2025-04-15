<?php

namespace Bitrix\Cluster;

use Bitrix\Main\Config\Configuration;

class ClusterCacheConfig
{
	private static array $instance;
	protected string $type = 'memcache';
	protected string $constName = 'BX_MEMCACHE_CLUSTER';
	protected static array|null $servers = null;

	private function __construct(string $type = 'memcache')
	{
		switch ($type)
		{
			case 'memcache':
				$this->type = $type;
				$this->constName = 'BX_MEMCACHE_CLUSTER';
				break;
			case 'memcached':
				$this->type = $type;
				$this->constName = 'BX_MEMCACHED_CLUSTER';
				break;
			case 'redis':
				$this->type = $type;
				$this->constName = 'BX_REDIS_CLUSTER';
				break;
		}
	}

	private function __clone()
	{
		// You can't clone it
	}

	public static function getInstance(string $type = 'memcache'): ClusterCacheConfig
	{
		if (!isset(self::$instance[$type]))
		{
			self::$instance[$type] = new ClusterCacheConfig($type);
		}
		return self::$instance[$type];
	}

	public function getConfig(bool $onlyOnline = false, array &$otherGroups = []): array
	{
		if (self::$servers === null || !isset(self::$servers[$this->type]))
		{
			$arList = false;
			$configFile = $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/' . $this->type . '.php';

			if (file_exists($configFile))
			{
				include $configFile;
			}

			if (defined($this->constName) && is_array($arList))
			{
				self::$servers[$this->type] = $arList;
			}
			else
			{
				self::$servers[$this->type] = [];
			}
		}

		if ($onlyOnline && defined($this->constName) && is_array($arList))
		{
			$result = [];
			foreach (self::$servers[$this->type] as $server)
			{
				if ($server['STATUS'] !== 'ONLINE')
				{
					continue;
				}

				if (defined('BX_CLUSTER_GROUP') && ($server['GROUP_ID'] !== constant('BX_CLUSTER_GROUP')))
				{
					$otherGroups[$server['GROUP_ID']] = true;
					continue;
				}

				$result[$server['ID']] = [
					'host' => $server['HOST'],
					'port' => $server['PORT'],
					'weight' => (int) $server['WEIGHT'] ?? 100
				];
			}

			return $result;
		}

		return self::$servers[$this->type];
	}

	public function saveConfig(array $servers, array $cacheConfig, string $className): bool
	{
		$online = false;
		$result = false;
		self::$servers[$this->type] = null;

		$content = "<?php\n"
			. 'if (!defined(\'' . $this->constName . '\'))'
			. "\n{\n"
			. "\t" . 'define(\'' . $this->constName . '\', \'' . EscapePHPString(\CMain::GetServerUniqID()) . '\');'
			. "\n}\n\n" . '$arList = [' . "\n";

		$groups = [];
		$defaultGroup = 1;
		$clusterGroups = \CClusterGroup::GetList(['ID' => 'DESC']);
		while ($group = $clusterGroups->Fetch())
		{
			$defaultGroup = $groups[$group['ID']] = (int) $group['ID'];
		}

		foreach ($servers as $i => $server)
		{
			$serverID = (int) $server['ID'];
			$groupID = (int) $server['GROUP_ID'];

			if ($server['STATUS'] == 'ONLINE')
			{
				$online = true;
			}

			if (!array_key_exists($server['GROUP_ID'], $groups))
			{
				$groupID = $defaultGroup;
			}

			$content .= "\t{$serverID} => [\n";
			$content .= "\t\t'ID' => {$serverID},\n";
			$content .= "\t\t'GROUP_ID' => {$groupID},\n";
			$content .= "\t\t'HOST' => '" . EscapePHPString($server['HOST']) . "',\n";
			$content .= "\t\t'PORT' => " . intval($server['PORT']) . ",\n";
			$content .= "\t\t'WEIGHT' => " . intval($server['WEIGHT']) . ",\n";
			$content .= match ($server['STATUS'])
			{
				'ONLINE' => "\t\t'STATUS' => 'ONLINE',\n",
				'OFFLINE' => "\t\t'STATUS' => 'OFFLINE',\n",
				default => "\t\t'STATUS' => 'READY',\n",
			};

			$content .= "\t\t'MODE' => '" . $server['MODE'] . "',\n";
			$content .= "\t\t'ROLE' => '" . $server['ROLE'] . "',\n";
			$content .= "\t],\n";
		}

		$content .= "];\n";

		$serverListFile = $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/cluster/' . $this->type . '.php';
		file_put_contents($serverListFile, $content);
		\Bitrix\Main\Application::resetAccelerator($serverListFile);

		$cache = Configuration::getValue('cache');
		if ($online)
		{
			if (
				!is_array($cache)
				|| !isset($cache['type'])
				|| !is_array($cache['type'])
				|| !isset($cache['type']['class_name'])
				|| !($cache['type']['class_name'] === $className)
			)
			{
				Configuration::setValue('cache', $cacheConfig);
				$result = true;
			}
		}
		else
		{
			if (
				is_array($cache)
				&& isset($cache['type'])
				&& is_array($cache['type'])
				&& isset($cache['type']['class_name'])
				&& ($cache['type']['class_name'] === $className)
			)
			{
				Configuration::setValue('cache', null);
			}
		}

		return $result;
	}

	public function getServers(): array
	{
		$editPage = match ($this->type)
		{
			'memcached' => 'cluster_memcached_edit',
			'redis' => 'cluster_redis_edit',
			default => 'cluster_memcache_edit',
		};

		$result = [];
		foreach (ClusterCacheConfig::getInstance($this->type)->getConfig() as $data)
		{
			$host = ($data['HOST'] === '127.0.0.1' || $data['HOST'] === 'localhost') ? '' : $data['HOST'];
			$result[] = [
				'ID' => $data['ID'],
				'GROUP_ID' => $data['GROUP_ID'],
				'SERVER_TYPE' => $this->type,
				'ROLE_ID' => '',
				'HOST' => $host,
				'DEDICATED' => 'Y',
				'EDIT_URL' => '/bitrix/admin/' . $editPage . '.php?lang=' . LANGUAGE_ID . '&group_id=' . $data['GROUP_ID'] . '&ID=' . $data['ID'],
			];
		}
		return $result;
	}
}