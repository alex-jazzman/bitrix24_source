<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2026 Bitrix
 */

/**
 * Bitrix vars
 * @global CMain $APPLICATION
 * @global CUserTypeManager $USER_FIELD_MANAGER
 * @global CAdminPage $adminPage
 * @global CAdminSidePanelHelper $adminSidePanelHelper
 */

use Bitrix\Main;

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
define("HELP_FILE", "settings/userfield_edit.php");

IncludeModuleLangFile(__FILE__);

$ID = intval($_REQUEST['ID'] ?? 0);
$back_url = $_REQUEST["back_url"] ?? '';
$list_url = $_REQUEST["list_url"] ?? '';

$selfFolderUrl = $adminPage->getSelfFolderUrl();
if ($adminSidePanelHelper->isPublicFrame())
{
	$back_url = $adminSidePanelHelper->setDefaultQueryParams($back_url);
}

$RIGHTS = $USER_FIELD_MANAGER->GetRights(false, $ID);
if($RIGHTS < "W")
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$aTabs = array(
	array(
		"DIV" => "edit1",
		"TAB" => GetMessage("USER_TYPE_TAB"),
		"ICON"=>"main_user_edit",
		"TITLE"=>GetMessage("USER_TYPE_TAB_TITLE"),
	)
);

/** @var CUserFieldEnum $obEnum */
$obEnum = null;
if($ID>0)
{
	if($arUserField = CUserTypeEntity::GetByID($ID))
	{
		if($arType = $USER_FIELD_MANAGER->GetUserType($arUserField["USER_TYPE_ID"]))
		{
			if($arType["BASE_TYPE"] == "enum")
			{
				$obEnum = new CUserFieldEnum;
				$aTabs[] = array(
					"DIV" => "edit2",
					"TAB" => GetMessage("USER_TYPE_TAB2"),
					"ICON"=>"main_user_edit",
					"TITLE"=>GetMessage("USER_TYPE_TAB2_TITLE"),
				);
			}
		}
	}
}

$tabControl = new CAdminTabControl("tabControl", $aTabs);

$message = null;
$bVarsFromForm = false;

