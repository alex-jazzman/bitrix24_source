<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \HmsGridProductFieldIsVhiComponent $component
 * @var \CBitrixComponentTemplate $this
 * @var array $arParams
 * @var array $arResult
 * @var array $templateData
 * @var string $templateFolder
 * @var string $parentTemplateFolder
 * @var string $templateName
 * @var string $componentPath
 */

?>
<div class="crm-entity-product-control-checkbox">
    <input type="checkbox" id="<?= $arResult["ROW_ID"] ?>_IS_VHI" data-field-code="IS_VHI" data-product-field="Y" data-parent-id="<?= $arResult["ROW_ID"] ?>" <?= ($arResult['VALUE'] ? ' checked' : '') ?> />
</div>
