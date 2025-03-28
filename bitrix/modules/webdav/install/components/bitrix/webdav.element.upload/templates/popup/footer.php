<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$file = trim(preg_replace("'[\\\\/]+'", "/", (__DIR__."/lang/".LANGUAGE_ID."/footer.php")));
__IncludeLang($file);

$arUserFields = $arResult['USER_FIELDS'] ?? null;
if($arUserFields && count($arUserFields)>0)
{
?>
	<table id='wd_upload_props' width='100%' cellpadding='0' cellspacing='0' bodred='0'>
	<tbody>

<?
	foreach($arUserFields as $FIELD_NAME=>$arUserField)
	{
		$arUserField["VALUE_ID"] = 0;
?>
		<tr>
			<td class="wd-property-name"><?php echo htmlspecialcharsbx($arUserField["EDIT_FORM_LABEL"]) ?>:</td>
			<td class="wd-property-value"><?php
				$APPLICATION->IncludeComponent(
					"bitrix:system.field.edit",
					$arUserField["USER_TYPE_ID"],
					array(
						"bVarsFromForm" => true,
						"arUserField" => $arUserField,
						"form_name" => "wd_upload_form"
					), null, array("HIDE_ICONS" => "Y")
				);
			?>
			</td>
		</tr>
<?
	}
?>

	</tbody>
	</table>
<?
}

if ($arParams["USE_BIZPROC"] != "Y"):
	?><input type="hidden" name="overview" id="wd_upload_overview" value="Y" /><?
/*
?>
<table cellpadding="0" cellspacing="0" width="100%">
<tr>
	<td style="width:30%"></td>
	<td>
		<input type="checkbox" class="checkbox" name="overview" id="wd_upload_overview" value="Y" />
		<label for="wd_upload_overview"><?=GetMessage("WD_OVERVIEW")?></label>
	</td>
</tr>
</table>
<?
 */
endif;
if ($arParams["USE_WORKFLOW"] == "Y" && $arParams["SHOW_WORKFLOW"] != "N"):
?>
	<li class="wd-upload-form-propety">
		<label for="WF_STATUS_ID"><?=GetMessage("WD_WF_STATUS")?>:</label>
		<select name="WF_STATUS_ID" id="WF_STATUS_ID">
			<?foreach ($arResult["WF_STATUSES"] as $key => $val):?>
			<option value="<?=$key?>"<?=($key == $_REQUEST["WF_STATUS_ID"] ? " selected='selected'" : "")?>><?=htmlspecialcharsEx($val)?></option>
			<?endforeach;?>
		</select>
	</li>
	<?
	if (!in_array(2, $arResult["WF_STATUSES_PERMISSION"])):
	?>
	<li class="wd-upload-form-propety">
		<span class="comments"><?=GetMessage("WD_WF_ATTENTION1")?></span> 
	</li>
	<?
	elseif (!CWorkflow::IsAdmin()):
		$arr = array();
		foreach ($arResult["WF_STATUSES_PERMISSION"] as $key => $val):
			if ($val == 2):
				$arr[] = htmlspecialcharsEx($arResult["WF_STATUSES"][$key]);
			endif;
		endforeach;
	?>
	<li class="wd-upload-form-propety">
		<span class="comments"><?=(count($arr) == 1 ? str_replace("#STATUS#", $arr[0], GetMessage("WD_WF_ATTENTION2")) : 
			str_replace("#STATUS#", $arr[0], GetMessage("WD_WF_ATTENTION3")))?></span>
	</li><?
	endif;
elseif ($arParams["USE_BIZPROC"] == "Y"):
	CBPDocument::AddShowParameterInit("webdav", "only_users", $arParams["BIZPROC"]["DOCUMENT_TYPE"], $arParams["BIZPROC"]["ENTITY"]);

	$bizProcIndex = 0;
	$bizProcCounter = 0;
	$arDocumentStates = (isset($arResult['DOCUMENT_STATES']) ? $arResult['DOCUMENT_STATES'] : array());

	if (!empty($arDocumentStates)):
	?>
		<li class="wd-upload-form-propety">
