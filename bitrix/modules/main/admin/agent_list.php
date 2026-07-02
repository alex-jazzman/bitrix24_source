<?php

/**
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @global CDatabase $DB
 */

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';

define('HELP_FILE', 'utilities/agent_list.php');

if (!$USER->CanDoOperation('view_other_settings'))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$isAdmin = $USER->CanDoOperation('edit_php');

IncludeModuleLangFile(__FILE__);

$sTableID = 'tbl_agent_list';
$oSort = new CAdminSorting($sTableID, 'SORT', 'asc');
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = [
	'find',
	'find_type',
	'find_id',
	'find_active',
	'find_module_id',
	'find_is_period',
	'find_user_id',
	'find_name',
	'find_last_exec',
	'find_next_exec',
	'find_is_period',
];

function CheckFilter($filter)
{
	$str = '';
	if (trim($filter['find_last_exec']) != '')
	{
		if (!CheckDateTime($filter['find_last_exec']))
		{
			$str .= GetMessage('MAIN_AGENT_WRONG_LAST_EXEC') . '<br>';
		}
	}

	if (trim($filter['find_next_exec']) != '')
	{
		if (!CheckDateTime($filter['find_next_exec']))
		{
			$str .= GetMessage('MAIN_AGENT_WRONG_NEXT_EXEC') . '<br>';
		}
	}

	if ($str != '')
	{
		global $lAdmin;
		$lAdmin->AddFilterError($str);
		return false;
	}

	return true;
}

$arFilter = [];
$filter = $lAdmin->InitFilter($arFilterFields);

if (CheckFilter($filter))
{
	$arFilter = [
		'ID' => ($filter['find'] != '' && $filter['find_type'] == 'id' ? $filter['find'] : $filter['find_id']),
		'MODULE_ID' => ($filter['find'] != '' && $filter['find_type'] == 'module_id' ? $filter['find'] : $filter['find_module_id']),
		'USER_ID' => ($filter['find'] != '' && $filter['find_type'] == 'user_id' ? $filter['find'] : $filter['find_user_id']),
		'NAME' => ($filter['find'] != '' && $filter['find_type'] == 'name' ? $filter['find'] : $filter['find_name']),
		'ACTIVE' => $filter['find_active'],
		'IS_PERIOD' => $filter['find_is_period'],
		'LAST_EXEC' => $filter['find_last_exec'],
		'NEXT_EXEC' => $filter['find_next_exec'],
	];
}

if ($lAdmin->EditAction() && $isAdmin)
{
	foreach ($_POST['FIELDS'] as $ID => $arFields)
	{
		$ID = intval($ID);

		if (!$lAdmin->IsUpdated($ID))
		{
			continue;
		}

		$APPLICATION->ResetException();

		$DB->StartTransaction();

		if (!CAgent::Update($ID, $arFields))
		{
			$e = $APPLICATION->GetException();
			$lAdmin->AddUpdateError(GetMessage('SAVE_ERROR') . $ID . ': ' . $e->GetString(), $ID);
			$DB->Rollback();
		}
		else
		{
			$DB->Commit();
		}
	}
}

if (($arID = $lAdmin->GroupAction()) && $isAdmin)
{
	if (isset($_REQUEST['action_target']) && $_REQUEST['action_target'] == 'selected')
	{
		$arID = [];
		$rsData = CAgent::GetList([$oSort->getField() => $oSort->getOrder()], $arFilter);
		while ($arRes = $rsData->Fetch())
		{
			$arID[] = $arRes['ID'];
		}
	}

	foreach ($arID as $ID)
	{
		$ID = intval($ID);
		if ($ID <= 0)
		{
			continue;
		}

		switch ($_REQUEST['action'])
		{
			case 'delete':
				if (!CAgent::Delete($ID))
				{
					$lAdmin->AddGroupError(GetMessage('DELETE_ERROR'), $ID);
				}
				break;
			case 'activate':
				CAgent::Update($ID, ['ACTIVE' => 'Y']);
				break;
			case 'deactivate':
				CAgent::Update($ID, ['ACTIVE' => 'N']);
				break;
		}
	}
}

