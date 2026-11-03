<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Crm\Feature;

/** @global CMain $APPLICATION */
/** @var array $arParams */
/** @var array $arResult */
/** @var \CBitrixComponentTemplate $this */
/** @var \SalesTunnels $component */

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.analytics',
	'main.d3js',
	'main.kanban',
	'sidepanel',
	'ui.notification',
	'dd',
	'ui.popup',
	'crm.restriction.bitrix24',
	'crm.stage.color',
	'crm_common',
]);

$component->addToolbar($this);

?>
<div class="crm-st" data-testid="crm-sales-tunnels-root">
	<div class="crm-st-container">
		<div class="crm-st-categories" data-testid="crm-sales-tunnels-categories"> </div>
		<svg class="crm-st-svg-root"> </svg>
		<svg class="crm-st-svg-links-root"> </svg>
	</div>
	<div class="crm-st-footer">
		<? if ($arResult['isCategoryCreatable']) : ?>
			<button class="ui-btn ui-btn-link ui-btn-xs ui-btn-icon-add crm-st-add-category-btn" data-testid="crm-sales-tunnels-add-category-btn"><?=Loc::getMessage('CRM_ST_ADD_NEW_CATEGORY_BUTTON_LABEL2')?></button>
		<? endif; ?>
	</div>
</div>


<?php
//load Bizproc Automation API
$APPLICATION->includeComponent(
	'bitrix:bizproc.automation',
	'',
	[
		'API_MODE' => 'Y',
		'DOCUMENT_TYPE' => \CCrmBizProcHelper::ResolveDocumentType($arResult['entityTypeId']),
	]
);
?>
<script>
	BX.message(<?=CUtil::phpToJsObject(Loc::loadLanguageFile(__FILE__))?>);

	var workarea = document.getElementById('workarea-content');
	if (workarea)
    {
    	BX.Dom.addClass(workarea, 'ui-page-slider-workarea-content-padding');
    }

	void new BX.Crm.SalesTunnels.Manager({
		entityTypeId: <?=(int)$arResult['entityTypeId']?>,
		documentType: <?= \Bitrix\Main\Web\Json::encode($arResult['documentType']) ?>,
        container: document.querySelector('.crm-st'),
		addCategoryButtonTop: document.querySelector('.crm-st-add-category-btn-top'),
		helpButton: document.querySelector('.crm-st-help-button'),
		categories: <?=CUtil::phpToJsObject($arResult['categories'])?>,
		tunnelScheme: <?=CUtil::phpToJsObject($arResult['tunnelScheme'])?>,
		analyticsLabels: <?= \Bitrix\Main\Web\Json::encode($arResult['analyticsLabels'])?>,

		isAutomationEnabled: <?=($arResult['isAutomationEnabled'] ? 'true' : 'false')?>,
		isStagesEnabled: <?=($arResult['isStagesEnabled'] ? 'true' : 'false')?>,
		isCategoryEditable: <?=CUtil::phpToJsObject($arResult['isCategoryEditable'])?>,
		isCategoryCreatable: <?=CUtil::phpToJsObject($arResult['isCategoryCreatable'])?>,
		isCategoryAccessEditable: <?=CUtil::phpToJsObject($arResult['isCategoryAccessEditable'])?>,

		areStagesEditable: <?=CUtil::phpToJsObject($arResult['areStagesEditable'])?>,
		areTunnelsEditable: <?=CUtil::phpToJsObject($arResult['areTunnelsEditable'])?>,
		isAvailableGenerator: <?=CUtil::phpToJsObject($arResult['isAvailableGenerator'])?>,

		robotsUrl: '<?=$arResult['robotsUrl']?>',
		generatorUrl: '<?=$arResult['generatorUrl']?>',
		permissionEditUrl: '<?= \CUtil::JSEscape(
			\Bitrix\Crm\Service\Container::getInstance()->getRouter()->getEntityPermissionsUrl((int)$arResult['entityTypeId'])
		)
		?>',
		allowWrite: true,
	});
</script>