<?/*?>			<div class="wd-upload-form-propety-title"><?=GetMessage("WD_BP")?>:</div><?*/?>
	<?
	foreach ($arDocumentStates as $arDocumentState)
	{
		$bizProcIndex++;
		$canViewWorkflow = CBPDocument::CanUserOperateDocument(
			CBPCanUserOperateOperation::ViewWorkflow,
			$GLOBALS["USER"]->GetID(),
			$arParams["DOCUMENT_ID"],
			array(
				"DocumentType" => $arParams["BIZPROC"]["DOCUMENT_TYPE"], 
				"IBlockPermission" => $arParams["PERMISSION"], 
				"AllUserGroups" => $arResult["CurrentUserGroups"], 
				"DocumentStates" => $arDocumentStates, 
				"WorkflowId" => ($arDocumentState["ID"] > 0 ? $arDocumentState["ID"] : $arDocumentState["TEMPLATE_ID"])));
		if (!$canViewWorkflow || ($arDocumentState['WORKFLOW_STATUS'] !== -1))
			continue;
		$bizProcCounter++;
		?>
			<p class="wd-docstate-title"><?=htmlspecialcharsbx($arDocumentState["TEMPLATE_NAME"])?>
			<? if ($arDocumentState["TEMPLATE_DESCRIPTION"] != ''): ?>
				<img src="/bitrix/js/main/core/images/hint.gif" id="docState_<?=$arDocumentState['ID']?>" />
				<script> BX.hint_replace(BX("docState_<?=$arDocumentState['ID']?>"), "<?=CUtil::JSEscape($arDocumentState["TEMPLATE_DESCRIPTION"])?>");</script>
			<? endif; ?></p>

			<div class="wd-upload-form-propety-item-value">
			<?if ($arDocumentState["STATE_MODIFIED"] <> ''):?>
				<div class="bizproc-workflow-template-param bizproc-field bizproc-field-date">
					<label for="" class="bizproc-field-name">
						<span class="bizproc-field-title"><?=GetMessage("IBEL_BIZPROC_DATE")?></span>
					</label>
					<span class="bizproc-field-value">
						<?=$arDocumentState["STATE_MODIFIED"]?>
					</span>
				</div>
			<?endif;?>
			<?if ($arDocumentState["STATE_NAME"] <> ''):?>
				<div class="bizproc-workflow-template-param bizproc-field bizproc-field-status">
					<label for="" class="bizproc-field-name">
						<span class="bizproc-field-title"><?=GetMessage("IBEL_BIZPROC_STATE")?></span>
					</label>
					<span class="bizproc-field-value">
						<?=$arDocumentState["STATE_TITLE"] <> '' ? $arDocumentState["STATE_TITLE"] : $arDocumentState["STATE_NAME"]?>
					</span>
				</div>
			<?endif;?>
			<?if ($arDocumentState["ID"] == '')
			{
			?><table class="wd-bp-table-params"><?
				CBPDocument::StartWorkflowParametersShow(
					$arDocumentState["TEMPLATE_ID"],
					$arDocumentState["TEMPLATE_PARAMETERS"],
					"iu_upload_form_".$arParams["INDEX_ON_PAGE"],
					false
				);
			?></table><?
			}
			$arEvents = CBPDocument::GetAllowableEvents($GLOBALS["USER"]->GetID(), $arResult["CurrentUserGroups"], $arDocumentState);
			if (count($arEvents) > 0)
			{
?>
				<div class="bizproc-workflow-template-param bizproc-field bizproc-field-events">
					<label for="" class="bizproc-field-name">
						<span class="bizproc-field-title"><?=GetMessage("IBEL_BIZPROC_RUN_CMD")?></span>
					</label>
					<span class="bizproc-field-value bizproc-field-value-select">
						<input type="hidden" name="bizproc_id_<?= $bizProcIndex ?>" value="<?= $arDocumentState["ID"] ?>" />
						<input type="hidden" name="bizproc_template_id_<?= $bizProcIndex ?>" value="<?= $arDocumentState["TEMPLATE_ID"] ?>" />
						<select name="bizproc_event_<?= $bizProcIndex ?>">
							<option value=""><?=GetMessage("IBEL_BIZPROC_RUN_CMD_NO")?></option>
							<?
							foreach ($arEvents as $e)
							{
								?><option value="<?=htmlspecialcharsbx($e["NAME"]) ?>"<?= ($_REQUEST["bizproc_event_".$bizProcIndex] == $e["NAME"]) ? " selected" : ""?>>
									<?= htmlspecialcharsbx($e["TITLE"]) ?>
								</option><?
							}
							?>
						</select>
					</span>
				</div>
<?
			}
?>
			</div>
<?
	}
?>
	<input type="hidden" name="bizproc_index" value="<?= $bizProcIndex ?>" />
<?
	if ($bizProcIndex <= 0)
	{
?>
	<div class="wd-upload-form-propety-text"><?=GetMessage("IBEL_BIZPROC_NA")?></div>
<?
	}
?>
</li>
<?
	endif;
endif;
?>	
</ul>
