<?php
IncludeModuleLangFile(__FILE__);

class CClusterDBNode extends CAllClusterDBNode
{
	public static function GetUpTime($node_id)
	{
		if ($node_id > 1)
		{
			ob_start();
			try
			{
				$DB = CDatabase::GetDBNodeConnection($node_id, true, false);
			}
			catch (\Bitrix\Main\DB\ConnectionException $_)
			{
				$DB = false;
			}
			ob_end_clean();
		}
		else
		{
			$DB = $GLOBALS['DB'];
		}

		if (is_object($DB))
		{
			$rs = $DB->Query("show status like 'Uptime'", false, '', ['fixed_connection' => true]);
			if ($ar = $rs->Fetch())
			{
				return $ar['Value'];
			}
		}

		return false;
	}

	protected static $keyMap = [
		'Last_Error' => 'Last_SQL_Error',
		'Replica_IO_Running' => 'Slave_IO_Running',
		'Replica_SQL_Running' => 'Slave_SQL_Running',
		'Seconds_Behind_Source' => 'Seconds_Behind_Master',
		'Read_Source_Log_Pos' => 'Read_Master_Log_Pos',
		'Exec_Source_Log_Pos' => 'Exec_Master_Log_Pos',
		'Source_Host' => 'Master_Host',
		'Source_Port' => 'Master_Port',
		'Replica_IO_State' => 'Slave_IO_State',
	];

	protected static function compatStatusFields($status)
	{
		if (is_array($status))
		{
			foreach (static::$keyMap as $fromKey => $toKey)
			{
				if (array_key_exists($fromKey, $status))
				{
					$status[$toKey] = $status[$fromKey];
				}
			}
		}
		else
		{
			return [];
		}

		return $status;
	}

	public static function getMasterStatus($DB)
	{
		/* @var $rs CDBResult */
		$rs = false;
		if (version_compare($DB->GetVersion(), '8.0.22', '>='))
		{
			$rs = $DB->Query('SHOW BINARY LOG STATUS', true, '', ['fixed_connection' => true]);
		}

		if (!$rs)
		{
			$rs = $DB->Query('sHOW MASTER STATUS', true, '', ['fixed_connection' => true]);
		}

		$status = $rs ? static::compatStatusFields($rs->Fetch()) : false;

		return $status;
	}

	public static function startMaster($DB, $host, $user, $password, $port, $log_file, $log_pos)
	{
		/* @var $rs CDBResult */
		$rs = false;
		if (version_compare($DB->GetVersion(), '8.0.22', '>='))
		{
			$rs = $DB->Query("
				CHANGE REPLICATION SOURCE TO
					SOURCE_HOST = '" . $DB->ForSql($host) . "'
					,SOURCE_USER = '" . $DB->ForSql($user) . "'
					,SOURCE_PASSWORD = '" . $DB->ForSql($password) . "'
					,SOURCE_PORT = " . intval($port) . "
					,SOURCE_LOG_FILE = '" . $DB->ForSql($log_file) . "'
					,SOURCE_LOG_POS = " . intval($log_pos) . '
			', false, '', ['fixed_connection' => true]);
		}

		if (!$rs)
		{
			$rs = $DB->Query("
				CHANGE MASTER TO
					MASTER_HOST = '" . $DB->ForSql($host) . "'
					,MASTER_USER = '" . $DB->ForSql($user) . "'
					,MASTER_PASSWORD = '" . $DB->ForSql($password) . "'
					,MASTER_PORT = " . intval($port) . "
					,MASTER_LOG_FILE = '" . $DB->ForSql($log_file) . "'
					,MASTER_LOG_POS = " . intval($log_pos) . '
			', false, '', ['fixed_connection' => true]);
		}

		return $rs;
	}

	public static function getSlaveStatus($DB)
	{
		/* @var $rs CDBResult */
		$rs = false;
		if (version_compare($DB->GetVersion(), '8.0.22', '>='))
		{
			$rs = $DB->Query('SHOW REPLICA STATUS', true, '', ['fixed_connection' => true]);
		}

		if (!$rs)
		{
			$rs = $DB->Query('SHOW SLAVE STATUS', true, '', ['fixed_connection' => true]);
		}

		$status = $rs ? static::compatStatusFields($rs->Fetch()) : false;

		return $status;
	}

	public static function startSlave($DB)
	{
		/* @var $rs CDBResult */
		$rs = false;
		if (version_compare($DB->GetVersion(), '8.0.22', '>='))
		{
			$rs = $DB->Query('START REPLICA', true, '', ['fixed_connection' => true]);
		}

		if (!$rs)
		{
			$rs = $DB->Query('START SLAVE', true, '', ['fixed_connection' => true]);
		}

		return (bool)$rs;
	}

	public static function stopSlave($DB)
	{
		/* @var $rs CDBResult */
		$rs = false;
		if (version_compare($DB->GetVersion(), '8.0.22', '>='))
		{
			$rs = $DB->Query('STOP REPLICA', true, '', ['fixed_connection' => true]);
		}

		if (!$rs)
		{
			$rs = $DB->Query('STOP SLAVE', true, '', ['fixed_connection' => true]);
		}

		return (bool)$rs;
	}
}
