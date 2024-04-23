<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
/** @global CUser $USER */
global $USER;
/** @global CMain $APPLICATION */
global $APPLICATION;
/** @global CDatabase $DB */
global $DB;
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php';

IncludeModuleLangFile(__FILE__);

if (!$USER->isAdmin())
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$message = null;
$sTableID = 'tbl_cluster_dbnode_list';
$oSort = new CAdminSorting($sTableID, 'ID', 'ASC');
$lAdmin = new CAdminList($sTableID, $oSort);

if ($arID = $lAdmin->GroupAction())
{
	foreach ( $arID as $ID)
	{
		if ($ID == '')
		{
			continue;
		}

		$ID = intval($ID);
		switch ($_REQUEST['action'])
		{
		case 'delete':
			$arNode = CClusterDBNode::GetByID($ID);
			if (is_array($arNode) && $arNode['ROLE_ID'] == 'MODULE' && $arNode['STATUS'] == 'READY')
			{
				CClusterDBNode::Delete($arNode['ID'], false);
			}
			break;
		}
	}
}

$arHeaders = [
	[
		'id' => 'ID',
		'content' => GetMessage('CLU_DBNODE_LIST_ID'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'FLAG',
		'content' => GetMessage('CLU_DBNODE_LIST_FLAG'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'ACTIVE',
		'content' => GetMessage('CLU_DBNODE_LIST_ACTIVE'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'STATUS',
		'content' => GetMessage('CLU_DBNODE_LIST_STATUS'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'NAME',
		'content' => GetMessage('CLU_DBNODE_LIST_NAME'),
		'align' => 'left',
		'default' => true,
	],
	[
		'id' => 'MODULES',
		'content' => GetMessage('CLU_DBNODE_LIST_MODULES'),
		'align' => 'left',
		'default' => true,
	],
	[
		'id' => 'DESCRIPTION',
		'content' => GetMessage('CLU_DBNODE_LIST_DESCRIPTION'),
		'align' => 'left',
		'default' => false,
	],
	[
		'id' => 'DB_HOST',
		'content' => GetMessage('CLU_DBNODE_LIST_DB_HOST'),
		'align' => 'left',
		'default' => false,
	],
	[
		'id' => 'DB_NAME',
		'content' => GetMessage('CLU_DBNODE_LIST_DB_NAME'),
		'align' => 'left',
		'default' => false,
	],
	[
		'id' => 'DB_LOGIN',
		'content' => GetMessage('CLU_DBNODE_LIST_DB_LOGIN'),
		'align' => 'left',
		'default' => false,
	],
];

$lAdmin->AddHeaders($arHeaders);

$strUptimeError = '';
$rsData = CClusterDBNode::GetList(
	[//Order
		'ID' => 'ASC',
	]
	,[//Filter
		'=ROLE_ID' => ['MAIN', 'MODULE'],
		'=MASTER_ID' => false,
	]
);

$rsData = new CAdminResult($rsData, $sTableID);

while ($arRes = $rsData->Fetch()):
	$row =& $lAdmin->AddRow($arRes['ID'], $arRes);
	$uptime = CClusterDBNode::GetUpTime($arRes['ID']);
	$arModules = CClusterDBNode::GetModules($arRes['ID']);

	if ($arRes['ACTIVE'] == 'Y')
	{
		if ($arRes['STATUS'] == 'OFFLINE' && $uptime !== false)
		{
			CClusterDBNode::SetOnline($arRes['ID']);
			$arRes['STATUS'] = 'ONLINE';
		}
		elseif ($arRes['STATUS'] == 'ONLINE' && count($arModules) == 0 && $arRes['ROLE_ID'] == 'MODULE')
		{
			$ob = new CClusterDBNode;
			$ob->Update($arRes['ID'], ['STATUS' => 'READY']);
			$arRes['STATUS'] = 'READY';
		}
		elseif ($arRes['STATUS'] == 'READY' && count($arModules) > 0)
		{
			$ob = new CClusterDBNode;
			$ob->Update($arRes['ID'], ['STATUS' => 'ONLINE']);
			$arRes['STATUS'] = 'ONLINE';
		}
		elseif ($arRes['STATUS'] == 'READY' && $arRes['ROLE_ID'] == 'MAIN')
		{
			$ob = new CClusterDBNode;
			$ob->Update($arRes['ID'], ['STATUS' => 'ONLINE']);
			$arRes['STATUS'] = 'ONLINE';
		}
	}

	if ($arRes['ID'] > 1)
	{
		$row->AddViewField('ID', '<a href="cluster_dbnode_edit.php?lang=' . LANGUAGE_ID . '&ID=' . $arRes['ID'] . '">' . $arRes['ID'] . '</a>');
	}

	if ($arRes['ACTIVE'] == 'Y' && $arRes['STATUS'] == 'ONLINE')
	{
		$htmlFLAG = '<div class="lamp-green"></div>';
	}
	else
	{
		$htmlFLAG = '<div class="lamp-red"></div>';
	}

	if ($uptime === false)
	{
		$htmlFLAG .= GetMessage('CLU_DBNODE_NOCONNECTION');
	}
	elseif ($uptime > 0)
	{
		$htmlFLAG .= GetMessage('CLU_DBNODE_UPTIME') . '<br>' . FormatDate([
			's' => 'sdiff',
			'i' => 'idiff',
			'H' => 'Hdiff',
			'' => 'ddiff',
		], time() - $uptime);
	}
	else
	{
		$strUptimeError = $uptime;
		$htmlFLAG .= GetMessage('CLU_DBNODE_UPTIME') . '<br>' . GetMessage('CLU_DBNODE_UPTIME_UNKNOWN') . '<span class="required"><sup>1</sup></span>';
	}

	$row->AddViewField('FLAG', $htmlFLAG);

	if ($arRes['ACTIVE'] == 'Y')
	{
		$row->AddViewField('ACTIVE', GetMessage('MAIN_YES'));
	}
	else
	{
		$row->AddViewField('ACTIVE', GetMessage('MAIN_NO'));
	}

	$row->AddViewField('MODULES', implode('<br>', $arModules));

	$arActions = [];
	if ($arRes['ROLE_ID'] == 'MODULE')
	{
		$arActions[] = [
			'ICON' => 'edit',
			'DEFAULT' => true,
			'TEXT' => GetMessage('CLU_DBNODE_LIST_EDIT'),
			'ACTION' => $lAdmin->ActionRedirect('cluster_dbnode_edit.php?lang=' . LANGUAGE_ID . '&ID=' . $arRes['ID'])
		];
	}
	if ($arRes['ROLE_ID'] == 'MODULE')
	{
		if ($arRes['STATUS'] == 'READY')
		{
			if ($DB->type === 'MYSQL')
			{
				$arActions[] = [
					'TEXT' => GetMessage('CLU_DBNODE_LIST_START_USING_DB'),
					'ACTION' => "javascript:WizardWindow.Open('bitrix:cluster.module_move','" . bitrix_sessid() . '&__wiz_node_id=' . $arRes['ID'] . '&__wiz_status=' . $arRes['STATUS'] . "')",
				];
			}

			$arActions[] = [
				'ICON' => 'delete',
				'TEXT' => GetMessage('CLU_DBNODE_LIST_DELETE'),
				'ACTION' => "if(confirm('" . GetMessage('CLU_DBNODE_LIST_DELETE_CONF') . "')) " . $lAdmin->ActionDoGroup($arRes['ID'], 'delete')
			];
		}
		elseif ($arRes['STATUS'] == 'ONLINE')
		{
			if ($DB->type === 'MYSQL')
			{
				$arActions[] = [
					'TEXT' => GetMessage('CLU_DBNODE_LIST_STOP_USING_DB'),
					'ACTION' => "javascript:WizardWindow.Open('bitrix:cluster.module_move','" . bitrix_sessid() . '&__wiz_node_id=' . $arRes['ID'] . '&__wiz_status=' . $arRes['STATUS'] . "')",
				];
			}
		}
	}
	if (!empty($arActions))
	{
		$row->AddActions($arActions);
	}
endwhile;

if ($strUptimeError)
{
	$lAdmin->BeginEpilogContent();
	echo BeginNote(), '<span class="required"><sup>1</sup></span>', $strUptimeError, EndNote();
	$lAdmin->EndEpilogContent();
}

$lAdmin->AddFooter(
	[
		[
			'title' => GetMessage('MAIN_ADMIN_LIST_SELECTED'),
			'value' => $rsData->SelectedRowsCount(),
		],
		[
			'counter' => true,
			'title' => GetMessage('MAIN_ADMIN_LIST_CHECKED'),
			'value' => '0',
		],
	]
);

if ($DB->type === 'MYSQL')
{
	$link = "javascript:WizardWindow.Open('bitrix:cluster.dbnode_add','" . bitrix_sessid() . "')";
	$title = GetMessage('CLU_DBNODE_LIST_ADD_TITLE1');
}
else
{
	$link = '/bitrix/admin/cluster_dbnode_edit.php?lang=' . LANGUAGE_ID;
	$title = GetMessage('CLU_DBNODE_LIST_ADD_TITLE2');
}

$aContext = [
	[
		'TEXT' => GetMessage('CLU_DBNODE_LIST_ADD'),
		'LINK' => $link,
		'TITLE' => $title,
		'ICON' => 'btn_new',
	],
	[
		'TEXT' => GetMessage('CLU_DBNODE_LIST_REFRESH'),
		'LINK' => 'cluster_dbnode_list.php?lang=' . LANGUAGE_ID,
	],
];

$lAdmin->AddAdminContextMenu($aContext, /*$bShowExcel=*/false);

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage('CLU_DBNODE_LIST_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

if ($message)
{
	echo $message->Show();
}
$lAdmin->DisplayList();

$htmlModules = '<ul style="font-size:100%">';
foreach (GetModuleEvents('cluster', 'OnGetTableList', true) as $arEvent)
{
	$ar = ExecuteModuleEventEx($arEvent);
	if (is_array($ar))
	{
		$htmlModules .= '<li>' . $ar['MODULE']->MODULE_NAME;
	}
}
$htmlModules .= '</ul>';

echo BeginNote(), GetMessage('CLU_DBNODE_LIST_NOTE1'), $htmlModules, GetMessage('CLU_DBNODE_LIST_NOTE2'), EndNote();

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
