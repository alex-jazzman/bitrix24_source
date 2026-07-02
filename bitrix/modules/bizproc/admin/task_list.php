<?php

require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_admin_before.php");
\Bitrix\Main\Loader::includeModule('bizproc');
require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/bizproc/prolog.php");

IncludeModuleLangFile(__FILE__);

$fatalErrorMessage = "";
$actionErrorMessage = '';

$sTableID = "tbl_bizproc_task_list";

$oSort = new CAdminSorting($sTableID, "ID", "DESC");
$lAdmin = new CAdminList($sTableID, $oSort);

$allowAdminAccess = $USER->IsAdmin();

$arFilterFields = [
	"filter_modified_1",
	"filter_modified_2",
	"filter_name",
	'filter_descr',
	'filter_status',
	'filter_workflow_template_id',
];
if ($allowAdminAccess)
{
	$arFilterFields[] = "filter_user_id";
}

$lAdmin->InitFilter($arFilterFields);

$filterModifiedFrom = (string)($_REQUEST['filter_modified_1'] ?? '');
$filterModifiedTo = (string)($_REQUEST['filter_modified_2'] ?? '');
$filterName = (string)($_REQUEST['filter_name'] ?? '');
$filterDescription = (string)($_REQUEST['filter_descr'] ?? '');
$filterStatus = (string)($_REQUEST['filter_status'] ?? '');
$filterWorkflowTemplateId = (string)($_REQUEST['filter_workflow_template_id'] ?? '');
$filterUserId = (string)($_REQUEST['filter_user_id'] ?? '');

$sortBy = (string)($_REQUEST['by'] ?? 'ID');
$sortOrder = strtoupper((string)($_REQUEST['order'] ?? 'DESC'));
if ($sortOrder !== 'ASC' && $sortOrder !== 'DESC')
{
	$sortOrder = 'DESC';
}

$requestAction = (string)($_REQUEST['action'] ?? '');
$requestIds = (isset($_REQUEST['ID']) && is_array($_REQUEST['ID'])) ? $_REQUEST['ID'] : [];
$delegateTo = (string)($_REQUEST['delegate_to'] ?? '');

$arFilter = ['USER_STATUS' => CBPTaskUserStatus::Waiting];
if (!$allowAdminAccess)
{
	$arFilter["USER_ID"] = $USER->GetID();
}
elseif ($filterUserId)
{
	$arFilter["USER_ID"] = $filterUserId;
}
if ($filterModifiedFrom)
{
	$arFilter[">=MODIFIED"] = $filterModifiedFrom;
}
if ($filterModifiedTo)
{
	$arFilter["<=MODIFIED"] = $filterModifiedTo;
}
if ($filterName)
{
	$arFilter["~NAME"] = "%" . $filterName . "%";
}
if ($filterDescription)
{
	$arFilter["~DESCRIPTION"] = "%" . $filterDescription . "%";
}
if (!empty($filterStatus))
{
	if ($filterStatus === '2')
	{
		unset($arFilter['USER_STATUS']);
	}
	else
	{
		$arFilter['USER_STATUS'] = [CBPTaskUserStatus::Ok, CBPTaskUserStatus::Yes, CBPTaskUserStatus::No, CBPTaskUserStatus::Cancel];
	}
}
if (!empty($filterWorkflowTemplateId))
{
	$arFilter['WORKFLOW_TEMPLATE_ID'] = (int)$filterWorkflowTemplateId;
}

if ($allowAdminAccess && $requestAction !== '' && check_bitrix_sessid())
{
	$ids = $requestIds;
	if ($ids)
	{
		$errors = [];
		$action = $requestAction;
		$status = 0;
		if (str_starts_with($action, 'set_status_'))
		{
			$status = mb_substr($action, mb_strlen('set_status_'));
			$action = 'set_status';
		}

		foreach ($ids as $id)
		{
			[$taskId, $userId] = explode('_', $id);

			if ($action === 'set_status' && $status > 0)
			{
				CBPDocument::setTasksUserStatus($userId, $status, $taskId, $errors);
			}
			elseif ($action === 'delegate' && $delegateTo !== '')
			{
				CBPDocument::delegateTasks($userId, $delegateTo, $taskId, $errors);
			}
		}

		if ($errors)
		{
			foreach ($errors as $error)
			{
				$actionErrorMessage .= $error . PHP_EOL;
			}
		}

		unset($ids, $errors, $action, $status, $taskId, $userId);
	}
}

if ($actionErrorMessage)
{
	$lAdmin->BeginPrologContent();
	CAdminMessage::ShowMessage($actionErrorMessage);
	$lAdmin->EndPrologContent();
}

