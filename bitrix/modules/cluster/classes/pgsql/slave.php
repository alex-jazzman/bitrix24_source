<?php

use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;

IncludeModuleLangFile(__FILE__);

class CClusterSlave
{
	public static function Pause($node_id)
	{
		global $DB;

		$arNode = CClusterDBNode::GetByID($node_id);
		if (!is_array($arNode))
		{
			return;
		}

		if ($node_id == 1)
		{
			$nodeDB = $DB;
		}
		else
		{
			ob_start();
			$nodeDB = CDatabase::GetDBNodeConnection($arNode['ID'], true);
			ob_end_clean();
		}

		if (!is_object($nodeDB))
		{
			return;
		}

		$rs = $nodeDB->Query('select pg_wal_replay_pause()', false, '', ['fixed_connection' => true]);
		if ($rs)
		{
			$ob = new CClusterDBNode;
			$ob->Update($arNode['ID'], ['STATUS' => 'PAUSED']);
		}
	}

	public static function Resume($node_id)
	{
		global $DB;

		$arNode = CClusterDBNode::GetByID($node_id);
		if (!is_array($arNode))
		{
			return;
		}

		if ($node_id == 1)
		{
			$nodeDB = $DB;
		}
		else
		{
			ob_start();
			$nodeDB = CDatabase::GetDBNodeConnection($arNode['ID'], true, false);
			ob_end_clean();
		}

		if (!is_object($nodeDB))
		{
			return;
		}

		$rs = $nodeDB->Query('select pg_wal_replay_resume()', false, '', ['fixed_connection' => true]);
		if ($rs)
		{
			$ob = new CClusterDBNode;
			$ob->Update($arNode['ID'], ['STATUS' => 'ONLINE']);
		}
	}

	public static function GetStatus($node_id, $bSlaveStatus = true, $bGlobalStatus = true, $bVariables = true)
	{
		global $DB;

		$arNode = CClusterDBNode::GetByID($node_id);
		if (!is_array($arNode))
		{
			return false;
		}

		if ($node_id == 1 || $arNode['MASTER_ID'] == 1)
		{
			$masterDB = $DB;
		}
		else
		{
			ob_start();
			try
			{
				$masterDB = CDatabase::GetDBNodeConnection($arNode['MASTER_ID'], true, false);
			}
			catch (\Bitrix\Main\DB\ConnectionException $_)
			{
				$masterDB = false;
			}
			ob_end_clean();
		}

		if (!is_object($masterDB))
		{
			return false;
		}

		$arStatus = ['Rows_returned' => null];

		if ($arNode['MASTER_ID'] <> '')
		{
			$arStatus = array_merge($arStatus, [
				'state' => null,
				'sync_state' => null,
				'sent_lsn' => null,
				'replay_lsn' => null,
				'Seconds_Behind_Master' => null,
			]);

			if ($bSlaveStatus)
			{
				$rs = $masterDB->Query('select STATE,SYNC_STATE,SENT_LSN,REPLAY_LSN,REPLAY_LAG from bx_cluster_stat_replication() WHERE CLIENT_ADDR = \'' . $masterDB->ForSql($arNode['DB_HOST']) . '\'', true, '', ['fixed_connection' => true]);
				if (!$rs)
				{
					return false;
				}

				$ar = $rs->Fetch();
				if (is_array($ar))
				{
					$arStatus['state'] = $ar['STATE'];
					$arStatus['sync_state'] = $ar['SYNC_STATE'];
					$arStatus['sent_lsn'] = $ar['SENT_LSN'];
					$arStatus['replay_lsn'] = $ar['REPLAY_LSN'];
					$hours = 0;
					$minutes = 0;
					$seconds = 0;
					sscanf($ar['REPLAY_LAG'] ?: '00:00:00', '%d:%d:%d', $hours, $minutes, $seconds);
					$arStatus['Seconds_Behind_Master'] = $hours * 3600 + $minutes * 60 + $seconds;
				}
			}
		}

		if ($bGlobalStatus)
		{
			if ($node_id == 1)
			{
				$nodeDB = $DB;
			}
			else
			{
				ob_start();
				try
				{
					$nodeDB = CDatabase::GetDBNodeConnection($arNode['ID'], true, false);
				}
				catch (\Bitrix\Main\DB\ConnectionException $_)
				{
					$nodeDB = false;
				}
				ob_end_clean();
			}

			if (is_object($nodeDB))
			{
				$rs = $nodeDB->Query("select TUP_RETURNED from pg_stat_database where DATNAME = '" . $nodeDB->ForSql($nodeDB->DBName) . "'", true, '', ['fixed_connection' => true]);
				if (is_object($rs))
				{
					while ($ar = $rs->Fetch())
					{
						if (!isset($arStatus['Rows_returned']))
						{
							$arStatus['Rows_returned'] = 0;
						}

						$arStatus['Rows_returned'] += $ar['TUP_RETURNED'];
					}
				}
			}
		}

		return $arStatus;
	}

