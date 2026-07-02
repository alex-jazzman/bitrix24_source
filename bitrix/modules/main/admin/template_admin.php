<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 */

$strError = "";
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
define("HELP_FILE", "settings/sites/template_admin.php");

$edit_php = $USER->CanDoOperation('edit_php');
if(!$edit_php && !$USER->CanDoOperation('view_other_settings') && !$USER->CanDoOperation('lpa_template_edit'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$isEditingMessageThemePage = $APPLICATION->GetCurPage() == '/bitrix/admin/message_theme_admin.php';

IncludeModuleLangFile(__FILE__);

$sTableID = "tbl_template";
$oSort = new CAdminSorting($sTableID, "id", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);

if(isset($_REQUEST['mode']) && ($_REQUEST['mode']=='list' || $_REQUEST['mode']=='frame'))
	CFile::DisableJSFunction();

if($lAdmin->EditAction() && $edit_php)
{
	foreach($_POST["FIELDS"] as $ID=>$arFields)
	{
		if(!$lAdmin->IsUpdated($ID))
			continue;

		$ob = new CSiteTemplate;
		if(!$ob->Update($ID, $arFields))
			$lAdmin->AddUpdateError(GetMessage("SAVE_ERROR").$ID.": ".$ob->LAST_ERROR, $ID);
	}
}

if(($arID = $lAdmin->GroupAction()) && $edit_php)
{
	if (isset($_REQUEST['action_target']) && $_REQUEST['action_target']=='selected')
	{
		$arID = Array();
		$rsData = CSiteTemplate::GetList(array(), array(), array("ID"));
		while($arRes = $rsData->Fetch())
			$arID[] = $arRes['ID'];
	}

	foreach($arID as $ID)
	{
		if($ID == '')
			continue;

		switch($_REQUEST['action'])
		{
			case "delete":
				if(!CSiteTemplate::Delete($ID))
					$lAdmin->AddGroupError(GetMessage("DELETE_ERROR"), $ID);
				break;
			case "export":
			?>
<script>
exportData('<?=CUtil::JSEscape($ID)?>');
</script>
			<?php
				break;
			case "copy":
				$from = getLocalPath("templates/".$ID, BX_PERSONAL_ROOT);
				$to = mb_substr($from, 0, -mb_strlen($ID)).($ID == ".default"? "default" : $ID)."_copy";
				CopyDirFiles($_SERVER["DOCUMENT_ROOT"].$from, $_SERVER["DOCUMENT_ROOT"].$to, false, true);
				break;
		}
	}
}
$rsData = CSiteTemplate::GetList(array($oSort->getField() => $oSort->getOrder()), array('TYPE' => ($isEditingMessageThemePage ? 'mail' : '')), array("ID", "NAME", "DESCRIPTION", "SCREENSHOT", "SORT"));
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();

$lAdmin->NavText($rsData->GetNavPrint(GetMessage("PAGES"), false));

$lAdmin->AddHeaders(array(
	array("id"=>"SCREENSHOT", "content"=>GetMessage("site_templ_edit_screen"), "default"=>true),
	array("id"=>"ID", "content"=>"ID", "sort"=>"id", "default"=>true),
	array("id"=>"NAME", "content"=>GetMessage('MAIN_T_ADMIN_NAME'), "sort"=>"name", "default"=>true),
	array("id"=>"DESCRIPTION", "content"=>GetMessage('MAIN_T_ADMIN_DESCRIPTION'), "sort"=>"description", "default"=>true),
	array("id"=>"SORT", "content"=>GetMessage("site_templ_edit_sort"), "sort"=>"sort", "default"=>true),
));

while($arRes = $rsData->Fetch())
{
	$templateIdUrl = urlencode($arRes["ID"]);
	$templateScreenshot = $arRes["SCREENSHOT"] ?? '';
	$templatePreview = $arRes["PREVIEW"] ?? '';

	$row = $lAdmin->AddRow($arRes["ID"], $arRes, ($isEditingMessageThemePage ? "message_theme_edit.php" : "template_edit.php")."?ID=".$templateIdUrl, GetMessage("MAIN_EDIT_TITLE"));

	$row->AddViewField("SCREENSHOT", ($templateScreenshot <> '' ? CFile::Show2Images(($templatePreview <> '' ? $templatePreview : $templateScreenshot), $templateScreenshot, 130, 100, "border=0") : ''));
	$row->AddViewField("ID", '<a href="'.($isEditingMessageThemePage ? "message_theme_edit.php" : "template_edit.php").'?lang='.LANGUAGE_ID.'&amp;ID='.$templateIdUrl.'" title="'.GetMessage("MAIN_EDIT_TITLE").'">'.htmlspecialcharsbx($arRes["ID"]).'</a>');

	if ($edit_php)
	{
		$row->AddInputField("NAME");
		$row->AddInputField("DESCRIPTION");
		$row->AddInputField("SORT");
	}
	else
	{
		$row->AddViewField("NAME", htmlspecialcharsbx($arRes["NAME"] ?? ''));
		$row->AddViewField("DESCRIPTION", htmlspecialcharsbx($arRes["DESCRIPTION"] ?? ''));
		$row->AddViewField("SORT", htmlspecialcharsbx($arRes["SORT"] ?? ''));
	}

	$arActions = Array();

	$arActions[] = array("ICON"=>"edit", "TEXT"=>($USER->CanDoOperation('edit_other_settings') || $USER->CanDoOperation('lpa_template_edit')? GetMessage("MAIN_ADMIN_MENU_EDIT") : GetMessage("MAIN_ADMIN_MENU_VIEW")), "ACTION"=>$lAdmin->ActionRedirect(($isEditingMessageThemePage ? "message_theme_edit.php" : "template_edit.php")."?ID=".$templateIdUrl));
	if ($edit_php)
	{
		$arActions[] = array("ICON"=>"copy", "TEXT"=>GetMessage("MAIN_ADMIN_MENU_COPY"), "ACTION"=>$lAdmin->ActionDoGroup($templateIdUrl, "copy"));
		$arActions[] = array("ICON"=>"export", "TEXT"=>GetMessage("MAIN_ADMIN_LIST_EXPORT"), "ACTION"=>"exportData('".$templateIdUrl."')");
		$arActions[] = array("SEPARATOR"=>true);
		$arActions[] = array("ICON"=>"delete", "TEXT"=>GetMessage("MAIN_T_ADMIN_DEL"), "ACTION"=>"if(confirm('".GetMessage('MAIN_T_ADMIN_DEL_CONF')."')) ".$lAdmin->ActionDoGroup($templateIdUrl, "delete"));
	}

	$row->AddActions($arActions);
}

if ($edit_php)
{
	$lAdmin->AddGroupActionTable(array(
		"copy" => GetMessage("MAIN_T_ADMIN_COPY_1"),
		"delete" => true,
	));
}

$aContext = array();
if ($edit_php)
{
	$aContext[] = array(
			"TEXT"	=> ($isEditingMessageThemePage ? GetMessage("MAIN_ADD_TEMPL_THEME") : GetMessage("MAIN_ADD_TEMPL")),
			"LINK"	=> ($isEditingMessageThemePage ? "message_theme_edit.php" : "template_edit.php")."?lang=".LANGUAGE_ID,
			"TITLE"	=> GetMessage("MAIN_ADD_TEMPL_TITLE"),
			"ICON"	=> "btn_new"
		);
	$aContext[] = array(
			"TEXT"	=> ($isEditingMessageThemePage ? GetMessage("MAIN_LOAD_THEME") : GetMessage("MAIN_LOAD")),
			"LINK"	=> "template_load.php?lang=".LANGUAGE_ID,
			"TITLE"	=> GetMessage("MAIN_T_IMPORT"),
			"ICON"	=> ""
		);
}
$lAdmin->AddAdminContextMenu($aContext);

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(($isEditingMessageThemePage ? GetMessage("MAIN_T_ADMIN_TITLE_THEME") : GetMessage("MAIN_T_ADMIN_TITLE")));

require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/prolog_admin_after.php");
?>
<script>
function exportData(val)
{
	window.open("template_export.php?ID="+val+"&<?=bitrix_sessid_get()?>");
}
</script>
<?php
$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"].BX_ROOT."/modules/main/include/epilog_admin.php");
