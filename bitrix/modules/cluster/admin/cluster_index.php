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

$message = null;
$sTableID = 'tbl_cluster_group_list';
$lAdmin = new CAdminList($sTableID);

$arHeaders = [
	[
		'id' => 'ID',
		'content' => GetMessage('CLU_INDEX_GROUP_ID'),
		'align' => 'right',
		'default' => true,
	],
	[
		'id' => 'NAME',
		'content' => GetMessage('CLU_INDEX_GROUP_NAME'),
		'align' => 'center',
		'default' => true,
	],
];
$lAdmin->AddHeaders($arHeaders);
$rsData = CClusterGroup::GetList();
$rsData = new CAdminResult($rsData, $sTableID);
while ($arRes = $rsData->Fetch())
{
	$row = & $lAdmin->AddRow($arRes['ID'], $arRes);
	$row->AddViewField('ID', '<a href="cluster_group_edit.php?lang=' . LANGUAGE_ID . '&ID=' . $arRes['ID'] . '">' . $arRes['ID'] . '</a>');
	$arActions = [
		[
			'ICON' => 'edit',
			'DEFAULT' => true,
			'TEXT' => GetMessage('CLU_INDEX_LIST_EDIT'),
			'ACTION' => $lAdmin->ActionRedirect('cluster_group_edit.php?lang=' . LANGUAGE_ID . '&ID=' . $arRes['ID']),
		],
	];
	$row->AddActions($arActions);
}
$aContext = [
	[
		'TEXT' => GetMessage('CLU_INDEX_ADD_GROUP'),
		'TITLE' => GetMessage('CLU_INDEX_ADD_GROUP_TITLE'),
		'LINK' => 'cluster_group_edit.php?lang=' . LANG,
		'ICON' => 'btn_new',
	],
];
$lAdmin->AddAdminContextMenu($aContext, /*$bShowExcel=*/false);
$lAdmin->CheckListMode();
$APPLICATION->SetTitle(GetMessage('CLU_INDEX_TITLE'));
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_admin_after.php';
if ($message)
{
	echo $message->Show();
}
$lAdmin->DisplayList();
require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/epilog_admin.php';
