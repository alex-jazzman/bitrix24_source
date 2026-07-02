<?php

use Bitrix\Main\Web\Json;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

/**
 * @global CMain $APPLICATION
 */

IncludeModuleLangFile(__FILE__);

if (!isset($adminFormParams) || !is_array($adminFormParams))
{
	$adminFormParams = array(
		'tabPrefix' => 'cedit'
	);
}
$jsAdminFormParams = Json::encode($adminFormParams);

$arSystemTabsFields = array();

foreach($this->arSystemTabs as $arTab)
{
	if(!array_key_exists("CUSTOM", $arTab) || $arTab["CUSTOM"] !== "Y")
	{
		$arSystemTabsFields[$arTab["DIV"]] = array();
		if(is_array($arTab["FIELDS"]))
		{
			foreach($arTab["FIELDS"] as $i => $arField)
			{
				$arSystemTabsFields[$arTab["DIV"]][$arField["id"]] = $arField["id"];
			}
		}
	}
}

$arSystemTabs = array();
foreach($this->arSystemTabs as $arTab)
{
	if(!array_key_exists("CUSTOM", $arTab) || $arTab["CUSTOM"] !== "Y")
	{
		$arSystemTabs[$arTab["DIV"]] = $arTab["TAB"];
	}
}

$arSystemFields = array();
foreach($this->arSystemTabs as $arTab)
{
	if(!array_key_exists("CUSTOM", $arTab) || $arTab["CUSTOM"] !== "Y")
	{
		if(is_array($arTab["FIELDS"]))
		{
			foreach($arTab["FIELDS"] as $arField)
			{
				$id = htmlspecialcharsbx($arField["id"]);
				$label = htmlspecialcharsbx(rtrim(trim($arField["content"]), " :"));
				if (!empty($arField["delimiter"]))
					$arSystemFields[$id] = "--".$label;
				else
					$arSystemFields[$id] = ($arField["required"]? "*": "&nbsp;&nbsp;").$label;
			}
		}
	}
}

$arAvailableTabs = $arSystemTabs;
$arAvailableFields = $arSystemFields;

$arCustomFields = array();
foreach($this->tabs as $arTab)
{
	if(!array_key_exists("CUSTOM", $arTab) || $arTab["CUSTOM"] !== "Y")
	{
		$ar = array(
			"TAB" => $arTab["TAB"],
			"FIELDS" => array(),
		);
		if(is_array($arTab["FIELDS"]))
		{
			foreach($arTab["FIELDS"] as $arField)
			{
				$id = htmlspecialcharsbx($arField["id"]);
				$label = htmlspecialcharsbx(rtrim(trim($arField["content"]), " :"));
				if(!empty($arField["delimiter"]))
					$ar["FIELDS"][$id] = "--".$label;
				else
					$ar["FIELDS"][$id] = ($arField["required"]? "*": "&nbsp;&nbsp;").$label;
				unset($arAvailableFields[$id]);
			}
		}
		$arCustomFields[$arTab["DIV"]] = $ar;
		unset($arAvailableTabs[$arTab["DIV"]]);
	}
}

$arFormEditMess = array(
	"admin_lib_sett_tab_prompt" => GetMessage("admin_lib_sett_tab_prompt"),
	"admin_lib_sett_tab_default_name" => GetMessage("admin_lib_sett_tab_default_name"),
	"admin_lib_sett_sec_prompt" => GetMessage("admin_lib_sett_sec_prompt"),
	"admin_lib_sett_sec_default_name" => GetMessage("admin_lib_sett_sec_default_name"),
	"admin_lib_sett_sec_rename" => GetMessage("admin_lib_sett_sec_rename"),
	"admin_lib_sett_tab_rename" => GetMessage("admin_lib_sett_tab_rename"),
);