$arAddHeaders = [
	["id" => "ID", "content" => "ID", "sort" => "ID", "default" => true],
	["id" => "DOCUMENT_NAME", "content" => GetMessage("BPATL_DOCUMENT_NAME"), "default" => false, "sort" => "DOCUMENT_NAME"],
	["id" => "NAME", "content" => GetMessage("BPATL_NAME"), "sort" => "NAME", "default" => true],
	["id" => "DESCRIPTION", "content" => GetMessage("BPATL_DESCR"), "default" => true, "sort" => "DESCRIPTION"],
	["id" => "DESCRIPTION_FULL", "content" => GetMessage("BPATL_DESCR_FULL"), "default" => false, "sort" => "DESCRIPTION"],
	["id" => "MODIFIED", "content" => GetMessage("BPATL_MODIFIED"), "sort" => "MODIFIED", "default" => true],
	["id" => "OVERDUE_DATE", "content" => GetMessage("BPATL_OVERDUE_DATE"), "default" => false, "sort" => "OVERDUE_DATE"],
	["id" => "WORKFLOW_STARTED", "content" => GetMessage("BPATL_STARTED"), "default" => false, "sort" => "WORKFLOW_STARTED"],
	["id" => "WORKFLOW_STARTED_BY", "content" => GetMessage("BPATL_STARTED_BY"), "default" => false, "sort" => "WORKFLOW_STARTED_BY"],
	["id" => "WORKFLOW_NAME", "content" => GetMessage("BPATL_WORKFLOW_NAME"), "default" => true, "sort" => "WORKFLOW_TEMPLATE_NAME"],
	["id" => "WORKFLOW_STATE", "content" => GetMessage("BPATL_WORKFLOW_STATE"), "default" => true, "sort" => "WORKFLOW_STATE"],
];
if ($allowAdminAccess)
{
	$arAddHeaders[] = ["id" => "USER", "content" => GetMessage("BPATL_USER"), "default" => true, "sort" => "USER_ID"];
}

$lAdmin->AddHeaders($arAddHeaders);

$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();

$arSelectFields = ["ID", "WORKFLOW_ID", "ACTIVITY", "ACTIVITY_NAME", "MODIFIED", "OVERDUE_DATE", "NAME", "DESCRIPTION", "PARAMETERS", 'DOCUMENT_NAME', 'WORKFLOW_STARTED', 'WORKFLOW_STARTED_BY', 'OVERDUE_DATE', 'WORKFLOW_TEMPLATE_NAME', 'WORKFLOW_STATE'];
if ($allowAdminAccess && in_array("USER", $arVisibleColumns))
{
	$arSelectFields[] = "USER_ID";
}

$navParams = [
	'nPageSize' => CAdminResult::GetNavSize($sTableID),
	'bShowAll' => false,
];
$dbResultList = CBPTaskService::GetList(
	[$sortBy => $sortOrder],
	$arFilter,
	false,
	$navParams,
	$arSelectFields
);

$dbResultList = new CAdminResult($dbResultList, $sTableID);
$dbResultList->NavStart();

$lAdmin->NavText($dbResultList->GetNavPrint(GetMessage("BPATL_NAV")));

