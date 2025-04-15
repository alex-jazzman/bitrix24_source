<?php
IncludeModuleLangFile(__FILE__);

class CClusterDBNodeCheck extends CAllClusterDBNodeCheck
{
	const OK = 1;
	const WARNING = 0;
	const ERROR = -1;

	public function MainNodeCommon($arMasterNode)
	{
		return [];
	}

	public function MainNodeForReplication($arMasterNode)
	{
		return [];
	}

	public function MainNodeForSlave()
	{
		return [];
	}

	public function SlaveNodeIsReplicationRunning($db_host, $db_name, $db_login, $db_password, $master_host=false, $master_port=false)
	{
		return false;
	}

	public function SlaveNodeConnection($db_host, $db_name, $db_login, $db_password, $master_host=false, $master_port=false, $master_id = 1)
	{
		global $DB;

		$node_id = 'v99';
		CClusterDBNode::GetByID($node_id, [
			'ACTIVE' => 'Y',
			'STATUS' => 'ONLINE',
			'DB_HOST' => $db_host,
			'DB_NAME' => $db_name,
			'DB_LOGIN' => $db_login,
			'DB_PASSWORD' => $db_password,
		]);

		try
		{
			ob_start();
			$nodeDB = CDatabase::GetDBNodeConnection($node_id, true);
			$error = ob_get_contents();
			ob_end_clean();
		}
		catch (\Bitrix\Main\DB\ConnectionException $e)
		{
			$nodeDB = false;
			$error = $e->getMessage();
		}

		if (is_object($nodeDB))
		{
			//Test if this connection is not the same as master
			$bSkipSecondTest = false;
			//1. Make sure that no replication is runnung
			$rs = $nodeDB->Query('select CLIENT_ADDR,STATE,REPLAY_LAG,SYNC_STATE,REPLY_TIME from bx_cluster_stat_replication()', true, '', ['fixed_connection' => true]);
			$ar = $rs ? $rs->Fetch() : false;
			if ($ar)
			{
				return GetMessage('CLU_RUNNING_SLAVE');
			}
			//2. Check if b_cluster_dbnode exists on node
			if ($nodeDB->TableExists('b_cluster_dbnode') && !$bSkipSecondTest)
			{
				//2.1 Generate uniq id
				$uniqid = md5(mt_rand());
				$DB->Query("UPDATE b_cluster_dbnode SET UNIQID='" . $uniqid . "' WHERE ID=1", false, '', ['fixed_connection' => true]);
				$rs = $nodeDB->Query('SELECT UNIQID FROM b_cluster_dbnode WHERE ID=1', true);
				if ($rs)
				{
					if ($ar = $rs->Fetch())
					{
						if ($ar['UNIQID'] == $uniqid)
						{
							return GetMessage('CLU_SAME_DATABASE');
						}
					}
				}
			}

			return $nodeDB;
		}
		else
		{
			return $error;
		}
	}

	public function SlaveNodeCommon($nodeDB)
	{
		return [];
	}

	public function SlaveNodeForReplication($nodeDB)
	{
		return [];
	}

	public function SlaveNodeForMaster($nodeDB)
	{
		return [];
	}

	public static function GetServerVariables($DB, $arVariables, $db_mask)
	{
		return $arVariables;
	}

	public function GetServerVariable($DB, $var_name)
	{
		$arResult = CClusterDBNodeCheck::GetServerVariables($DB, [$var_name => ''], $var_name);
		return $arResult[$var_name];
	}
}