if($_SERVER["REQUEST_METHOD"] == "POST" && (!empty($_POST["save"]) || !empty($_POST["apply"])) && ($RIGHTS >= "W") && check_bitrix_sessid())
{
	$arFields = array(
		"ENTITY_ID" => $_POST["ENTITY_ID"] ?? '',
		"FIELD_NAME" => $_POST["FIELD_NAME"] ?? '',
		"USER_TYPE_ID" => $_POST["USER_TYPE_ID"] ?? '',
		"XML_ID" => $_POST["XML_ID"] ?? '',
		"SORT" => $_POST["SORT"] ?? '',
		"MULTIPLE" => $_POST["MULTIPLE"] ?? 'N',
		"MANDATORY" => $_POST["MANDATORY"] ?? 'N',
		"SHOW_FILTER" => $_POST["SHOW_FILTER"] ?? 'N',
		"SHOW_IN_LIST" => $_POST["SHOW_IN_LIST"] ?? 'Y',
		"EDIT_IN_LIST" => $_POST["EDIT_IN_LIST"] ?? 'Y',
		"IS_SEARCHABLE" => $_POST["IS_SEARCHABLE"] ?? 'N',
		"SETTINGS" => $_POST["SETTINGS"] ?? [],
		"EDIT_FORM_LABEL" => $_POST["EDIT_FORM_LABEL"] ?? [],
		"LIST_COLUMN_LABEL" => $_POST["LIST_COLUMN_LABEL"] ?? [],
		"LIST_FILTER_LABEL" => $_POST["LIST_FILTER_LABEL"] ?? [],
		"ERROR_MESSAGE" => $_POST["ERROR_MESSAGE"] ?? [],
		"HELP_MESSAGE" => $_POST["HELP_MESSAGE"] ?? [],
	);

	$obUserField  = new CUserTypeEntity;
	if($ID > 0)
	{
		$res = $obUserField->Update($ID, $arFields);
	}
	else
	{
		$ID = $obUserField->Add($arFields);
		$res = ($ID > 0);
	}

	if(is_object($obEnum))
	{
		$LIST = $_POST["LIST"] ?? [];
		if(is_array($LIST))
		{
			foreach($LIST as $id => $value)
				if(is_array($value))
					$LIST[$id]["DEF"] = "N";
		}
		if(isset($LIST["DEF"]) && is_array($LIST["DEF"]))
		{
			foreach($LIST["DEF"] as $value)
				if(is_array($LIST[$value]))
					$LIST[$value]["DEF"] = "Y";
			unset($LIST["DEF"]);
		}
		$res = $obEnum->SetEnumValues($ID, $LIST);
	}

	if($res)
	{
		if ($adminSidePanelHelper->isAjaxRequest())
		{
			$adminSidePanelHelper->sendSuccessResponse("base", array("ID" => $ID));
		}
		else
		{
			if (!empty($_POST["apply"]))
			{
				$applyUrl = $selfFolderUrl."userfield_edit.php?ID=".$ID."&lang=".LANGUAGE_ID."&back_url=".
					urlencode($back_url)."&".$tabControl->ActiveTabParam();
				$applyUrl = $adminSidePanelHelper->setDefaultQueryParams($applyUrl);
				LocalRedirect($applyUrl);
			}
			elseif ($back_url)
			{
				$back_url = $adminSidePanelHelper->editUrlToPublicPage($back_url);
				$adminSidePanelHelper->localRedirect($back_url);
				LocalRedirect($back_url);
			}
			else
			{
				$redirectUrl = $selfFolderUrl."userfield_admin.php?lang=".LANGUAGE_ID;
				$redirectUrl = $adminSidePanelHelper->editUrlToPublicPage($redirectUrl);
				$adminSidePanelHelper->localRedirect($redirectUrl);
				LocalRedirect($redirectUrl);
			}
		}
	}
	else
	{
		if($e = $APPLICATION->GetException())
		{
			$message = new CAdminMessage(GetMessage("USER_TYPE_SAVE_ERROR"), $e);
			$adminSidePanelHelper->sendJsonErrorResponse($e->GetString());
		}
		$bVarsFromForm = true;
	}

}

$userFieldData = [
	'ENTITY_ID' => $_GET['ENTITY_ID'] ?? '',
	'FIELD_NAME' => $_GET['FIELD_NAME'] ?? 'UF_',
	'USER_TYPE_ID' => $_GET['USER_TYPE_ID'] ?? '',
	'XML_ID' => '',
	'SORT' => 100,
	'MULTIPLE' => 'N',
	'MANDATORY' => 'N',
	'SHOW_FILTER' => 'N',
	'SHOW_IN_LIST' => 'Y',
	'EDIT_IN_LIST' => 'Y',
	'IS_SEARCHABLE' => 'N',
	'SETTINGS' => [],
	'EDIT_FORM_LABEL' => [],
	'LIST_COLUMN_LABEL' => [],
	'LIST_FILTER_LABEL' => [],
	'ERROR_MESSAGE' => [],
	'HELP_MESSAGE' => [],
];

$checkboxes = [
	'MULTIPLE' => 1,
	'MANDATORY' => 1,
	'SHOW_IN_LIST' => 1,
	'EDIT_IN_LIST' => 1,
	'IS_SEARCHABLE' => 1,
];

if ($ID > 0)
{
	$arUserField = CUserTypeEntity::GetByID($ID);
	if ($arUserField)
	{
		foreach ($userFieldData as $key => $value)
		{
			$userFieldData[$key] = $arUserField[$key] ?? $value;
		}
	}
	else
	{
		$ID = 0;
	}
}

if ($bVarsFromForm)
{
	foreach ($userFieldData as $key => $value)
	{
		if (isset($_POST[$key]) || isset($checkboxes[$key]))
		{
			$userFieldData[$key] = $_POST[$key] ?? '';
		}
	}
}

