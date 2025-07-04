<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bitrix24\Feature;
use Bitrix\Main\UI\Extension;

Extension::load(['ui.icons', 'ui.fonts.opensans']);

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . ' no-background no-all-paddings pagetitle-toolbar-field-view ');
$APPLICATION->IncludeComponent('bitrix:ui.info.helper', '');

$sliderCode = $arResult['SLIDER_CODE'] ?? null;

if (!$sliderCode)
{
	$sliderCode = (
		Feature::isFeatureEnabled('crm_analytics_limit_reached')
			? 'limit_crm_analytics_max_number'
			: 'limit_crm_analytics_1000_number'
	);
}
?>

<div class="crm-analytics-dashboard-mask">
	<div class="crm-analytics-dashboard-mask-img"></div>
	<div class="crm-analytics-dashboard-mask-content">
		<div class="crm-analytics-dashboard-mask-blur-box"></div>
		<div class="crm-analytics-dashboard-mask-text"></div>
	</div>
</div>
<script>
	BX.UI.InfoHelper.show('<?=$sliderCode?>');
</script>