	public static function GetList(): array
	{
		global $DB;
		static $slaves = false;
		if ($slaves === false)
		{
			$cacheID = 'db_slaves_v2';

			/** @var \Bitrix\Main\Data\ManagedCache $cache */
			$cache = Application::getInstance()->getManagedCache();
			if (
				CACHED_b_cluster_dbnode !== false
				&& $cache->read(CACHED_b_cluster_dbnode, $cacheID, 'b_cluster_dbnode')
			)
			{
				$slaves = $cache->get($cacheID);
			}
			else
			{
				$slaves = [];

				$rs = $DB->Query("
					SELECT ID, WEIGHT, ROLE_ID, GROUP_ID
					FROM b_cluster_dbnode
					WHERE STATUS = 'ONLINE' AND (SELECTABLE is null or SELECTABLE = 'Y')
					ORDER BY ID
				", false, '', ['fixed_connection' => true]);
				while ($ar = $rs->Fetch())
				{
					$slaves[intval($ar['ID'])] = $ar;
				}

				if (CACHED_b_cluster_dbnode !== false)
				{
					$cache->set($cacheID, $slaves);
				}
			}
		}
		return $slaves;
	}

	protected static function GetMaxSlaveDelay(): int
	{
		static $max_slave_delay = null;
		if (!isset($max_slave_delay))
		{
			$max_slave_delay = (int) Option::get('cluster', 'max_slave_delay');
			if (
				Application::getInstance()->isInitialized()
				&& isset(Application::getInstance()->getKernelSession()['BX_REDIRECT_TIME'])
			)
			{
				$redirect_delay = time() - Application::getInstance()->getKernelSession()['BX_REDIRECT_TIME'] + 1;
				if (
					$redirect_delay > 0
					&& $redirect_delay < $max_slave_delay
				)
				{
					$max_slave_delay = $redirect_delay;
				}
			}
		}
		return $max_slave_delay;
	}

	protected static function IsSlaveOk($slave_id): bool
	{
		$cache = \Bitrix\Main\Data\Cache::createInstance();
		if ($cache->initCache(
			(int) Option::get('cluster', 'slave_status_cache_time'),
			'cluster_slave_status_' . (int) $slave_id,
			'cluster'
		))
		{
			$slaveStatus = $cache->getVars();
		}
		else
		{
			$slaveStatus = static::GetStatus($slave_id, true, false, false);
		}

		if (
			!$slaveStatus
			|| $slaveStatus['Seconds_Behind_Master'] > static::GetMaxSlaveDelay()
			|| $slaveStatus['state'] != 'streaming'
		)
		{
			if ($cache->startDataCache())
			{
				$cache->endDataCache($slaveStatus);
			}
			return false;
		}
		return true;
	}

	public static function GetRandomNode()
	{
		$slaves = static::GetList();
		if (empty($slaves))
		{
			return false;
		}

		//Exclude slaves from other cluster groups
		foreach ($slaves as $i => $slave)
		{
			$isOtherGroup = defined('BX_CLUSTER_GROUP') && ($slave['GROUP_ID'] != constant('BX_CLUSTER_GROUP'));
			if (
				defined('BX_CLUSTER_SLAVE_USE_ANY_GROUP')
				&& constant('BX_CLUSTER_SLAVE_USE_ANY_GROUP') === true
				&& $slave['ROLE_ID'] == 'SLAVE'
			)
			{
				$isOtherGroup = false;
			}

			if ($isOtherGroup)
			{
				unset($slaves[$i]);
			}
		}

		$found = false;
		while (true)
		{
			if (empty($slaves))
			{
				return false;
			}

			$total_weight = 0;
			foreach ($slaves as $i => $slave)
			{
				$total_weight += $slave['WEIGHT'];
				$slaves[$i]['PIE_WEIGHT'] = $total_weight;
			}

			$rand = ($total_weight > 0 ? mt_rand(1, $total_weight) : 0);
			foreach ($slaves as $i => $slave)
			{
				if ($rand <= $slave['PIE_WEIGHT'])
				{
					if ($slave['ROLE_ID'] == 'SLAVE')
					{
						if (!static::IsSlaveOk($slave['ID']))
						{
							unset($slaves[$i]);
							continue 2;
						}
					}

					$found = $slave;
					break 2;
				}
			}
		}

		if (!$found || $found['ROLE_ID'] != 'SLAVE')
		{
			return false; //use main connection
		}

		return $found;
	}
}
