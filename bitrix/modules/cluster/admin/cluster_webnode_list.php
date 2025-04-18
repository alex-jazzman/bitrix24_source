<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_before.php';
/** @global CUser $USER */
global $USER;
/** @global CMain $APPLICATION */
global $APPLICATION;
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/cluster/prolog.php';
IncludeModuleLangFile(__FILE__);

if (!$USER->isAdmin())
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$group_id = intval($_GET['group_id']);
if (!CClusterGroup::GetArrayByID($group_id))
{
	$APPLICATION->AuthForm(GetMessage('ACCESS_DENIED'));
}

$sTableID = 'tbl_cluster_webnode_list';
$oSort = new CAdminSorting($sTableID, 'ID', 'ASC');
$lAdmin = new CAdminList($sTableID, $oSort);

if ($arID = $lAdmin->GroupAction())
{
	foreach ($arID as $ID)
	{
		if ($ID == '')
		{
			continue;
		}
		$ID = intval($ID);
		if ($_REQUEST['action'] === 'delete')
		{
			CClusterWebNode::Delete($ID);
			break;
		}
	}
}

$arHeaders = [
	[
		'id' => 'ID',
		'content' => GetMessage('CLU_WEBNODE_LIST_ID'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'FLAG',
		'content' => GetMessage('CLU_WEBNODE_LIST_FLAG'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'STATUS',
		'content' => GetMessage('CLU_WEBNODE_LIST_STATUS'),
		'align' => 'center',
		'default' => true,
	],
	[
		'id' => 'NAME',
		'content' => GetMessage('CLU_WEBNODE_LIST_NAME'),
		'align' => 'left',
		'default' => true,
	],
	[
		'id' => 'HOST',
		'content' => GetMessage('CLU_WEBNODE_LIST_HOST'),
		'align' => 'left',
		'default' => true,
	],
	[
		'id' => 'STATUS_URL',
		'content' => GetMessage('CLU_WEBNODE_LIST_STATUS_URL'),
		'align' => 'left',
		'default' => false,
	],
	[
		'id' => 'DESCRIPTION',
		'content' => GetMessage('CLU_WEBNODE_LIST_DESCRIPTION'),
		'align' => 'left',
		'default' => false,
	],
];

$lAdmin->AddHeaders($arHeaders);

$rsData = CClusterWebNode::GetList(
	[
		'ID' => 'ASC',
	],
	[
		'=GROUP_ID' => $group_id,
	]
);

$rsData = new CAdminResult($rsData, $sTableID);

while ($arRes = $rsData->Fetch()):
	$row = $lAdmin->AddRow($arRes['ID'], $arRes);

	$uptime = false;
	$RestartTime = '';
	$CurrentTime = '';
	$arStatus = CClusterWebNode::GetStatus($arRes['HOST'], $arRes['PORT'], $arRes['STATUS_URL']);

	if (is_array($arStatus))
	{
		$html = '<table width="100%">';
		foreach ($arStatus as $key => $value)
		{
			if ($key == 'Restart Time')
			{
				$RestartTime = CClusterWebNode::ParseDateTime($value);
			}
			elseif ($key == 'Current Time')
			{
				$CurrentTime = CClusterWebNode::ParseDateTime($value);
			}
			else
			{
				$html .= '
				<tr>
					<td width="50%" align=right>' . $key . ':</td>
					<td align=left>' . $value . '</td>
				</tr>
				';
			}
		}
		$html .= '</table>';
	}
	else
	{
		$html = GetMessage('CLU_WEBNODE_STATUS_ERROR');
		$html .= '<br>[' . CClusterWebNode::$errno . '] ' . htmlspecialcharsEx(CClusterWebNode::$errstr);
	}
	$row->AddViewField('STATUS', $html);

	if ($arRes['ID'] > 1)
	{
		$row->AddViewField('ID', '<a href="cluster_webnode_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $arRes['ID'] . '">' . $arRes['ID'] . '</a>');
	}

	if (is_array($arStatus))
	{
		$htmlFLAG = '<span class="adm-lamp adm-lamp-in-list adm-lamp-green"></span>';
	}
	else
	{
		$htmlFLAG = '<span class="adm-lamp adm-lamp-in-list adm-lamp-red"></span>';
	}

	if ($RestartTime && $CurrentTime)
	{
		$uptime = $CurrentTime - $RestartTime;
	}

	if ($uptime === false)
	{
		$htmlFLAG .= GetMessage('CLU_WEBNODE_NOCONNECTION');
	}
	else
	{
		$htmlFLAG .= GetMessage('CLU_WEBNODE_UPTIME') . '<br>' . FormatDate([
			's' => 'sdiff',
			'i' => 'idiff',
			'H' => 'Hdiff',
			'' => 'ddiff',
		], time() - $uptime);
	}

	$row->AddViewField('FLAG', $htmlFLAG);

	$arActions = [];
	$arActions[] = [
		'ICON' => 'edit',
		'DEFAULT' => true,
		'TEXT' => GetMessage('CLU_WEBNODE_LIST_EDIT'),
		'ACTION' => $lAdmin->ActionRedirect('cluster_webnode_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id . '&ID=' . $arRes['ID'])
	];
	$arActions[] = [
		'ICON' => 'delete',
		'TEXT' => GetMessage('CLU_WEBNODE_LIST_DELETE'),
		'ACTION' => "if(confirm('" . GetMessage('CLU_WEBNODE_LIST_DELETE_CONF') . "')) " . $lAdmin->ActionDoGroup($arRes['ID'], 'delete', 'group_id=' . $group_id)
	];

	if (!empty($arActions))
	{
		$row->AddActions($arActions);
	}
endwhile;

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

$aContext = [
	[
		'TEXT' => GetMessage('CLU_WEBNODE_LIST_ADD'),
		'LINK' => '/bitrix/admin/cluster_webnode_edit.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
		'TITLE' => GetMessage('CLU_WEBNODE_LIST_ADD_TITLE'),
		'ICON' => 'btn_new',
	],
	[
		'TEXT' => GetMessage('CLU_WEBNODE_LIST_REFRESH'),
		'LINK' => 'cluster_webnode_list.php?lang=' . LANGUAGE_ID . '&group_id=' . $group_id,
	],
];

$lAdmin->AddAdminContextMenu($aContext, /*$bShowExcel=*/false);

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage('CLU_WEBNODE_LIST_TITLE'));

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';

$lAdmin->DisplayList();
echo BeginNote(), GetMessage('CLU_WEBNODE_LIST_NOTE'), EndNote();
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