$obJSPopup = new CJSPopup(GetMessage("admin_lib_sett_tab_title"));
$obJSPopup->ShowTitlebar(GetMessage("admin_lib_sett_tab_title"));
$obJSPopup->StartContent();
?>
<script>
var arSystemTabsFields = <?= Json::encode($arSystemTabsFields)?>;
var arSystemTabs = <?= Json::encode($arSystemTabs)?>;
var arSystemFields = <?= Json::encode($arSystemFields)?>;
var arFormEditMess = <?= Json::encode($arFormEditMess)?>;
(BX.defer(Sync))();
</script>
</form>
<form enctype="multipart/form-data" name="form_settings" action="<?= $APPLICATION->GetCurPageParam()?>" method="POST">
<div class="settings-form">
<h2 ondblclick="exportSettingsToPhp(event, '<?= $this->name;?>')"><?= GetMessage("admin_lib_sett_tab_fields")?></h2>
<table width="100%" cellspacing="0">
	<tr valign="center">
		<td colspan="2"><?= GetMessage("admin_lib_sett_tab_available_tabs")?>:</td>
		<td colspan="2"><?= GetMessage("admin_lib_sett_tab_selected_tabs")?>:</td>
	</tr>
	<tr valign="center">
		<td width="0">
			<select class="select" name="available_tabs" id="available_tabs" onchange="Sync();" size="8" style="height: 190px;">
<?php
foreach($arSystemTabs as $id => $label)
{
	echo '<option value="'.htmlspecialcharsbx($id).'">'.htmlspecialcharsbx($label).'</option>';
}
?>
			</select>
		</td>
		<td width="50%" align="center">
			<input type="button" name="tabs_copy" id="tabs_copy" value="&nbsp; &gt; &nbsp;" title="<?= GetMessage("admin_lib_sett_tab_copy")?>" disabled onclick="OnAdd(this.id, <?= htmlspecialcharsbx($jsAdminFormParams); ?>);">
		</td>
		<td width="0">
			<select class="select" name="selected_tabs" id="selected_tabs" size="8" onchange="Sync();" style="height: 190px;">
<?php
foreach($arCustomFields as $tab_id => $arTab)
{
	echo '<option value="'.htmlspecialcharsbx($tab_id).'">'.htmlspecialcharsbx($arTab["TAB"]).'</option>';
}
?>
			</select>
		</td>
		<td width="50%" align="center">
			<input type="button" name="tabs_up" id="tabs_up" class="button" value="<?= GetMessage("admin_lib_sett_up")?>" title="<?= GetMessage("admin_lib_sett_up_title")?>" disabled onclick="BX.selectUtils.moveOptionsUp(document.form_settings.selected_tabs);"><br>
			<input type="button" name="tabs_down" id="tabs_down" class="button" value="<?= GetMessage("admin_lib_sett_down")?>" title="<?= GetMessage("admin_lib_sett_down_title")?>" disabled onclick="BX.selectUtils.moveOptionsDown(document.form_settings.selected_tabs);"><br>
			<input type="button" name="tabs_rename" id="tabs_rename" class="button" value="<?= GetMessage("admin_lib_sett_tab_rename")?>" title="<?= GetMessage("admin_lib_sett_tab_rename_title")?>" disabled onclick="OnRename(this.id);"><br>
			<input type="button" name="tabs_add" id="tabs_add" class="button" value="<?= GetMessage("admin_lib_sett_tab_add")?>" title="<?= GetMessage("admin_lib_sett_tab_add_title")?>" onclick="OnAdd(this.id, <?= htmlspecialcharsbx($jsAdminFormParams); ?>);"><br>
			<input type="button" name="tabs_delete" id="tabs_delete" class="button" value="<?= GetMessage("admin_lib_sett_del")?>" title="<?= GetMessage("admin_lib_sett_del_title")?>" disabled onclick="OnDelete(this.id);"><br>
		</td>
	</tr>
	<tr valign="center">
		<td colspan="2"><?= GetMessage("admin_lib_sett_tab_available_fields")?>:</td>
		<td colspan="2"><?= GetMessage("admin_lib_sett_tab_selected_fields")?>:</td>
	</tr>
	<tr valign="center">
		<td>
			<select class="select" name="available_fields" id="available_fields" size="12" multiple onchange="Sync();" style="height: 255px;">
<?php
foreach($arAvailableFields as $id => $label)
{
	echo '<option value="'.$id.'">'.$label.'</option>';
}
?>
			</select>
		</td>
		<td align="center">
			<input type="button" name="fields_copy" id="fields_copy" value="&nbsp; &gt; &nbsp;" title="<?= GetMessage("admin_lib_sett_fields_copy")?>" disabled onclick="OnAdd(this.id, <?= htmlspecialcharsbx($jsAdminFormParams); ?>);"><br><br>
		</td>
		<td id="selected_fields">
			<select style="display:block; height: 255px;" disabled class="select" name="selected_fields[undef]" id="selected_fields[undef]" size="12" multiple></select>
