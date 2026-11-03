<?if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
	die();

$navigationAttributes = ($arParams['IS_SETTINGS_HUB'] ?? false) === true
	? ' target="_self" data-slider-ignore-autobinding="true"'
	: '';
?>
<table cellpadding="0" cellspacing="0" border="0" class="field-types-table">
<?foreach($arResult['ROWS'] as $arRow):?>
<?$entityTestId = htmlspecialcharsbx(strtolower(str_replace('_', '-', $arRow['ID'])));?>
<tr>
	<td>
		<div class="field-types-name">
			<a href="<?=htmlspecialcharsbx($arRow['LINK_LIST'])?>"<?=$navigationAttributes?>
				data-testid="crm-config-fields-types-name-link-<?=$entityTestId?>"><?=$arRow['NAME']?></a>
		</div>
		<div class="field-types-desc"><?=$arRow['DESC']?></div>
<?if($arResult['CAN_MANAGE_FIELDS']):?>
		<div class="field-types-add"><a href="<?=htmlspecialcharsbx($arRow['LINK_ADD'])?>"<?=$navigationAttributes?> title="<?=GetMessage('CRM_FIELDS_ADD_FIELD_TITLE')?>"
			data-testid="crm-config-fields-types-add-btn-<?=htmlspecialcharsbx(strtolower(str_replace('_', '-', $arRow['ID'])))?>"><?=GetMessage('CRM_FIELDS_ADD_FIELD')?></a></div>
<?endif;?>
		<div class="field-types-list">
			<a href="<?=htmlspecialcharsbx($arRow['LINK_LIST'])?>"<?=$navigationAttributes?>
				title="<?=GetMessage('CRM_FIELDS_LIST_FIELD_TITLE')?>"
				data-testid="crm-config-fields-types-list-link-<?=$entityTestId?>"><?=GetMessage('CRM_FIELDS_LIST_FIELD')?></a>
		</div>
	</td>
</tr>
<?endforeach;?>
</table>