while ($arResultItem = $dbResultList->NavNext(true, "f_"))
{
	$row =& $lAdmin->AddRow($f_ID . '_' . $f_USER_ID, $arResultItem);

	$s = $allowAdminAccess ? "&uid=" . (int)$arResultItem["USER_ID"] : "";
	$row->AddField(
		"ID",
		'<a href="bizproc_task.php?id=' . $f_ID . $s . '&back_url=' . urlencode($APPLICATION->GetCurPageParam("lang=" . LANGUAGE_ID, ["lang"])) . '" title="' . GetMessage("BPATL_VIEW_MSGVER_1") . '">' . $f_ID . '</a>'
	);
	$row->AddField("NAME", $f_NAME);

	$description = $f_DESCRIPTION;
	if (mb_strlen($description) > 100)
	{
		$description = mb_substr($description, 0, 97) . "...";
	}

	$row->AddField("DESCRIPTION", $description);
	$row->AddField("DESCRIPTION_FULL", $f_DESCRIPTION);
	$row->AddField("MODIFIED", $f_MODIFIED);
	$row->AddField("WORKFLOW_NAME", $f_WORKFLOW_TEMPLATE_NAME);
	$row->AddField("WORKFLOW_STATE", $f_WORKFLOW_STATE);
	$row->AddField("WORKFLOW_STARTED", FormatDateFromDB($f_WORKFLOW_STARTED));

	if ((int)($f_STARTED_BY ?? 0) > 0)
	{
		$dbUserTmp = CUser::GetByID($f_STARTED_BY);
		$arUserTmp = $dbUserTmp->fetch();
		$row->AddField("WORKFLOW_STARTED_BY",
			CUser::FormatName(COption::GetOptionString("bizproc", "name_template", CSite::GetNameFormat(false), SITE_ID), $arUserTmp, true)
			. " [" . $f_STARTED_BY . "]"
		);
	}

	if (in_array("USER", $arVisibleColumns))
	{
		$dbUserTmp = CUser::GetByID($arResultItem["USER_ID"]);
		if ($arUserTmp = $dbUserTmp->GetNext())
		{
			$str = CUser::FormatName(COption::GetOptionString("bizproc", "name_template", CSite::GetNameFormat(false), SITE_ID), $arUserTmp, true);
			$str .= " [" . $arResultItem["USER_ID"] . "]";
		}
		else
		{
			$str = str_replace("#USER_ID#", $arResultItem["USER_ID"], GetMessage("BPATL_USER_NOT_FOUND"));
		}
		$row->AddField("USER", $str);
	}

	$arActions = [];
	$arActions[] = [
		"ICON" => "edit",
		"TEXT" => GetMessage("BPATL_VIEW_MSGVER_1"),
		"ACTION" => $lAdmin->ActionRedirect('bizproc_task.php?id=' . $f_ID . $s . '&back_url=' . urlencode($APPLICATION->GetCurPageParam("lang=" . LANGUAGE_ID, ["lang"]))),
		"DEFAULT" => true,
	];

	$row->AddActions($arActions);
}

$lAdmin->AddFooter(
	[
		[
			"title" => GetMessage("MAIN_ADMIN_LIST_SELECTED"),
			"value" => $dbResultList->SelectedRowsCount(),
		],
		[
			"counter" => true,
			"title" => GetMessage("MAIN_ADMIN_LIST_CHECKED"),
			"value" => "0",
		],
	]
);

if ($allowAdminAccess && isset($arFilter['USER_STATUS']) && empty($arFilter['USER_STATUS']))
{
	$lAdmin->AddGroupActionTable(
		[
			'set_status_' . CBPTaskUserStatus::Yes => GetMessage("BPATL_GROUP_ACTION_YES"),
			'set_status_' . CBPTaskUserStatus::No => GetMessage("BPATL_GROUP_ACTION_NO"),
			'set_status_' . CBPTaskUserStatus::Ok => GetMessage("BPATL_GROUP_ACTION_OK"),
			'delegate' => GetMessage('BPATL_GROUP_ACTION_DELEGATE'),
			'delegate_dialog' => [
				'type' => 'html',
				'value' => '<div id="action_delegate_to" style="display:none">
					<input type="text" name="delegate_to" size="3" name=""/>
					<input type="button" OnClick="window.open(\'/bitrix/admin/user_search.php?lang='
					. LANGUAGE_ID . '&FN=form_' . $sTableID . '&FC=delegate_to\',
					\'\', \'scrollbars=yes,resizable=yes,width=760,height=500,top=\'+Math.floor((screen.height - 560)/2-14)
					+\',left=\'+Math.floor((screen.width - 760)/2-5));" value=" ... "></div>',
			],
		],
		[
			'select_onchange' => 'BX("action_delegate_to").style.display = (this.value == "delegate"? "block":"none");',
			'disable_action_target' => true,
		]
	);
}

if (($bizprocModulePermissions ?? '') >= "W")
{
	$aContext = [
		//		array(
		//			"TEXT" => GetMessage("SONET_ADD_NEW"),
		//			"ICON" => "btn_new",
		//			"LINK" => "socnet_subject_edit.php?lang=".LANG,
		//			"TITLE" => GetMessage("SONET_ADD_NEW_ALT")
		//		),
	];
	$lAdmin->AddAdminContextMenu($aContext);
}

$lAdmin->AddAdminContextMenu([], false);
$lAdmin->CheckListMode();

