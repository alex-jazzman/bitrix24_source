<? if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var \CMain $APPLICATION
 * @var \CUser $USER
 * @var \CDatabase $DB
 * @var \HmsGridProductFieldTeethComponent $component
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
<div class="crm-entity-product-control-text">
    <input type="text" class="ui-ctl-element" id="<?= $arResult["ROW_ID"] ?>_TEETH" name="<?= $arResult["ROW_ID"] ?>_TEETH_control" value="<?= $arResult["VALUE"] ?>" data-field-code="TEETH" data-product-field="Y" data-parent-id="<?= $arResult["ROW_ID"] ?>" />
</div>
