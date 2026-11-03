<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 */
$isSettingsHub = ($arParams['IS_SETTINGS_HUB'] ?? null) === true;
?>

<table cellpadding="0" cellspacing="0" border="0" class="field-types-table" data-testid="crm-config-bp-types-list">
<?php foreach ($arResult['ROWS'] as $arRow): ?>
<?php $rowId = htmlspecialcharsbx($arRow['ID']); ?>
<tr data-testid="crm-config-bp-types-row-<?=$rowId?>">
	<td>
		<div class="field-types-name">
			<a
				href="<?=htmlspecialcharsbx($arRow['LINK_LIST'])?>"
				data-testid="crm-config-bp-types-name-link-<?=$rowId?>"
				<?php if ($isSettingsHub): ?>
					data-slider-ignore-autobinding="true" target="_self"
				<?php endif; ?>
			><?=$arRow['NAME']?></a>
		</div>
		<div class="field-types-desc"><?=$arRow['DESC']?></div>
		<div class="field-types-add">
			<a
				href="<?=htmlspecialcharsbx($arRow['LINK_ADD'])?>"
				title="<?=GetMessage('CRM_FIELDS_ADD_FIELD_TITLE')?>"
				data-testid="crm-config-bp-types-add-link-<?=$rowId?>"
				<?php if ($isSettingsHub): ?>
					data-slider-ignore-autobinding="true" target="_self"
				<?php endif; ?>
			><?=GetMessage('CRM_FIELDS_ADD_FIELD')?></a>
		</div>
		<div class="field-types-list">
			<a
				href="<?=htmlspecialcharsbx($arRow['LINK_LIST'])?>"
				title="<?=GetMessage('CRM_FIELDS_LIST_FIELD_TITLE')?>"
				data-testid="crm-config-bp-types-list-link-<?=$rowId?>"
				<?php if ($isSettingsHub): ?>
					data-slider-ignore-autobinding="true" target="_self"
				<?php endif; ?>
			><?=GetMessage('CRM_FIELDS_LIST_FIELD')?></a>
		</div>
	</td>
</tr>
<?php endforeach; ?>
</table>