$arUserTypes = $USER_FIELD_MANAGER->GetUserType();
Main\Type\Collection::sortByColumn($arUserTypes, 'DESCRIPTION', '', null, true);
$arUserType = $USER_FIELD_MANAGER->GetUserType($userFieldData['USER_TYPE_ID']);
if(!$arUserType)
{
	$arUserType = reset($arUserTypes);
}
/** @var Main\UserField\Types\BaseType $userTypeClass */
$userTypeClass = $arUserType['CLASS_NAME'];
if (!(is_a($userTypeClass, Main\UserField\Types\BaseType::class, true)))
{
	$userTypeClass = Main\UserField\Types\BaseType::class;
}

$APPLICATION->SetTitle(($ID>0? GetMessage("USER_TYPE_EDIT_TITLE", array("#ID#"=>$ID)) : GetMessage("USER_TYPE_ADD_TITLE")));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

// validate list_url
if (!empty($list_url))
{
	$list_url = str_starts_with($list_url, '/') ? $list_url : '/'.$list_url;
}

$aMenu = array();
if (!$adminSidePanelHelper->isPublicFrame())
{
	$aMenu[] = array(
		"TEXT"=>GetMessage("USER_TYPE_LIST"),
		"TITLE"=>GetMessage("USER_TYPE_LIST_TITLE"),
		"LINK"=>!empty($list_url)? $list_url : "userfield_admin.php?lang=".LANGUAGE_ID,
		"ICON"=>"btn_list",
	);
}
if($ID>0)
{
	$aMenu[] = array("SEPARATOR"=>"Y");
	$aMenu[] = array(
		"TEXT"=>GetMessage("MAIN_ADD"),
		"TITLE"=>GetMessage("USER_TYPE_ADD"),
		"LINK"=>"userfield_edit.php?lang=".LANGUAGE_ID,
		"ICON"=>"btn_new",
	);
	$aMenu[] = array(
		"TEXT"=>GetMessage("MAIN_DELETE"),
		"TITLE"=>GetMessage("USER_TYPE_DELETE"),
		"LINK"=>"javascript:if(confirm('".GetMessage("USER_TYPE_DELETE_CONF")."'))window.location='userfield_admin.php?ID=".$ID."&action=delete&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."';",
		"ICON"=>"btn_delete",
	);
}
$context = new CAdminContextMenu($aMenu);
$context->Show();
?>

<?php
if($message)
	echo $message->Show();
?>
<script>
function addNewRow(tableID)
{
	var tbl = document.getElementById(tableID);
	var cnt = tbl.rows.length;
	var oRow = tbl.insertRow(cnt);
	for(var i=0;i<6;i++)
	{
		var oCell = oRow.insertCell(i);
		var sHTML=tbl.rows[cnt-1].cells[i].innerHTML;
		var p = 0;
		while(true)
		{
			var s = sHTML.indexOf('[n',p);
			if(s<0)break;
			var e = sHTML.indexOf(']',s);
			if(e<0)break;
			var n = parseInt(sHTML.substr(s+2,e-s));
			sHTML = sHTML.substr(0, s)+'[n'+(++n)+']'+sHTML.substr(e+1);
			p=s+1;
		}
		while(true)
		{
			s = sHTML.indexOf('\"n',p);
			if(s<0)break;
			e = sHTML.indexOf('\"',s+1);
			if(e<0)break;
			n = parseInt(sHTML.substr(s+2,e-s));
			sHTML = sHTML.substr(0, s)+'\"n'+(++n)+'\"'+sHTML.substr(e+1);
			p=s+1;
		}
		oCell.innerHTML = sHTML;
	}

	setTimeout(function() {
		var r = BX.findChildren(oCell.parentNode, {tag: /^(input|select|textarea)$/i}, true);
		if (r && r.length > 0)
		{
			for (var i=0,l=r.length;i<l;i++)
			{
				if (r[i].form && r[i].form.BXAUTOSAVE)
					r[i].form.BXAUTOSAVE.RegisterInput(r[i]);
				else
					break;
			}
		}
	}, 10);
}