$agentList = CAgent::GetList([$oSort->getField() => $oSort->getOrder()], $arFilter);
$rsData = new CAdminResult($agentList, $sTableID);
$rsData->NavStart();
$lAdmin->NavText($rsData->GetNavPrint(GetMessage('MAIN_AGENT_LIST_PAGE')));
$lAdmin->AddHeaders([
	['id' => 'ID', 'content' => GetMessage('MAIN_AGENT_ID'), 'sort' => 'ID', 'default' => true, 'align' => 'right'],
	['id' => 'MODULE_ID', 'content' => GetMessage('MAIN_AGENT_MODULE_ID'), 'sort' => 'MODULE_ID', 'default' => true],
	['id' => 'USER_ID', 'content' => GetMessage('MAIN_AGENT_USER_ID'), 'sort' => 'USER_ID'],
	['id' => 'SORT', 'content' => GetMessage('MAIN_AGENT_SORT'), 'sort' => 'SORT'],
	['id' => 'NAME', 'content' => GetMessage('MAIN_AGENT_NAME'), 'sort' => 'NAME', 'default' => true],
	['id' => 'ACTIVE', 'content' => GetMessage('MAIN_AGENT_ACTIVE'), 'sort' => 'ACTIVE', 'default' => true],
	['id' => 'LAST_EXEC', 'content' => GetMessage('MAIN_AGENT_LAST_EXEC'), 'sort' => 'LAST_EXEC', 'default' => true],
	['id' => 'NEXT_EXEC', 'content' => GetMessage('MAIN_AGENT_NEXT_EXEC'), 'sort' => 'NEXT_EXEC', 'default' => true],
	['id' => 'AGENT_INTERVAL', 'content' => GetMessage('MAIN_AGENT_INTERVAL'), 'sort' => 'AGENT_INTERVAL', 'default' => true, 'align' => 'right'],
	['id' => 'IS_PERIOD', 'content' => GetMessage('MAIN_AGENT_LIST_PERIODICAL'), 'sort' => 'IS_PERIOD'],
	['id' => 'DATE_CHECK', 'content' => GetMessage('MAIN_AGENT_LIST_DATE_CHECK'), 'sort' => 'DATE_CHECK'],
	['id' => 'RUNNING', 'content' => GetMessage('MAIN_AGENT_LIST_RUNNING')],
	['id' => 'RETRY_COUNT', 'content' => GetMessage('MAIN_AGENT_LIST_RETRY_COUNT')],
]);
while ($db_res = $rsData->Fetch())
{
	$row = $lAdmin->AddRow($db_res['ID'], $db_res);
	$row->AddField('ID', htmlspecialcharsbx($db_res['ID']));
	$row->AddField('MODULE_ID', htmlspecialcharsbx($db_res['MODULE_ID']));
	$row->AddField(
		'USER_ID',
		$db_res['USER_ID'] > 0
			? '<a href="/bitrix/admin/user_edit.php?ID='
				. htmlspecialcharsbx($db_res['USER_ID'])
				. '&lang=' . LANGUAGE_ID
				. '">'
				. '[' . htmlspecialcharsbx($db_res['USER_ID']) . '] '
				. htmlspecialcharsbx($db_res['USER_NAME']) . ' '
				. htmlspecialcharsbx($db_res['LAST_NAME'])
				. ' (' . htmlspecialcharsbx($db_res['LOGIN']) . ')'
				. '</a>'
			: GetMessage('MAIN_AGENT_SYSTEM_USER')
	);
	$row->AddInputField('SORT');
	$row->AddInputField('NAME');
	$row->AddCheckField('ACTIVE');
	$row->AddField('LAST_EXEC', htmlspecialcharsbx($db_res['LAST_EXEC']));
	$row->AddField('NEXT_EXEC', htmlspecialcharsbx($db_res['NEXT_EXEC']));
	$row->AddInputField('AGENT_INTERVAL');
	$row->AddField('IS_PERIOD', ($db_res['IS_PERIOD'] == 'Y' ? GetMessage('MAIN_AGENT_LIST_PERIODICAL_TIME') : GetMessage('MAIN_AGENT_LIST_PERIODICAL_INTERVAL')));
	$row->AddField('DATE_CHECK', htmlspecialcharsbx($db_res['DATE_CHECK']));
	$row->AddField('RUNNING', ($db_res['RUNNING'] == 'Y' ? GetMessage('MAIN_AGENT_ACTIVE_YES') : GetMessage('MAIN_AGENT_ACTIVE_NO')));
	$row->AddField('RETRY_COUNT', htmlspecialcharsbx($db_res['RETRY_COUNT']));

	$arActions = [];
	$arActions[] = [
		'ICON' => 'edit',
		'TEXT' => GetMessage('MAIN_AGENT_EDIT'),
		'ACTION' => $lAdmin->ActionRedirect('agent_edit.php?ID=' . $db_res['ID']),
		'DEFAULT' => true,
	];

	$arActions[] = [
		'ICON' => '',
		'TEXT' => GetMessage('MAIN_AGENT_ACTIVATE'),
		'ACTION' => $lAdmin->ActionDoGroup($db_res['ID'], 'activate'),
	];
	$arActions[] = [
		'ICON' => '',
		'TEXT' => GetMessage('MAIN_AGENT_DEACTIVATE'),
		'ACTION' => $lAdmin->ActionDoGroup($db_res['ID'], 'deactivate'),
	];

	$arActions[] = ['SEPARATOR' => true];
	$arActions[] = [
		'ICON' => 'delete',
		'TEXT' => GetMessage('MAIN_AGENT_DELETE'),
		'ACTION' => "if(confirm('" . GetMessage('MAIN_AGENT_ALERT_DELETE') . "')) " . $lAdmin->ActionDoGroup($db_res['ID'], 'delete'),
	];

	$row->AddActions($arActions);
}

