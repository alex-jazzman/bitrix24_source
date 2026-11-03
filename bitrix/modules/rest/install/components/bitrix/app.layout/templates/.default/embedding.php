<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * Bitrix vars
 *
 * @var array $arParams
 * @var array $arResult
 * @var CBitrixComponent $component
 * @var CBitrixComponentTemplate $this
 * @global CMain $APPLICATION
 * @global CUser $USER
 */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;

Loc::loadMessages(__FILE__);
Extension::load(['ui.design-tokens']);

if ($arParams['POPUP'])
{
	$APPLICATION->RestartBuffer();
	$APPLICATION->ShowAjaxHead();
}
elseif (!isset($arParams['SET_TITLE']) || $arParams['SET_TITLE'] !== 'N')
{
	$APPLICATION->SetTitle(htmlspecialcharsbx($arResult['EMBEDDING_TITLE']));
}

if ($arParams['IS_SLIDER'])
{
	$bodyClass = $APPLICATION->getPageProperty('BodyClass', false);
	$bodyClasses = 'app-layout-subscribe-slider-modifier';
	if (($arParams['USE_PADDING'] ?? '') !== 'N')
	{
		$bodyClasses .= ' app-layout-subscribe-renew-modifier-75';
	}
	$APPLICATION->setPageProperty('BodyClass', trim(sprintf('%s %s', $bodyClass, $bodyClasses)));
}

CJSCore::Init(['applayout']);

$appSid = $arResult['APP_SID'];
$isPost = $arResult['EMBEDDING_IS_POST'];
$payload = $arResult['EMBEDDING_PAYLOAD'];
$actionUrl = $arResult['EMBEDDING_ACTION_URL'];
$frameName = $arResult['EMBEDDING_FRAME_NAME'];
$isNonDefaultPlacement = $arResult['EMBEDDING_IS_NON_DEFAULT_PLACEMENT'];
$frameStyle = $arResult['EMBEDDING_FRAME_STYLE'];

if ($isNonDefaultPlacement)
{
	ob_start();
}
?>

<form name="appform_<?=$appSid?>" action="<?=htmlspecialcharsbx($actionUrl)?>" method="<?=$isPost ? 'POST' : 'GET'?>" target="<?=htmlspecialcharsbx($frameName)?>">
<?php
if ($isPost):
	foreach ($payload as $name => $value):
?>
	<input type="hidden" name="<?=htmlspecialcharsbx((string)$name)?>" value="<?=htmlspecialcharsbx((string)$value)?>" />
<?php
	endforeach;
endif;
?>
</form>
<?php
$formHtml = '';
if ($isNonDefaultPlacement)
{
	$formHtml = ob_get_clean();
}
?>
<div
	id="appframe_layout_<?=$appSid?>"<?php if (!empty($frameStyle)) echo ' style="' . implode(';', $frameStyle) . '"'?>
	class="app-frame-layout<?=$isNonDefaultPlacement ? '' : ' app-frame-layout-default'?>"
>
	<iframe id="appframe_<?=$appSid?>" name="<?=htmlspecialcharsbx($frameName)?>" frameborder="0" class="app-frame app-loading" allow="geolocation *; microphone *; camera *; autoplay *;"></iframe>
	<div id="appframe_loading_<?=$appSid?>" class="app-loading-msg"<?php if (isset($arParams['SHOW_LOADER']) && $arParams['SHOW_LOADER'] === 'N'): ?> style="display: none;"<?php endif; ?>>
		<?=Loc::getMessage('REST_AL_EMBEDDING_LOADING')?>
	</div>
</div>
<script>
BX.rest.AppLayout.set(
	'<?=CUtil::JSEscape($arParams['PLACEMENT'])?>',
	'<?=$appSid?>',
	{
		formName: 'appform_<?=$appSid?>',
		frameName: 'appframe_<?=$appSid?>',
		loaderName: 'appframe_loading_<?=$appSid?>',
		layoutName: 'appframe_layout_<?=$appSid?>',
		ajaxUrl: '/bitrix/components/bitrix/app.layout/lazyload.ajax.php',
		controlUrl: '/bitrix/tools/rest_control.php',
		appHost: '<?=CUtil::JSEscape($arResult['CURRENT_HOST'])?>',
		appPort: '',
		appProto: '<?=$arResult['CURRENT_HOST_SECURE'] ? 'https' : 'http'?>',
		skipAvailabilityCheck: true,
		proto: <?=$arResult['CURRENT_HOST_SECURE'] ? 1 : 0?>,
		restPath: '<?=CUtil::JSEscape($arResult['REST_PATH'])?>',
		id: '<?=(int)$arResult['LEGACY_APP_ID']?>',
		appId: '',
		appV: '',
		appI: false,
		memberId: '',
		authId: '',
		authExpires: '',
		refreshId: '',
		isAdmin: false,
		staticHtml: <?=$isPost ? 'false' : 'true'?>,
		appOptions: {},
		userOptions: {},
		placementId: '<?=(int)$arResult['EMBEDDING_ID']?>',
		placementOptions: <?=\CUtil::PhpToJsObject($arParams['PLACEMENT_OPTIONS'])?>
	}
);
BX.rest.AppLayout.get('<?=$appSid?>').denyInterface([
	'setTitle',
	'openApplication',
	'refreshAuth',
	'setUserOption',
	'setAppOption',
	'setInstall',
	'setInstallFinish',
	'showAppForm'
]);
<?php
if ($arParams['POPUP']):
?>
BX.rest.AppLayout.get('<?=$appSid?>').denyInterface(['resizeWindow']);
<?php
endif;
if ($arParams['INITIALIZE'] !== 'N'):
?>
BX.ready(function(){
<?php
	if ($isNonDefaultPlacement):
?>
	var formContainer = BX.create('DIV', {style:{display:'none'}, html: '<?=CUtil::JSEscape($formHtml)?>'});
	document.body.appendChild(formContainer);
<?php
	endif;
?>
	BX.rest.AppLayout.initialize('<?=CUtil::JSEscape($arParams['PLACEMENT'])?>', '<?=$appSid?>');
});
<?php
endif;
?>
</script>
<?php
if ($arParams['POPUP'])
{
	CMain::FinalActions();
	die();
}