BX.ready(function(){
	BX.addCustomEvent(document.forms.post_form, 'onAutoSaveRestore', function(ob, data)
	{
		for(var i in data)
		{
			var r = /^LIST\[n([\d]+)]\[XML_ID]$/.exec(i);
			if (r && r[1] > 0)
			{
				addNewRow('list_table');
			}
		}

	});

});
</script>
<?php
$formAction = $APPLICATION->GetCurPage();
$formAction = $adminSidePanelHelper->setDefaultQueryParams($formAction);
?>
<form method="POST" action="<?=$formAction?>" ENCTYPE="multipart/form-data" name="post_form">
<?php
$tabControl->Begin();
?>
<?php
$tabControl->BeginNextTab();
?>
	<?php if($ID):?>
	<tr>
		<td width="40%">ID:</td>
		<td width="60%"><?=$ID?></td>
	</tr>
	<?php endif?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?=GetMessage("USERTYPE_USER_TYPE_ID")?>:</td>
		<td width="60%">
			<?php
			if($ID > 0)
			{
				echo htmlspecialcharsbx($arUserType["DESCRIPTION"]);
			}
			else
			{
				$arr = array("reference"=>array(), "reference_id"=>array());
				foreach($arUserTypes as $userType)
				{
					$arr["reference"][] = $userType["DESCRIPTION"];
					$arr["reference_id"][] = $userType["USER_TYPE_ID"];
				}
				echo SelectBoxFromArray(
					'USER_TYPE_ID',
					$arr,
					$userFieldData['USER_TYPE_ID'],
					'',
					'OnChange="' . htmlspecialcharsbx(
						'window.location=\'' . CUtil::JSEscape(
							$APPLICATION->GetCurPageParam('', array('USER_TYPE_ID'))
							. '&back_url=' . urlencode($back_url)
							. '&list_url=' . urlencode($list_url)
							. '&ENTITY_ID=' . urlencode((string)$userFieldData['ENTITY_ID'])
							. '&USER_TYPE_ID='
						) . '\' + this.value'
					) . '"'
				);
			}
			?>
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?=GetMessage("USERTYPE_ENTITY_ID")?>:</td>
		<td>
			<?php if($ID>0 || ($userFieldData['ENTITY_ID'] != '' && !$message)):?>
				<?=htmlspecialcharsbx($userFieldData['ENTITY_ID'])?>
				<input type="hidden" name="ENTITY_ID" value="<?=htmlspecialcharsbx($userFieldData['ENTITY_ID'])?>">
			<?php else:?>
				<input type="text" name="ENTITY_ID" value="<?=htmlspecialcharsbx($userFieldData['ENTITY_ID'])?>" maxlength="50">
			<?php endif?>
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?=GetMessage("USERTYPE_FIELD_NAME")?>:</td>
		<td>
			<?php if($ID>0):?>
				<?=htmlspecialcharsbx($userFieldData['FIELD_NAME'])?>
			<?php else:?>
				<input type="text" name="FIELD_NAME" value="<?=htmlspecialcharsbx($userFieldData['FIELD_NAME'])?>" maxlength="50">
			<?php endif?>
		</td>
	</tr>
	<tr>
		<td><?=GetMessage("USERTYPE_XML_ID")?>:</td>
		<td><input type="text" name="XML_ID" value="<?=htmlspecialcharsbx($userFieldData['XML_ID'])?>" maxlength="255"></td>
	</tr>
	<tr>
		<td><?=GetMessage("USERTYPE_SORT")?>:</td>
		<td><input type="text" name="SORT" value="<?=htmlspecialcharsbx((string)$userFieldData['SORT'])?>"></td>
	</tr>
	<?php if ($userTypeClass::isMultiplicitySupported()):?>
	<tr>
		<td><?=GetMessage("USERTYPE_MULTIPLE")?>:</td>
		<td>
			<?php if($ID>0):?>
				<?=$userFieldData['MULTIPLE'] == "Y"? GetMessage("MAIN_YES"): GetMessage("MAIN_NO")?>
			<?php else:?>
				<input type="checkbox" name="MULTIPLE" value="Y"<?php if($userFieldData['MULTIPLE'] == "Y") echo " checked"?> >
			<?php endif?>
		</td>
	</tr>
	<?php endif;?>
	<?php if ($userTypeClass::isMandatorySupported()):?>
	<tr>
		<td><?=GetMessage("USERTYPE_MANDATORY")?>:</td>
		<td><input type="checkbox" name="MANDATORY" value="Y"<?php if($userFieldData['MANDATORY'] == "Y") echo " checked"?> ></td>
	</tr>
	<?php endif;?>
	<tr>
		<td><?=GetMessage("USERTYPE_SHOW_FILTER")?>:</td>
		<td><?php
			$arr = array(
				"reference" => array(
					GetMessage("USER_TYPE_FILTER_N"),
					GetMessage("USER_TYPE_FILTER_I"),
					GetMessage("USER_TYPE_FILTER_E"),
					GetMessage("USER_TYPE_FILTER_S"),
				),
				"reference_id" => array(
					"N",
					"I",
					"E",
					"S",
				),
			);
			echo SelectBoxFromArray("SHOW_FILTER", $arr, $userFieldData['SHOW_FILTER']);
		?></td>
	</tr>
	<tr>
		<td><?=GetMessage("USERTYPE_SHOW_IN_LIST")?>:</td>
		<td><input type="checkbox" name="SHOW_IN_LIST" value="N"<?php if($userFieldData['SHOW_IN_LIST'] == "N") echo " checked"?> ></td>
	</tr>
	<tr>
		<td><?=GetMessage("USERTYPE_EDIT_IN_LIST")?>:</td>
		<td><input type="checkbox" name="EDIT_IN_LIST" value="N"<?php if($userFieldData['EDIT_IN_LIST'] == "N") echo " checked"?> ></td>
	</tr>
	<tr>
		<td><?=GetMessage("USERTYPE_IS_SEARCHABLE")?>:</td>
		<td><input type="checkbox" name="IS_SEARCHABLE" value="Y"<?php if($userFieldData['IS_SEARCHABLE'] == "Y") echo " checked"?> ></td>
	</tr>
	<tr class="heading">
		<td colspan="2"><?= GetMessage("USERTYPE_SETTINGS")?></td>
	</tr>
	<?php if($ID > 0):
		echo $USER_FIELD_MANAGER->GetSettingsHTML($userFieldData, $bVarsFromForm);
	else:
		echo $USER_FIELD_MANAGER->GetSettingsHTML($arUserType["USER_TYPE_ID"], $bVarsFromForm);
	endif;?>
	<tr class="heading">
		<td colspan="2"><?= GetMessage("USERTYPE_LANG_SETTINGS")?></td>
	</tr>
	<tr>
		<td colspan="2" align="center">
			<table border="0" cellspacing="10" cellpadding="2">
				<tr>
					<td align="right"><?= GetMessage("USER_TYPE_LANG");?></td>
					<td align="center" width="200"><?= GetMessage("USER_TYPE_EDIT_FORM_LABEL");?></td>
					<td align="center" width="200"><?= GetMessage("USER_TYPE_LIST_COLUMN_LABEL");?></td>
					<td align="center" width="200"><?= GetMessage("USER_TYPE_LIST_FILTER_LABEL");?></td>
					<td align="center" width="200"><?= GetMessage("USER_TYPE_ERROR_MESSAGE");?></td>
					<td align="center" width="200"><?= GetMessage("USER_TYPE_HELP_MESSAGE");?></td>
				</tr>
				<?php
				$rsLanguage = CLanguage::GetList();
				while($arLanguage = $rsLanguage->Fetch()):
					$htmlLID = htmlspecialcharsbx($arLanguage["LID"]);
				?>
				<tr>
					<td align="right"><?= htmlspecialcharsbx($arLanguage["NAME"])?>:</td>
					<td align="center"><input type="text" name="EDIT_FORM_LABEL[<?= $htmlLID?>]" size="20" maxlength="255" value="<?= htmlspecialcharsbx($userFieldData['EDIT_FORM_LABEL'][$arLanguage["LID"]] ?? '')?>"></td>
					<td align="center"><input type="text" name="LIST_COLUMN_LABEL[<?= $htmlLID?>]" size="20" maxlength="255" value="<?= htmlspecialcharsbx($userFieldData['LIST_COLUMN_LABEL'][$arLanguage["LID"]] ?? '')?>"></td>
					<td align="center"><input type="text" name="LIST_FILTER_LABEL[<?= $htmlLID?>]" size="20" maxlength="255" value="<?= htmlspecialcharsbx($userFieldData['LIST_FILTER_LABEL'][$arLanguage["LID"]] ?? '')?>"></td>
					<td align="center"><input type="text" name="ERROR_MESSAGE[<?= $htmlLID?>]" size="20" maxlength="255" value="<?= htmlspecialcharsbx($userFieldData['ERROR_MESSAGE'][$arLanguage["LID"]] ?? '')?>"></td>
					<td align="center"><input type="text" name="HELP_MESSAGE[<?= $htmlLID?>]" size="20" maxlength="255" value="<?= htmlspecialcharsbx($userFieldData['HELP_MESSAGE'][$arLanguage["LID"]] ?? '')?>"></td>
				</tr>
				<?php endwhile?>
			</table>
		</td>
	</tr>