/****************************************************************************/
/***********  MAIN PAGE  ****************************************************/
/****************************************************************************/
$APPLICATION->SetTitle(GetMessage("BPATL_TITLE_1"));
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_admin_after.php");
?>
	<form name="find_form" method="GET" action="<?= $APPLICATION->GetCurPage() ?>?">

		<?php
		$ar = [
			GetMessage("BPATL_F_MODIFIED"),
			GetMessage("BPATL_F_NAME"),
			GetMessage("BPATL_DESCR"),
			GetMessage("BPATL_FILTER_STATUS"),
			GetMessage("BPATL_WORKFLOW_NAME"),
		];
		if ($allowAdminAccess)
		{
			$ar[] = GetMessage("BPATL_USER_ID");
		}

		$oFilter = new CAdminFilter(
			$sTableID . "_filter",
			$ar
		);

		$oFilter->SetDefaultRows(["filter_modified_1", 'filter_name']);
		$oFilter->AddPreset([
			"ID" => "filter_running",
			"NAME" => GetMessage("BPATL_FILTER_STATUS_RUNNING_1"),
			"FIELDS" => ["filter_status" => 0],
		]);
		$oFilter->AddPreset([
			"ID" => "filter_complete",
			"NAME" => GetMessage("BPATL_FILTER_STATUS_COMPLETE_1"),
			"FIELDS" => ["filter_status" => 1],
		]);
		$oFilter->AddPreset([
			"ID" => "filter_all",
			"NAME" => GetMessage("BPATL_FILTER_STATUS_ALL"),
			"FIELDS" => ["filter_status" => 2],
		]);

		$oFilter->Begin();
		?>
		<tr>
			<td><?= GetMessage("BPATL_F_MODIFIED") ?>:</td>
			<td><?= CalendarPeriod("filter_modified_1", htmlspecialcharsbx($filterModifiedFrom), "filter_modified_2", htmlspecialcharsbx($filterModifiedTo), "find_form", "Y") ?></td>
		</tr>
		<tr>
			<td><?= GetMessage("BPATL_F_NAME") ?>:</td>
			<td><input type="text" name="filter_name" value="<?= htmlspecialcharsex($filterName) ?>" size="30">
			</td>
		</tr>
		<tr>
			<td><?= GetMessage("BPATL_DESCR") ?>:</td>
			<td><input type="text" name="filter_descr" value="<?= htmlspecialcharsex($filterDescription) ?>" size="30">
			</td>
		</tr>
		<tr>
			<td><?= GetMessage("BPATL_FILTER_STATUS") ?>:</td>
			<td>
				<select name="filter_status">
					<option value="0"<?php
					if ($filterStatus === "0")
					{
						echo " selected";
					} ?>><?= GetMessage("BPATL_FILTER_STATUS_RUNNING_1") ?></option>
					<option value="1"<?php
					if ($filterStatus === "1")
					{
						echo " selected";
					} ?>><?= GetMessage("BPATL_FILTER_STATUS_COMPLETE_1") ?></option>
					<option value="2"<?php
					if ($filterStatus === "2")
					{
						echo " selected";
					} ?>><?= GetMessage("BPATL_FILTER_STATUS_ALL") ?></option>
				</select>
			</td>
		</tr>
		<tr>
			<td><?= GetMessage("BPATL_WORKFLOW_NAME") ?>:</td>
			<td>
				<select name="filter_workflow_template_id">
					<option value=""><?= GetMessage("BPATL_FILTER_STATUS_ALL") ?></option>
					<?php
					$dbResTmp = CBPTaskService::GetList(
						["WORKFLOW_TEMPLATE_NAME" => "ASC"],
						[],
						["WORKFLOW_TEMPLATE_TEMPLATE_ID", "WORKFLOW_TEMPLATE_NAME"],
						false,
						["WORKFLOW_TEMPLATE_TEMPLATE_ID", "WORKFLOW_TEMPLATE_NAME"]
					);
					while ($arResTmp = $dbResTmp->GetNext()):?>
						<option value="<?= $arResTmp["WORKFLOW_TEMPLATE_TEMPLATE_ID"] ?>"><?= $arResTmp["WORKFLOW_TEMPLATE_NAME"] ?></option>
					<?php
					endwhile; ?>
				</select>
			</td>
		</tr>

		<?php
		if ($allowAdminAccess)
		{
			?>
			<tr>
			<td><?= GetMessage("BPATL_USER_ID") ?>:</td>
			<td><?= FindUserID(
					"filter_user_id",
					$filterUserId,
					"",
					"find_form",
					"5",
					"",
					" ... ",
					"",
					""
				) ?>
			</td>
			</tr><?php
		}
		$oFilter->Buttons(
			[
				"table_id" => $sTableID,
				"url" => $APPLICATION->GetCurPage(),
				"form" => "find_form",
			]
		);
		$oFilter->End();
		?>
	</form>

<?php
$lAdmin->DisplayList();
require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/epilog_admin.php");