<?php
foreach($arCustomFields as $tab_id => $arTab)
{
	if(is_array($arTab["FIELDS"]))
	{
		echo '<select style="display:none; height:255px;" class="select" name="selected_fields['.$tab_id.']" id="selected_fields['.$tab_id.']" size="12" multiple onchange="Sync();">';
		foreach($arTab["FIELDS"] as $field_id => $label)
		{
			echo '<option value="'.$field_id.'">'.$label.'</option>';
		}
		echo '</select>';
	}
}
?>
		</td>
		<td align="center">
			<input type="button" name="fields_up" id="fields_up" class="button" value="<?= GetMessage("admin_lib_sett_up")?>" title="<?= GetMessage("admin_lib_sett_up_title")?>" disabled onclick="FieldsUpAndDown('up');"><br>
			<input type="button" name="fields_down" id="fields_down" class="button" value="<?= GetMessage("admin_lib_sett_down")?>" title="<?= GetMessage("admin_lib_sett_down_title")?>" disabled onclick="FieldsUpAndDown('down');"><br>
			<input type="button" name="fields_rename" id="fields_rename" class="button" value="<?= GetMessage("admin_lib_sett_field_rename")?>" title="<?= GetMessage("admin_lib_sett_field_rename_title")?>" disabled onclick="OnRename(this.id);"><br>
			<input type="button" name="fields_add" id="fields_add" class="button" value="<?= GetMessage("admin_lib_sett_field_add")?>" title="<?= GetMessage("admin_lib_sett_field_add_title")?>" onclick="OnAdd(this.id, <?= htmlspecialcharsbx($jsAdminFormParams); ?>);"><br>
			<input type="button" name="fields_delete" id="fields_delete" class="button" value="<?= GetMessage("admin_lib_sett_del")?>" title="<?= GetMessage("admin_lib_sett_fields_delete")?>" disabled onclick="OnDelete(this.id);">
		</td>
	</tr>
</table>
<?php
if($GLOBALS["USER"]->CanDoOperation('edit_other_settings')):
?>
<h2><?= GetMessage("admin_lib_sett_common")?></h2>
<table cellspacing="0" width="100%">
	<tr>
		<td><input type="checkbox" name="set_default" id="set_default" value="Y"></td>
		<td><label for="set_default"><?= GetMessage("admin_lib_sett_common_set")?></label></td>
		<td><a class="delete-icon" title="<?= GetMessage("admin_lib_sett_common_del")?>" href="javascript:if(confirm('<?= GetMessage("admin_lib_sett_common_del_conf")?>'))<?= $this->name?>.DeleteSettings(true)"></a></td>
	</tr>
</table>
<?php
endif
?>
	<div id="save_settings_error" class="settings-error">
		<p class="settings-error-header"><?=GetMessage('SAVE_SETTINGS_ERROR_TITLE'); ?></p>
		<p class="settings-error-message"><?=GetMessage('SAVE_SETTINGS_ERROR'); ?></p>
		<div id="absent_required_fields" class="absent-fields"></div>
	</div>
</div>
</form>
<?php
$obJSPopup->StartButtons();
?>
<input type="button" id="save_settings" value="<?= GetMessage("admin_lib_sett_save")?>" onclick="<?= $this->name?>.SaveSettings(this);" title="<?= GetMessage("admin_lib_sett_save_title")?>" class="adm-btn-save">
<input type="button" value="<?= GetMessage("admin_lib_sett_cancel")?>" onclick="<?= $this->name?>.CloseSettings()" title="<?= GetMessage("admin_lib_sett_cancel_title")?>">
<input type="button" value="<?= GetMessage("admin_lib_sett_reset")?>" onclick="if(confirm('<?= GetMessage("admin_lib_sett_reset_ask")?>'))<?= $this->name?>.DeleteSettings()" title="<?= GetMessage("admin_lib_sett_reset_title")?>">
<?php
$obJSPopup->EndButtons();
