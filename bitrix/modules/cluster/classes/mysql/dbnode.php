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
}
