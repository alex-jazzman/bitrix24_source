<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var array $arParams */
/** @var CBitrixComponentTemplate $this */
/** @global CMain $APPLICATION */

global $APPLICATION;

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty(
	'BodyClass',
	($bodyClass ? $bodyClass . ' ' : '') . 'no-background'
);

\Bitrix\Main\UI\Extension::load('call.component.sync-page');
?>
<div class="call-sync-page">
	<div class="call-sync-page_content" id="call-sync-page_content"></div>
</div>
<script>
	BX.ready(function()
	{
		var app = BX.Vue3.BitrixVue.createApp(BX.Call.Component.SyncPage);
		app.mount('#call-sync-page_content');
	});
</script>
