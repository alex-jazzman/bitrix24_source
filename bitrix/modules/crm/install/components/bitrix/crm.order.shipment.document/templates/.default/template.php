<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)die();

/** @var \CCrmRequisiteFormEditorComponent $component */

global $APPLICATION;

CJSCore::Init(array('date', 'popup', 'ajax', 'tooltip', 'ui.fonts.opensans'));

\Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/js/crm/css/slider.css');
\Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/js/crm/css/crm.css');
\Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/themes/.default/crm-entity-show.css');
Bitrix\Main\Page\Asset::getInstance()->addJs('/bitrix/components/bitrix/crm.entity.details/templates/.default/script.js');
\Bitrix\Main\Page\Asset::getInstance()->addCss('/bitrix/themes/.default/bitrix24/crm-entity-show.css');

$guid = $arResult['GUID']."_editor";
$prefix = mb_strtolower($guid);
$activityEditorID = "{$prefix}_editor";
//	$readOnly = $arResult['READ_ONLY'];
$containerId = "{$guid}_container";

$wrapperId = "wrapper_".mb_strtolower($prefix);

$editorContext = array(
	'CATEGORY_ID' => $arResult['CATEGORY_ID'],
	'PARAMS' => $arResult['CONTEXT_PARAMS']
);
?>
<div id="<?=htmlspecialcharsbx($wrapperId)?>">
	<?
		$APPLICATION->IncludeComponent(
			'bitrix:crm.entity.editor',
			'',
			array(
				'ENTITY_TYPE_ID' => \CCrmOwnerType::OrderShipment,
				'ENTITY_ID' => $arResult['ENTITY_ID'],
				'READ_ONLY' => false,
				'INITIAL_MODE' => 'EDIT',
				'GUID' => $guid,
				'CONFIG_ID' => $arResult['EDITOR_CONFIG_ID'],
				'ENTITY_CONFIG' => $arResult['ENTITY_CONFIG'],
				'ENTITY_CONTROLLERS' => $arResult['ENTITY_CONTROLLERS'],
				'ENTITY_FIELDS' => $arResult['ENTITY_FIELDS'],
				'ENTITY_DATA' => $arResult['ENTITY_DATA'],
				'ENABLE_SECTION_EDIT' => false,
				'ENABLE_SECTION_CREATION' => false,
				'ENABLE_MODE_TOGGLE' => false,
				'DISABLE_REST' => true,
				'ENABLE_USER_FIELD_CREATION' => false,
				'ENABLE_AJAX_FORM' => true,
				'SERVICE_URL' => '/bitrix/components/bitrix/crm.order.shipment.document/ajax.php?'.bitrix_sessid_get(),
				'EXTERNAL_CONTEXT_ID' => $arResult['EXTERNAL_CONTEXT_ID'],
				'CONTEXT_ID' => $arResult['CONTEXT_ID'],
				'CONTEXT' => $editorContext
			)
		);
	?>
</div>
<script>
	BX.ready(
		function()
		{
			BX.Crm.OrderShipmentDocument.create("<?=CUtil::JSEscape($guid)?>", {
				entityId: '<?=htmlspecialcharsbx($arResult['ENTITY_ID'])?>'
			});
		}
	);
</script><?