<?php if(is_object($obEnum)):
	$tabControl->BeginNextTab();
?>
	<tr>
		<td class="adm-detail-valign-top"><?=GetMessage("USER_TYPE_LIST_LABEL")?></td>
		<td>
	<table border="0" cellspacing="0" cellpadding="0" class="internal" id="list_table">
	<tr class="heading">
		<td><?=GetMessage("USER_TYPE_LIST_ID")?></td>
		<td><?=GetMessage("USER_TYPE_LIST_XML_ID")?></td>
		<td><?=GetMessage("USER_TYPE_LIST_VALUE")?></td>
		<td><?=GetMessage("USER_TYPE_LIST_SORT")?></td>
		<td><?=GetMessage("USER_TYPE_LIST_DEF")?></td>
		<td><?=GetMessage("USER_TYPE_LIST_DEL")?></td>
	</tr>
<?php

$rsEnum = $obEnum::GetList([], ['USER_FIELD_ID' => $ID]);
$enumItems = [];
$hasDefaultItem = false;
while($item = $rsEnum->GetNext())
{
	$enumItems[] = $item;
	if (($item['DEF'] ?? 'N') === 'Y')
	{
		$hasDefaultItem = true;
	}
}

if ($userFieldData['MULTIPLE'] === 'N'):
	?>
	<tr>
		<td>&nbsp;</td>
		<td>&nbsp;</td>
		<td><?=GetMessage("USER_TYPE_LIST_NO_DEF")?></td>
		<td>&nbsp;</td>
		<td><input type="radio" name="LIST[DEF][]" value="0" <?= ($hasDefaultItem ? '' : 'checked') ?>></td>
		<td>&nbsp;</td>
	</tr>
