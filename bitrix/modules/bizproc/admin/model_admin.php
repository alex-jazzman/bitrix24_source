<?php

require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_admin_before.php");

if (!\Bitrix\Main\Loader::includeModule("bizproc"))
{
	echo "Module is not available";
	require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/epilog_admin.php");
	die();
}

require_once($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/bizproc/prolog.php");

IncludeModuleLangFile(__FILE__);

$tableId = "tbl_model_admin";

$adminSorting = new CAdminSorting($tableId, "TIMESTAMP_X", "desc");

$context = \Bitrix\Main\Application::getInstance()->getContext();
/** @var \Bitrix\Main\HttpRequest $request */
$request = $context->getRequest();

$type = (string)($_REQUEST['type'] ?? '');
$isAdminMode = ((string)($_REQUEST['admin'] ?? '') === 'Y');
$requestAction = (string)($_REQUEST['action'] ?? '');
$requestActionTarget = (string)($_REQUEST['action_target'] ?? '');
$fields = (isset($_REQUEST['FIELDS']) && is_array($_REQUEST['FIELDS'])) ? $_REQUEST['FIELDS'] : [];

$orderBy = [];
if ($request->get("by") !== null)
{
	$orderBy[$request->get("by")] = $request->get("order");
}
if ($request->get("by") === null || $request->get("by") !== "ID")
{
	$orderBy["ID"] = "ASC";
}

$adminList = new CAdminList($tableId, $adminSorting);

$filterFields = [
	"ID" => "find_id",
	"?NAME" => "find_name",
	"LID" => "find_lang",
	"ACTIVE" => "find_active",
	"?CODE" => "find_code",
];

$filterValues = $adminList->InitFilter(array_values($filterFields));

$findId = (string)($_REQUEST['find_id'] ?? '');
$findName = (string)($_REQUEST['find_name'] ?? '');
$findLang = (string)($_REQUEST['find_lang'] ?? '');
$findActive = (string)($_REQUEST['find_active'] ?? '');
$findCode = (string)($_REQUEST['find_code'] ?? '');

$filter = [];
if ($findId !== '')
{
	$filter['ID'] = $findId;
}
if ($findName !== '')
{
	$filter['?NAME'] = $findName;
}
if ($findLang !== '')
{
	$filter['LID'] = $findLang;
}
if ($findActive !== '')
{
	$filter['ACTIVE'] = $findActive;
}
if ($findCode !== '')
{
	$filter['?CODE'] = $findCode;
}

if ($adminList->EditAction())
{
	foreach ($fields as $ID => $arFields)
	{
		$ID = (int)$ID;

		if (!$adminList->IsUpdated($ID))
		{
			continue;
		}

		if (!CIBlockRights::UserHasRightTo($ID, $ID, "iblock_edit"))
		{
			continue;
		}

		$DB->StartTransaction();

		$ib = new CIBlock;
		if ($ib->Update($ID, $arFields))
		{
			$DB->Commit();
		}
		else
		{
			$adminList->AddUpdateError(GetMessage("IBLOCK_ADM_SAVE_ERROR", ["#ID#" => $ID, "#ERROR_TEXT#" => $ib->LAST_ERROR]), $ID);
			$DB->Rollback();
		}
	}
}

if ($arID = $adminList->GroupAction())
{
	if ($requestActionTarget === 'selected')
	{
		$rsIBlocks = CIBlock::GetList($orderBy, $filter);
		while ($arRes = $rsIBlocks->Fetch())
		{
			$arID[] = $arRes['ID'];
		}
	}

	foreach ($arID as $ID)
	{
		if (!$ID)
		{
			continue;
		}

		switch ($requestAction)
		{
			case "delete":
				if (!CIBlockRights::UserHasRightTo($ID, $ID, "iblock_delete"))
				{
					break;
				}
				@set_time_limit(0);
				$DB->StartTransaction();
				$rsIBlock = CIBlock::GetByID($ID);
				$arIBlock = $rsIBlock->GetNext();
				if (!CIBlock::Delete($ID))
				{
					$DB->Rollback();
					$adminList->AddGroupError(GetMessage("IBLOCK_ADM_DELETE_ERROR"), $ID);
				}
				else
				{
					if (COption::GetOptionString("iblock", "event_log_iblock", "N") === "Y")
					{
						$resLog["NAME"] = $arIBlock["NAME"];
						CEventLog::Log(
							"IBLOCK",
							"IBLOCK_DELETE",
							"iblock",
							$ID,
							serialize($resLog)
						);
					}
					$DB->Commit();
				}
				break;
			case "activate":
			case "deactivate":
				if (!CIBlockRights::UserHasRightTo($ID, $ID, "iblock_delete"))
				{
					break;
				}
				$ob = new CIBlock();
				$arFields = ["ACTIVE" => ($requestAction === "activate" ? "Y" : "N")];
				if (!$ob->Update($ID, $arFields))
				{
					$adminList->AddGroupError(GetMessage("IBLOCK_ADM_UPD_ERROR") . $ob->LAST_ERROR, $ID);
				}

				break;
		}
	}
}

$arHeader = [
	[
		"id" => "NAME",
		"content" => GetMessage("IBLOCK_ADM_NAME"),
		"sort" => "name",
		"default" => true,
	],
	[
		"id" => "SORT",
		"content" => GetMessage("IBLOCK_ADM_SORT"),
		"sort" => "sort",
		"default" => true,
		"align" => "right",
	],
	[
		"id" => "ACTIVE",
		"content" => GetMessage("IBLOCK_ADM_ACTIVE"),
		"sort" => "active",
		"default" => true,
		"align" => "center",
	],
	[
		"id" => "CODE",
		"content" => GetMessage("IBLOCK_FIELD_CODE"),
		"sort" => "code",
	],
	[
		"id" => "LIST_PAGE_URL",
		"content" => GetMessage("IBLOCK_ADM_HEADER_LIST_URL"),
	],
	[
		"id" => "DETAIL_PAGE_URL",
		"content" => GetMessage("IBLOCK_ADM_HEADER_DETAIL_URL"),
	],
	[
		"id" => "ELEMENT_CNT",
		"content" => GetMessage("IBLOCK_ADM_HEADER_EL"),
		"default" => true,
		"align" => "right",
	],
];

if ($arIBTYPE["SECTIONS"] === "Y")
{
	$arHeader[] = [
		"id" => "SECTION_CNT",
		"content" => GetMessage("IBLOCK_ADM_HEADER_SECT"),
		"default" => true,
		"align" => "right",
	];
}

$arHeader[] = [
	"id" => "LID",
	"content" => GetMessage("IBLOCK_ADM_LANG"),
	"sort" => "lid",
	"default" => true,
	"align" => "left",
];
$arHeader[] = [
	"id" => "INDEX_ELEMENT",
	"content" => GetMessage("IBLOCK_ADM_HEADER_TOINDEX"),
];
if ($bWorkflow)
{
	$arHeader[] = [
		"id" => "WORKFLOW",
		"content" => GetMessage("IBLOCK_ADM_HEADER_WORKFLOW"),
	];
}
$arHeader[] = [
	"id" => "TIMESTAMP_X",
	"content" => GetMessage("IBLOCK_ADM_TIMESTAMP"),
	"sort" => "timestamp_x",
	"default" => true,
];
$arHeader[] = [
	"id" => "ID",
	"content" => "ID",
	"sort" => "id",
	"default" => true,
	"align" => "right",
];
if ($bBizproc && IsModuleInstalled("bizprocdesigner"))
{
	$arHeader[] = [
		"id" => "WORKFLOW_TEMPLATES",
		"content" => GetMessage("IBLOCK_ADM_HEADER_BIZPROC"),
		"default" => true,
		"align" => "right",
	];
}

$adminList->AddHeaders($arHeader);

$rsIBlocks = CIBlock::GetList($orderBy, $filter);
$rsIBlocks = new CAdminResult($rsIBlocks, $tableId);
$rsIBlocks->NavStart();

$adminList->NavText($rsIBlocks->GetNavPrint($arIBTYPE["NAME"]));

while ($dbrs = $rsIBlocks->NavNext(true, "f_"))
{
	if (
		$isAdminMode
		&& CIBlockRights::UserHasRightTo($f_ID, $f_ID, "iblock_edit")
	)
	{
		$row =& $adminList->AddRow($f_ID, $dbrs, 'iblock_edit.php?ID=' . $f_ID . '&type=' . htmlspecialcharsbx($type) . '&lang=' . LANGUAGE_ID . '&admin=' . ($isAdminMode ? "Y" : "N"), GetMessage("IBLOCK_ADM_TO_EDIT"));
	}
	elseif ($arIBTYPE["SECTIONS"] === "Y")
	{
		$row =& $adminList->AddRow($f_ID, $dbrs, CIBlock::GetAdminSectionListLink($f_ID, ['find_section_section' => 0]), GetMessage("IBLOCK_ADM_TO_EL_LIST"));
	}
	else
	{
		$row =& $adminList->AddRow($f_ID, $dbrs, CIBlock::GetAdminElementListLink($f_ID, ['find_section_section' => -1]), GetMessage("IBLOCK_ADM_TO_EL_LIST"));
	}

	if (!$f_SECTIONS_NAME)
	{
		$f_SECTIONS_NAME = $arIBTYPE["SECTION_NAME"] ? htmlspecialcharsbx($arIBTYPE["SECTION_NAME"]) : GetMessage("IBLOCK_ADM_SECTIONS");
	}
	if (!$f_ELEMENTS_NAME)
	{
		$f_ELEMENTS_NAME = $arIBTYPE["ELEMENT_NAME"] ? htmlspecialcharsbx($arIBTYPE["ELEMENT_NAME"]) : GetMessage("IBLOCK_ADM_ELEMENTS");
	}

	$f_LID = '';
	$dbLid = CIBlock::GetSite($f_ID);
	while ($arLid = $dbLid->Fetch())
	{
		$f_LID .= ($f_LID ? " / " : "") . htmlspecialcharsbx($arLid["LID"]);
	}

	$row->AddViewField("LID", $f_LID);
	if (
		$isAdminMode
		&& CIBlockRights::UserHasRightTo($f_ID, $f_ID, "iblock_edit")
	)
	{
		$row->AddViewField("ID", $f_ID);

		$row->AddInputField("NAME", ["size" => "35"]);
		$row->AddViewField("NAME", '<a href="iblock_edit.php?ID=' . $f_ID . '&type=' . htmlspecialcharsbx($type) . '&lang=' . LANGUAGE_ID . '&admin=' . ($isAdminMode ? "Y" : "N") . '" title="' . GetMessage("IBLOCK_ADM_TO_EDIT") . '">' . $f_NAME . '</a>');

		$row->AddInputField("SORT", ["size" => "3"]);
		$row->AddCheckField("ACTIVE");
		$row->AddInputField("CODE");
		$row->AddInputField("LIST_PAGE_URL");
		$row->AddInputField("DETAIL_PAGE_URL");
		$row->AddCheckField("INDEX_ELEMENT");
		if ($bWorkflow)
		{
			$row->AddCheckField("WORKFLOW");
		}
	}
	else
	{
		if ($arIBTYPE["SECTIONS"] === "Y")
		{
			$row->AddViewField("NAME", '<a href="' . htmlspecialcharsbx(CIBlock::GetAdminSectionListLink($f_ID, ['find_section_section' => 0])) . '" title="' . GetMessage("IBLOCK_ADM_TO_SECTLIST") . '">' . $f_NAME . '</a>');
		}
		else
		{
			$row->AddViewField("NAME", '<a href="' . htmlspecialcharsbx(CIBlock::GetAdminElementListLink($f_ID, ['find_section_section' => -1])) . '" title="' . GetMessage("IBLOCK_ADM_TO_EL_LIST") . '">' . $f_NAME . '</a>');
		}
		$row->AddCheckField("ACTIVE", false);
		$row->AddCheckField("INDEX_ELEMENT", false);
		if ($bWorkflow)
		{
			$row->AddCheckField("WORKFLOW", false);
		}
	}

	if (in_array("ELEMENT_CNT", $adminList->GetVisibleHeaderColumns()))
	{
		$f_ELEMENT_CNT = CIBlock::GetElementCount($f_ID);
		$row->AddViewField("ELEMENT_CNT", '<a href="' . htmlspecialcharsbx(CIBlock::GetAdminElementListLink($f_ID, ['find_section_section' => -1])) . '" title="' . GetMessage("IBLOCK_ADM_TO_ELLIST") . '">' . $f_ELEMENT_CNT . '</a>');
	}

	if ($arIBTYPE["SECTIONS"] === "Y" && in_array("SECTION_CNT", $adminList->GetVisibleHeaderColumns()))
	{
		$row->AddViewField("SECTION_CNT", '<a href="' . htmlspecialcharsbx(CIBlock::GetAdminSectionListLink($f_ID)) . '" title="' . GetMessage("IBLOCK_ADM_TO_SECTLIST") . '">' . CIBlockSection::GetCount(["IBLOCK_ID" => $f_ID]) . '</a>');
	}

	if (
		$bBizproc
		&& $dbrs["BIZPROC"] === "Y"
		&& in_array("WORKFLOW_TEMPLATES", $adminList->GetVisibleHeaderColumns())
		&& IsModuleInstalled("bizprocdesigner")
	)
	{
		$cnt = CBPDocument::GetNumberOfWorkflowTemplatesForDocumentType(
			["iblock", "CIBlockDocument", "iblock_" . $f_ID]
		);
		$row->AddViewField("WORKFLOW_TEMPLATES", '<a href="/bitrix/admin/iblock_bizproc_workflow_admin.php?document_type=iblock_' . $f_ID . '&lang=' . LANGUAGE_ID . '&back_url_list=' . urlencode($APPLICATION->GetCurPageParam()) . '">' . $cnt . '</a>');
	}

	$arActions = [];

	if (
		$isAdminMode
		&& CIBlockRights::UserHasRightTo($f_ID, $f_ID, "iblock_edit")
	)
	{
		$arActions[] = [
			"ICON" => "edit",
			"TEXT" => GetMessage("MAIN_ADMIN_MENU_EDIT"),
			"DEFAULT" => $isAdminMode,
			"ACTION" => $adminList->ActionRedirect("iblock_edit.php?ID=" . $f_ID . "&type=" . urlencode($type) . "&lang=" . LANGUAGE_ID . "&admin=" . ($isAdminMode ? "Y" : "N")),
		];
		$arActions[] = [
			"ICON" => "list",
			"TEXT" => GetMessage("IBLOCK_ADM_MENU_PROPERTIES"),
			"ACTION" => $adminList->ActionRedirect("iblock_property_admin.php?IBLOCK_ID=" . $f_ID . "&lang=" . LANGUAGE_ID . ($isAdminMode ? "&admin=Y" : "&admin=N")),
		];
	}

	if (
		$bBizproc
		&& $dbrs["BIZPROC"] === "Y"
		&& CIBlockRights::UserHasRightTo($f_ID, $f_ID, "iblock_edit")
		&& IsModuleInstalled("bizprocdesigner")
	)
	{
		$arActions[] = [
			"ICON" => "",
			"TEXT" => GetMessage("IBLOCK_ADM_MENU_BIZPROC"),
			"ACTION" => "window.location='/bitrix/admin/iblock_bizproc_workflow_admin.php?document_type=iblock_" . $f_ID . "&lang=" . LANGUAGE_ID . "';",
		];
	}

	if (
		$isAdminMode
		&& CIBlockRights::UserHasRightTo($f_ID, $f_ID, "iblock_delete")
	)
	{
		$arActions[] = [
			"ICON" => "delete",
			"TEXT" => GetMessage("MAIN_ADMIN_MENU_DELETE"),
			"ACTION" => "if(confirm('" . GetMessageJS("IBLOCK_ADM_CONFIRM_DEL_MESSAGE") . "')) " . $adminList->ActionDoGroup($f_ID, "delete", "&type=" . htmlspecialcharsbx($type) . "&lang=" . LANGUAGE_ID . "&admin=" . ($isAdminMode ? "Y" : "N")),
		];
	}

	if (count($arActions))
	{
		$row->AddActions($arActions);
	}
}

$adminList->AddFooter(
	[
		["title" => GetMessage("MAIN_ADMIN_LIST_SELECTED"), "value" => $rsIBlocks->SelectedRowsCount()],
		["counter" => true, "title" => GetMessage("MAIN_ADMIN_LIST_CHECKED"), "value" => "0"],
	]
);

if ($isAdminMode && $USER->IsAdmin())
{
	$aContext = [
		[
			"ICON" => "btn_new",
			"TEXT" => GetMessage("IBLOCK_ADM_TO_ADDIBLOCK"),
			"LINK" => "iblock_edit.php?lang=" . LANGUAGE_ID . "&admin=Y&type=" . urlencode($type),
			"TITLE" => GetMessage("IBLOCK_ADM_TO_ADDIBLOCK_TITLE"),
		],
	];

	$adminList->AddAdminContextMenu($aContext);

	$adminList->AddGroupActionTable([
		"delete" => GetMessage("MAIN_ADMIN_LIST_DELETE"),
		"activate" => GetMessage("MAIN_ADMIN_LIST_ACTIVATE"),
		"deactivate" => GetMessage("MAIN_ADMIN_LIST_DEACTIVATE"),
	]);

}
else
{
	$adminList->AddAdminContextMenu();
}

$adminList->CheckListMode();

$APPLICATION->SetTitle(GetMessage("IBLOCK_ADM_TITLE", ["#IBLOCK_TYPE#" => $arIBTYPE["~NAME"]]));

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/prolog_admin_after.php");
?>
	<form method="GET" action="iblock_admin.php?type=<?= urlencode($type) ?>" name="find_form">
		<input type="hidden" name="admin" value="<?= ($isAdminMode ? "Y" : "N") ?>">
		<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
		<input type="hidden" name="filter" value="Y">
		<input type="hidden" name="type" value="<?= htmlspecialcharsbx($type) ?>">
		<?php

		$oFilter = new CAdminFilter(
			$tableId . "_filter",
			[
				GetMessage("IBLOCK_ADM_FILT_SITE"),
				GetMessage("IBLOCK_ADM_FILT_ACT"),
				"ID",
				GetMessage("IBLOCK_FIELD_CODE"),
			]
		);

		$oFilter->Begin();
		?>
		<tr>
			<td><b><?= GetMessage("IBLOCK_ADM_FILT_NAME") ?></b></td>
			<td><input type="text"
					name="find_name"
					value="<?= htmlspecialcharsbx($findName) ?>"
					size="40">&nbsp;<?= ShowFilterLogicHelp() ?></td>
		</tr>
		<tr>
			<td><?= GetMessage("IBLOCK_ADM_FILT_SITE") ?>:</td>
			<td>
				<select name="find_lang">
					<option value=""><?= GetMessage("IBLOCK_ALL") ?></option>
					<?php
					$l = CLang::GetList("sort", "asc", ["VISIBLE" => "Y"]);
					while ($ar = $l->GetNext()):
						?>
						<option value="<?= $ar["LID"] ?>"<?php
										if ($findLang === $ar["LID"])
						{
							echo " selected";
						} ?>><?= $ar["NAME"] ?></option><?php
					endwhile;
					?>
				</select>
			</td>
		</tr>
		<tr>
			<td><?= GetMessage("IBLOCK_ADM_FILT_ACT") ?>:</td>
			<td>
				<?php
				$arr = ["reference" => [GetMessage("IBLOCK_YES"), GetMessage("IBLOCK_NO")], "reference_id" => ["Y", "N"]];
				echo SelectBoxFromArray("find_active", $arr, htmlspecialcharsex($findActive), GetMessage('IBLOCK_ALL'));
				?>
			</td>
		</tr>
		<tr>
			<td>ID:</td>
			<td><input type="text" name="find_id" value="<?= htmlspecialcharsbx($findId) ?>" size="15"></td>
		</tr>
		<tr>
			<td><?= GetMessage("IBLOCK_FIELD_CODE") ?>:</td>
			<td><input type="text"
					name="find_code"
					value="<?= htmlspecialcharsbx($findCode) ?>"
					size="15">&nbsp;<?= ShowFilterLogicHelp() ?></td>
		</tr>
		<?php

		$oFilter->Buttons(["table_id" => $tableId, "url" => $APPLICATION->GetCurPageParam() . '?type=' . urlencode($type), "form" => "find_form"]);
		$oFilter->End();
		?>
	</form>
<?php

$adminList->DisplayList();

if (!$isAdminMode):
	echo BeginNote(),
	GetMessage("IBLOCK_ADM_MANAGE_HINT"),
		' <a href="iblock_admin.php?type=' . htmlspecialcharsbx($type) . '&amp;lang=' . LANGUAGE_ID . '&amp;admin=Y">',
	GetMessage("IBLOCK_ADM_MANAGE_HINT_HREF"),
	'</a>.',
	EndNote();
endif;

require($_SERVER["DOCUMENT_ROOT"] . "/bitrix/modules/main/include/epilog_admin.php");
