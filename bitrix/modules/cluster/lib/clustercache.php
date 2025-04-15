<?php
namespace Bitrix\Cluster;

class ClusterCache
{
	protected static string $type = 'memcache';

	public static function getList(): ?\CDBResult
	{
		$res = new \CDBResult;
		$res->InitFromArray(ClusterCacheConfig::getInstance(static::$type)->getConfig());
		return $res;
	}

	public static function getServerList(): array
	{
		return ClusterCacheConfig::getInstance(static::$type)->getServers();
	}

	public static function getByID(int $id): array
	{
		$servers = ClusterCacheConfig::getInstance(static::$type)->getConfig();
		return is_array($servers[$id]) ? $servers[$id] : [];
	}

	public static function delete(int $id): bool
	{
		$servers = ClusterCacheConfig::getInstance(static::$type)->getConfig();
		if (array_key_exists($id, $servers))
		{
			unset($servers[$id]);
			static::saveConfig($servers);
		}
		return true;
	}

	public static function pause(int|array $ids): void
	{
		$ob = new static();
		$ob->update($ids, ['STATUS' => 'READY']);
	}

	public static function resume(int|array $ids): void
	{
		$ob = new static();
		$ob->update($ids, ['STATUS' => 'ONLINE']);
	}

	public function add($fields): int
	{
		if (!$this->checkFields($fields, false))
		{
			return 0;
		}

		$servers = ClusterCacheConfig::getInstance(static::$type)->getConfig();

		$id = 1;
		foreach ($servers as $server)
		{
			if ($server['ID'] >= $id)
			{
				$id = $server['ID'] + 1;
			}
		}

		$status = static::getStatus($fields);
		$servers[$id] = [
			'ID' => $id,
			'GROUP_ID' => intval($fields['GROUP_ID']),
			'STATUS' => 'READY',
			'WEIGHT' => $fields['WEIGHT'] ?? 100,
			'HOST' => $fields['HOST'],
			'PORT' => $fields['PORT'],
			'MODE' => strtoupper($status['redis_mode'] ?? ''),
			'ROLE' => strtoupper($status['role'] ?? ''),
		];

		static::saveConfig($servers);
		return $id;
	}

	public function update($serverID, $fields): bool
	{
		if (!is_array($serverID))
		{
			$serverID = [0 => (int) $serverID];
		}

		$servers = ClusterCacheConfig::getInstance(static::$type)->getConfig();
		foreach ($serverID as $id)
		{
			if (!array_key_exists($id, $servers))
			{
				return 0;
			}

			$status = $this->checkFields($servers[$id]);
			if (empty($status) || $status['message'] !== null || intval($status['uptime']) <= 0)
			{
				return false;
			}

			$servers[$id] = [
				'ID' => $id,
				'GROUP_ID' => $servers[$id]['GROUP_ID'],
				'STATUS' => $fields['STATUS'] ?? $servers[$id]['STATUS'],
				'HOST' => $fields['HOST'] ?? $servers[$id]['HOST'],
				'PORT' => $fields['PORT'] ?? $servers[$id]['PORT'],
				'MODE' => strtoupper($servers[$id]['MODE'] ?? ''),
				'ROLE' => strtoupper($servers[$id]['ROLE'] ?? '')
			];
		}

		static::saveConfig($servers);
		return true;
	}

	public function checkFields(&$fields): array
	{
		$error = [];
		$status = [];

		$fields['WEIGHT'] = (int) ($fields['WEIGHT'] ?? 100);
		if ($fields['WEIGHT'] < 0)
		{
			$fields['WEIGHT'] = 0;
		}
		elseif ($fields['WEIGHT'] > 100)
		{
			$fields['WEIGHT'] = 100;
		}

		$fields['PORT'] = (int) $fields['PORT'];
		if (isset($fields['HOST']))
		{
			$status = static::getStatus($fields);

			if ($status['message'] !== null)
			{
				$error[] = [
					'id' => $fields['HOST'],
					'text' => Loc:: getMessage('CLU_' . strtoupper(static::$type) . '_CANNOT_CONNECT')
				];
			}
		}

		if (!empty($error))
		{
			global $APPLICATION;
			$e = new CAdminException($error);
			$APPLICATION->ThrowException($e);
			return [];
		}

		return $status;
	}

	public static function getServerStatus(int $id): array
	{
		$server = static::getByID($id);
		return static::getStatus($server);
	}

	static function getStatus(array $server): array
	{
	}

	static function saveConfig(array $servers): void
	{
	}
}