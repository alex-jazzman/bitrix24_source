<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CPgSqlAddStep1 extends CWizardStep
{
	public function InitStep()
	{
		parent::InitStep();
		if (!CModule::IncludeModule('cluster'))
		{
			$this->SetError(GetMessage('CLUWIZ_NO_MODULE_ERROR'));
		}
		$this->SetTitle(GetMessage('CLUWIZ_STEP1_TITLE'));
		$this->SetStepID('step1');
		$this->SetCancelStep('cancel');
	}

	protected function checkReplayGrants()
	{
		$pool = \Bitrix\Main\Application::getInstance()->getConnectionPool();
		$pool->useMasterOnly(true);
		/* @var \Bitrix\Main\DB\connection $connection */
		$connection = $pool->getConnection();
		$sqlHelper = $connection->getSqlHelper();

		$grantPause = $connection->query("
			select *
			from information_schema.role_routine_grants
			where routine_name = 'pg_wal_replay_pause'
			and grantee = '" . $sqlHelper->forSql($connection->getLogin()) . "'")->fetch();
		$grantResume = $connection->query("
			select *
			from information_schema.role_routine_grants
			where routine_name = 'pg_wal_replay_resume'
			and grantee = '" . $sqlHelper->forSql($connection->getLogin()) . "'")->fetch();

		$isOk = $grantPause && $grantResume;
		if (!$isOk)
		{
			$this->content .= GetMessage('CLUWIZ_REPLICATION_GRANT_ERROR') . '<br />';
			$this->content .= $this->ShowRadioField('grant', 'by_wizard', [
				'id' => 'grant_by_wizard',
			]) . '<label for="grant_by_wizard">' . GetMessage('CLUWIZ_GRANT_BY_WIZARD') . '</label><br>';
			$this->content .= '
			<table border="0" class="data-table">
			<tr>
				<td nowrap align="right" valign="top" width="40%" >' . GetMessage('CLUWIZ_HOST') . '</td>
				<td width="60%" valign="top">' . htmlspecialcharsbx($connection->getHost()) . '</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">' . GetMessage('CLUWIZ_ROOT_USER') . '</td>
				<td valign="top">' . $this->ShowInputField('text', 'root_user', ['size' => '30']) . '</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">' . GetMessage('CLUWIZ_ROOT_PASSWORD') . '</td>
				<td valign="top">' . $this->ShowInputField('password', 'root_password', ['size' => '30']) . '</td>
			</tr>
			</table>
			';
			$this->content .= '<br>' . $this->ShowRadioField('grant', 'by_user', [
				'id' => 'grant_by_user',
			]) . '<label for="grant_by_user">' . GetMessage('CLUWIZ_GRANT_BY_USER') . '</label>';
			$this->content .= '<pre>\c ' . htmlspecialcharsbx($sqlHelper->quote($connection->getDatabase())) . '
GRANT EXECUTE ON FUNCTION pg_wal_replay_pause() to ' . htmlspecialcharsbx($sqlHelper->quote($connection->getLogin())) . ';
GRANT EXECUTE ON FUNCTION pg_wal_replay_resume() to ' . htmlspecialcharsbx($sqlHelper->quote($connection->getLogin())) . ';
</pre>';
		}

		return $isOk;
	}

	public function ShowStep()
	{
		$pool = \Bitrix\Main\Application::getInstance()->getConnectionPool();
		$pool->useMasterOnly(true);
		/* @var \Bitrix\Main\DB\connection $connection */
		$connection = $pool->getConnection();
		$sqlHelper = $connection->getSqlHelper();

		$this->content .= '<style>
			li.cluwiz_erli { list-style-image:url(/bitrix/themes/.default/images/lamp/red.gif) }
			li.cluwiz_okli { list-style-image:url(/bitrix/themes/.default/images/lamp/green.gif) }
			p.cluwiz_err { color:red }
			span.cluwiz_ok { color:green }
			</style>
		';

		$checkQuery = null;
		$isOk = true;
		try
		{
			$checkQuery = $connection->query('select CLIENT_ADDR,STATE,REPLAY_LAG,SYNC_STATE,REPLY_TIME from bx_cluster_stat_replication()');
			$isOk = $this->checkReplayGrants();
		}
		catch (\Bitrix\Main\DB\SqlQueryException $_)
		{
			$isOk = false;
			$this->content .= GetMessage('CLUWIZ_FUNCTION_ERROR') . '<br />';
			$this->content .= $this->ShowRadioField('create', 'by_wizard', [
				'id' => 'create_by_wizard',
			]) . '<label for="create_by_wizard">' . GetMessage('CLUWIZ_CREATE_BY_WIZARD') . '</label><br>';
			$this->content .= '
			<table border="0" class="data-table">
			<tr>
				<td nowrap align="right" valign="top" width="40%" >' . GetMessage('CLUWIZ_HOST') . '</td>
				<td width="60%" valign="top">' . htmlspecialcharsbx($connection->getHost()) . '</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">' . GetMessage('CLUWIZ_ROOT_USER') . '</td>
				<td valign="top">' . $this->ShowInputField('text', 'root_user', [
					'size' => '30',
				]) . '</td>
			</tr>
			<tr>
				<td nowrap align="right" valign="top">' . GetMessage('CLUWIZ_ROOT_PASSWORD') . '</td>
				<td valign="top">' . $this->ShowInputField('password', 'root_password', [
					'size' => '30',
				]) . '</td>
			</tr>
			</table>
			';
			$this->content .= '<br>' . $this->ShowRadioField('create', 'by_user', [
				'id' => 'create_by_user',
			]) . '<label for="create_by_user">' . GetMessage('CLUWIZ_CREATE_BY_USER') . '</label>';
			$this->content .= '<pre>\c ' . htmlspecialcharsbx($sqlHelper->quote($connection->getDatabase())) . '
CREATE FUNCTION bx_cluster_stat_replication() RETURNS SETOF pg_stat_replication as
$$ select * from pg_stat_replication; $$
LANGUAGE sql SECURITY DEFINER;
REVOKE EXECUTE ON FUNCTION bx_cluster_stat_replication() FROM public;
GRANT EXECUTE ON FUNCTION bx_cluster_stat_replication() to ' . htmlspecialcharsbx($sqlHelper->quote($connection->getLogin())) . ';</pre>';
		}

		if ($isOk)
		{
			$oldNodes = [];
			$nodeList = CClusterDBNode::GetList([], [
				'=ROLE_ID' => 'SLAVE',
			], ['ID', 'DB_HOST']);
			while ($nodeInfo = $nodeList->Fetch())
			{
				$oldNodes[$nodeInfo['DB_HOST']] = $nodeInfo['ID'];
			}

			$newNodes = [];
			while ($nodeInfo = $checkQuery->fetch())
			{
				//Array (
				//[CLIENT_ADDR] => 10.223.223.46
				//[STATE] => streaming
				//[REPLAY_LAG] =>
				//[SYNC_STATE] => async
				//[REPLY_TIME] => Bitrix\Main\Type\DateTime Object ( [value:protected] => DateTime Object ( [date] => 2024-07-25 08:53:47.000000 [timezone_type] => 3 [timezone] => UTC ) [userTimeEnabled:protected] => 1 ) )
				// no rows when slave went offline
				//[STATE] => catchup after startup
				if (!array_key_exists($nodeInfo['CLIENT_ADDR'], $oldNodes))
				{
					$newNodes[] = $nodeInfo;
				}
				else
				{
					unset($oldNodes[$nodeInfo['CLIENT_ADDR']]);
				}
			}

			foreach ($newNodes as $i => $nodeInfo)
			{
				$this->content .= '<br>' . $this->ShowCheckboxField('new_node[' . $i . ']', $nodeInfo['CLIENT_ADDR'], [
					'id' => 'new_node[' . $i . ']',
				]) . '<label for="new_node[' . $i . ']">' . GetMessage('CLUWIZ_NEW_NODE', ['#CLIENT_ADDR#' => $nodeInfo['CLIENT_ADDR']]) . '</label>';
			}

			foreach (array_values($oldNodes) as $i => $nodeId)
			{
				$this->content .= '<br>' . $this->ShowCheckboxField('old_node[' . $i . ']', $nodeId, [
					'id' => 'old_node[' . $i . ']',
				]) . '<label for="old_node[' . $i . ']">' . GetMessage('CLUWIZ_OLD_NODE', ['#NODE_ID#' => $nodeId]) . '</label>';
			}

			if (!$newNodes && !$oldNodes)
			{
				$this->content .= GetMessage('CLUWIZ_ALL_OK') . '<br />';
			}
		}

		if ($isOk)
		{
			$this->SetNextStep('final');
		}
		else
		{
			$this->SetNextStep('step1');
		}
	}

	public function OnPostForm()
	{
		$wizard = $this->GetWizard();
		$connection = \Bitrix\Main\Application::getConnection();

		if ($wizard->IsNextButtonClick() && $wizard->GetNextStepID() === 'step1')
		{
			if ($wizard->GetVar('create') === 'by_wizard')
			{
				$config = [
					'host' => $connection->getHost(),
					'database' => $connection->getDatabase(),
					'login' => $wizard->GetVar('root_user'),
					'password' => $wizard->GetVar('root_password'),
				];
				$conn = new \Bitrix\Main\DB\PgsqlConnection($config);
				try
				{
					$conn->connect();
					//Check connection
					$conn->getVersion();
				}
				catch (\Bitrix\Main\DB\ConnectionException $e)
				{
					$this->SetError(GetMessage('CLUWIZ_ERRROR_CONNECT') . ' ' . $e->getDatabaseMessage());
					return;
				}

				try
				{
					$conn->query('DROP FUNCTION IF EXISTS bx_cluster_stat_replication');
					$conn->query('CREATE FUNCTION public.bx_cluster_stat_replication() RETURNS SETOF pg_stat_replication as $$ select * from pg_stat_replication; $$ LANGUAGE sql SECURITY DEFINER');
					$conn->query('REVOKE EXECUTE ON FUNCTION bx_cluster_stat_replication() FROM public');
					$conn->query('GRANT EXECUTE ON FUNCTION bx_cluster_stat_replication() to ' . $connection->getSqlHelper()->quote($connection->getLogin()));
				}
				catch (\Bitrix\Main\DB\SqlQueryException $e)
				{
					$this->SetError(GetMessage('CLUWIZ_ERROR_CREATE_FUNCTION') . ' ' . $e->getDatabaseMessage());
					return false;
				}
				$wizard->UnSetVar('create');
			}
			elseif ($wizard->GetVar('grant') === 'by_wizard')
			{
				$config = [
					'host' => $connection->getHost(),
					'database' => $connection->getDatabase(),
					'login' => $wizard->GetVar('root_user'),
					'password' => $wizard->GetVar('root_password'),
				];
				$conn = new \Bitrix\Main\DB\PgsqlConnection($config);
				try
				{
					$conn->connect();
					//Check connection
					$conn->getVersion();
				}
				catch (\Bitrix\Main\DB\ConnectionException $e)
				{
					$this->SetError(GetMessage('CLUWIZ_ERRROR_CONNECT') . ' ' . $e->getDatabaseMessage());
					return;
				}

				try
				{
					$conn->query('GRANT EXECUTE ON FUNCTION pg_wal_replay_pause() to ' . $connection->getSqlHelper()->quote($connection->getLogin()));
					$conn->query('GRANT EXECUTE ON FUNCTION pg_wal_replay_resume() to ' . $connection->getSqlHelper()->quote($connection->getLogin()));
				}
				catch (\Bitrix\Main\DB\SqlQueryException $e)
				{
					$this->SetError(GetMessage('CLUWIZ_ERROR_GRANT_REPLICATION') . ' ' . $e->getDatabaseMessage());
					return false;
				}
			}
		}
		elseif ($wizard->IsNextButtonClick() && $wizard->GetNextStepID() === 'final')
		{
			if (is_array($wizard->GetVar('new_node')))
			{
				foreach ($wizard->GetVar('new_node') as $clientAddr)
				{
					if (filter_var($clientAddr, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_IPV6))
					{
						$obNode = new CClusterDBNode;
						$obNode->Add([
							'ACTIVE' => 'Y',
							'ROLE_ID' => 'SLAVE',
							'GROUP_ID' => $wizard->GetVar('group_id'),
							'NAME' => $clientAddr,
							'DESCRIPTION' => false,
							'DB_HOST' => $clientAddr,
							'DB_NAME' => $connection->getDatabase(),
							'DB_LOGIN' => $connection->getLogin(),
							'DB_PASSWORD' => $connection->getPassword(),
							'MASTER_ID' => 1, //TODO: $this->arMaster['ID'],
							//'MASTER_HOST' => $wizard->GetVar('master_host', true),
							//'MASTER_PORT' => $wizard->GetVar('master_port', true),
							'SERVER_ID' => false,
							'STATUS' => 'ONLINE',
							'SELECTABLE' => 'Y',
							'WEIGHT' => 100,
						]);
					}
				}
			}
			if (is_array($wizard->GetVar('old_node')))
			{
				foreach ($wizard->GetVar('old_node') as $nodeId)
				{
					if ($nodeId > 0)
					{
						CClusterDBNode::Delete($nodeId, false);
					}
				}
			}
		}
	}
}


class CPgSqlAddFinalStep extends CWizardStep
{
	public function InitStep()
	{
		parent::InitStep();
		$this->SetTitle(GetMessage('CLUWIZ_FINALSTEP_TITLE'));
		$this->SetStepID('final');
		$this->SetCancelStep('final');
		$this->SetCancelCaption(GetMessage('CLUWIZ_FINALSTEP_BUTTONTITLE'));
	}

	public function ShowStepNoError()
	{
	}

	public function ShowStep()
	{
		$this->content = GetMessage('CLUWIZ_FINALSTEP_CONTENT');
	}
}

class CPgSqlAddCancelStep extends CWizardStep
{
	public function InitStep()
	{
		parent::InitStep();
		$this->SetTitle(GetMessage('CLUWIZ_CANCELSTEP_TITLE'));
		$this->SetStepID('cancel');
		$this->SetCancelStep('cancel');
		$this->SetCancelCaption(GetMessage('CLUWIZ_CANCELSTEP_BUTTONTITLE'));
	}

	public function ShowStepNoError()
	{
	}

	public function ShowStep()
	{
		$this->content = GetMessage('CLUWIZ_CANCELSTEP_CONTENT');
	}
}