$lAdmin->AddGroupActionTable(
	[
		'delete' => true,
		'activate' => GetMessage('MAIN_AGENT_ACTIVATE'),
		'deactivate' => GetMessage('MAIN_AGENT_DEACTIVATE'),
	]
);
$aContext = [
	[
		'TEXT' => GetMessage('MAIN_AGENT_ADD_AGENT'),
		'LINK' => 'agent_edit.php?lang=' . LANGUAGE_ID,
		'TITLE' => GetMessage('MAIN_AGENT_ADD_AGENT_TITLE'),
		'ICON' => 'btn_new',
	],
];
$lAdmin->AddAdminContextMenu($aContext);

$APPLICATION->SetTitle(GetMessage('MAIN_AGENT_PAGE_TITLE'));
$lAdmin->CheckListMode();

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/prolog_admin_after.php';
?>
	<form name="find_form" method="GET" action="<?= $APPLICATION->GetCurPage() ?>?">
		<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
		<?php
		$oFilter = new CAdminFilter(
			$sTableID . '_filter',
			[
				GetMessage('MAIN_AGENT_FLT_ID'),
				GetMessage('MAIN_AGENT_FLT_MODULE_ID'),
				GetMessage('MAIN_AGENT_FLT_USER_ID'),
				GetMessage('MAIN_AGENT_FLT_NAME'),
				GetMessage('MAIN_AGENT_FLT_ACTIVE'),
				GetMessage('MAIN_AGENT_FLT_LAST_EXEC'),
				GetMessage('MAIN_AGENT_FLT_NEXT_EXEC'),
				GetMessage('MAIN_AGENT_FLT_IS_PERIOD'),
			]
		);

		$oFilter->Begin();
		?>
		<tr>
			<td><b><?= GetMessage('MAIN_AGENT_FLT_SEARCH') ?></b></td>
			<td nowrap>
				<input type="text" size="25" name="find" value="<?= htmlspecialcharsbx($filter['find']) ?>" title="<?= GetMessage('MAIN_AGENT_FLT_SEARCH_TITLE') ?>">
				<select name="find_type">
					<option value="id"<?php
					if ($filter['find_type'] == 'id') echo ' selected' ?>><?= GetMessage('MAIN_AGENT_FLT_ID') ?></option>
					<option value="module_id"<?php
					if ($filter['find_type'] == 'module_id') echo ' selected' ?>><?= GetMessage('MAIN_AGENT_FLT_MODULE_ID') ?></option>
					<option value="user_id"<?php
					if ($filter['find_type'] == 'user_id') echo ' selected' ?>><?= GetMessage('MAIN_AGENT_FLT_USER_ID') ?></option>
					<option value="name"<?php
					if ($filter['find_type'] == 'name') echo ' selected' ?>><?= GetMessage('MAIN_AGENT_FLT_NAME') ?></option>
				</select>
			</td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_ID') ?>:</td>
			<td><input type="text" name="find_id" size="47" value="<?= htmlspecialcharsbx($filter['find_id']) ?>"></td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_MODULE_ID') ?>:</td>
			<td><input type="text" name="find_module_id" size="47" value="<?= htmlspecialcharsbx($filter['find_module_id']) ?>"></td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_USER_ID') ?>:</td>
			<td><input type="text" name="find_user_id" size="47" value="<?= htmlspecialcharsbx($filter['find_user_id']) ?>"></td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_NAME') ?>:</td>
			<td><input type="text" name="find_name" size="47" value="<?= htmlspecialcharsbx($filter['find_name']) ?>">
			</td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_ACTIVE') ?>:</td>
			<td><?php
				$arr = ['reference' => [GetMessage('MAIN_YES'), GetMessage('MAIN_NO')], 'reference_id' => ['Y', 'N']];
				echo SelectBoxFromArray('find_active', $arr, htmlspecialcharsbx($filter['find_active']), GetMessage('MAIN_ALL'));
				?>
			</td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_LAST_EXEC') ?>:</td>
			<td><?= CalendarDate('find_last_exec', htmlspecialcharsbx($filter['find_last_exec']), 'find_form') ?></td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_NEXT_EXEC') ?>:</td>
			<td><?= CalendarDate('find_next_exec', htmlspecialcharsbx($filter['find_next_exec']), 'find_form') ?></td>
		</tr>
		<tr>
			<td><?= GetMessage('MAIN_AGENT_FLT_PERIODICAL1') ?></td>
			<td><?php
				$arr = ['reference' => [GetMessage('MAIN_AGENT_FLT_PERIODICAL_INTERVAL'), GetMessage('MAIN_AGENT_FLT_PERIODICAL_TIME')], 'reference_id' => ['N', 'Y']];
				echo SelectBoxFromArray('find_is_period', $arr, htmlspecialcharsbx($filter['find_is_period']), GetMessage('MAIN_ALL'));
				?>
			</td>
		</tr>

		<?php
		$oFilter->Buttons(['table_id' => $sTableID, 'url' => $APPLICATION->GetCurPage(), 'form' => 'find_form']);
		$oFilter->End();
		?>
	</form>
<?php

$lAdmin->DisplayList();

require $_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/main/include/epilog_admin.php';