<?php endif?>
<?php
	foreach ($enumItems as $arEnum):
		if($bVarsFromForm && is_array($_POST['LIST'][$arEnum["ID"]] ?? null))
			foreach($_POST['LIST'][$arEnum["ID"]] as $key=>$val)
				$arEnum[$key] = htmlspecialcharsbx($val);
?>
	<tr>
		<td><?=$arEnum["ID"]?></td>
		<td><input type="text" name="LIST[<?=$arEnum["ID"]?>][XML_ID]" value="<?=$arEnum["XML_ID"]?>" size="15" maxlength="255"></td>
		<td><input type="text" name="LIST[<?=$arEnum["ID"]?>][VALUE]" value="<?=$arEnum["VALUE"]?>" size="35" maxlength="255"></td>
		<td><input type="text" name="LIST[<?=$arEnum["ID"]?>][SORT]" value="<?=$arEnum["SORT"]?>" size="5" maxlength="10"></td>
		<td><input type="<?=($userFieldData['MULTIPLE'] == "Y"? "checkbox": "radio")?>" name="LIST[DEF][]" value="<?=$arEnum["ID"]?>" <?=($arEnum["DEF"]=="Y"? "checked": "")?>></td>
		<td><input type="checkbox" name="LIST[<?=$arEnum["ID"]?>][DEL]" value="Y"<?php if($arEnum["DEL"] == "Y") echo " checked"?>></td>
	</tr>
