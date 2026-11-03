<?
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

global $APPLICATION;
$arTabs = array();
$arTabs[] = array(
	'id' => 'tab_1',
	'name' => GetMessage('CRM_TAB_1'),
	'title' => GetMessage('CRM_TAB_1_TITLE'),
	'icon' => '',
	'fields'=> $arResult['FIELDS']['tab_1']
);

$elementID = isset($arResult['ELEMENT']['ID']) ? $arResult['ELEMENT']['ID'] : 0;
Loc::loadMessages(
	$_SERVER['DOCUMENT_ROOT']
	. '/bitrix/components/bitrix/crm.interface.form/templates/edit/bitrix/main.interface.form/crm.edit/template.php'
);

$isSidePanel = in_array($arParams['IS_SIDE_PANEL'] ?? false, array(true, 'Y'), true);
if ($isSidePanel && ($arResult['SAVE_SUCCEEDED'] ?? false))
{
	?>
	<script>
		BX.ready(() => {
			const slider = top.BX?.SidePanel?.Instance?.getSliderByWindow(window);
			if (slider)
			{
				slider.getData().set('crmMeasureSaveSucceeded', true);
				slider.close(false);
			}
		});
	</script>
	<?php
	return;
}

$cancelAction = $isSidePanel
	? '(function(){var slider=top.BX.SidePanel.Instance.getSliderByWindow(window);if(slider){slider.close();}})();'
	: "window.location='" . CUtil::JSEscape($arResult['BACK_URL']) . "';"
;
$formButtonsClass = $isSidePanel
	? 'webform-buttons crm-config-measure-edit__buttons --side-panel'
	: 'webform-buttons'
;
$formCustomHtml = '<div class="' . $formButtonsClass . '">'
	. '<span class="webform-button webform-button-create">'
	. '<span class="webform-button-left"></span>'
	. '<input class="webform-button-text" type="submit" name="saveAndView"'
	. ' id="' . htmlspecialcharsbx($arResult['FORM_ID']) . '_saveAndView"'
	. ' data-testid="crm-measure-form-save-button"'
	. ' value="' . htmlspecialcharsbx((string)Loc::getMessage('interface_form_save_and_view')) . '"'
	. ' title="' . htmlspecialcharsbx((string)Loc::getMessage('interface_form_save_and_view_title')) . '" />'
	. '<span class="webform-button-right"></span>'
	. '</span>'
	. '<span class="webform-button">'
	. '<span class="webform-button-left"></span>'
	. '<input class="webform-button-text" type="button" name="cancel"'
	. ' data-testid="crm-measure-form-cancel-button"'
	. ' onclick="' . htmlspecialcharsbx($cancelAction) . '"'
	. ' value="' . htmlspecialcharsbx((string)Loc::getMessage('interface_form_cancel')) . '"'
	. ' title="' . htmlspecialcharsbx((string)Loc::getMessage('interface_form_cancel_title')) . '" />'
	. '<span class="webform-button-right"></span>'
	. '</span>'
	. '</div>'
	. '<input type="hidden" name="measure_id" value="' . (int)$elementID . '"/>'
;
?>
<div
	<?= $isSidePanel ? 'class="crm-config-measure-edit --side-panel"' : '' ?>
	data-testid="crm-measure-form-root"
>
<?php
$APPLICATION->IncludeComponent(
	'bitrix:crm.interface.form',
	'edit',
	array(
		'FORM_ID' => $arResult['FORM_ID'],
		'TABS' => $arTabs,
		'BUTTONS' => array(
			'standard_buttons' => false,
			'custom_html' => $formCustomHtml
		),
		'DATA' => $arResult['ELEMENT'],
		'SHOW_SETTINGS' => 'Y',
		'THEME_GRID_ID' => $arResult['GRID_ID'],
		'SHOW_FORM_TAG' => 'Y'
	),
	$component,
	array('HIDE_ICONS' => 'Y')
);
?>
</div>