<?php
	endforeach;
?>
<?php
if($bVarsFromForm):
	$n = 0;
	foreach(($_POST['LIST'] ?? []) as $key=>$val):
		if(strncmp($key, "n", 1)===0):
?>
	<tr>
		<td>&nbsp;</td>
		<td><input type="text" name="LIST[n<?=$n?>][XML_ID]" value="<?=htmlspecialcharsbx($val["XML_ID"])?>" size="15" maxlength="255"></td>
		<td><input type="text" name="LIST[n<?=$n?>][VALUE]" value="<?=htmlspecialcharsbx($val["VALUE"])?>" size="35" maxlength="255"></td>
		<td><input type="text" name="LIST[n<?=$n?>][SORT]" value="<?=htmlspecialcharsbx($val["SORT"])?>" size="5" maxlength="10"></td>
		<td><input type="<?=($userFieldData['MULTIPLE'] == "Y"? "checkbox": "radio")?>" name="LIST[DEF][]" value="n<?=$n?>"></td>
		<td><input type="checkbox" name="LIST[n<?=$n?>][DEL]" value="Y"<?php if($val["DEL"] == "Y") echo " checked"?>></td>
	</tr>
<?php
			$n++;
		endif;
	endforeach;
else:
?>
	<tr>
		<td>&nbsp;</td>
		<td><input type="text" name="LIST[n0][XML_ID]" value="" size="15" maxlength="255"></td>
		<td><input type="text" name="LIST[n0][VALUE]" value="" size="35" maxlength="255"></td>
		<td><input type="text" name="LIST[n0][SORT]" value="500" size="5" maxlength="10"></td>
		<td><input type="<?=($userFieldData['MULTIPLE'] == "Y"? "checkbox": "radio")?>" name="LIST[DEF][]" value="n0"></td>
		<td><input type="checkbox" name="LIST[n0][DEL]" value="Y"></td>
	</tr>
<?php
endif;
?>
	</table>
		</td>
	</tr>
	<tr>
		<td>&nbsp;</td>
		<td><input type="button" value="<?=GetMessage("USER_TYPE_LIST_MORE")?>" OnClick="addNewRow('list_table')" ></td>
	</tr>
<?php endif?>
<?php
$tabControl->Buttons(
	array(
		"disabled" => ($RIGHTS < "W"),
		"back_url" => !empty($back_url) ? $back_url : "userfield_admin.php?lang=".LANGUAGE_ID
	)
);
?>
<?= bitrix_sessid_post();?>
<?php if($ID>0 && empty($bCopy)):?>
	<input type="hidden" name="ID" value="<?=$ID?>">
<?php endif;?>
<input type="hidden" name="back_url" value="<?=htmlspecialcharsbx($back_url)?>">
<input type="hidden" name="list_url" value="<?=htmlspecialcharsbx($list_url)?>">

<?php
$tabControl->End();
?>

<?php
$tabControl->ShowWarnings("post_form", $message);
?>


<?php require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
