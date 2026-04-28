<?php

use Bitrix\Landing\Site\Type;
use Bitrix\Landing\Vibe\Integration\Intranet\Page;
use Bitrix\Landing\Vibe\Vibe;
use Bitrix\Main\HttpContext;
use Bitrix\Main\UI\Extension;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var \CBitrixComponent $component */

$moduleId = $arResult['VARS']['vibe_module'] ?? '';
$embedId = $arResult['VARS']['vibe_embed'] ?? '';
$vibe = new Vibe($moduleId, $embedId);

$error = Page::checkVibeReadyToComponent($vibe, true);
if ($error !== null)
{
	ShowError($error);

	return;
}

$request = HttpContext::getCurrent()->getRequest();
$isSlider = $request->get('IFRAME') === 'Y';
if (
	$isSlider
	&& $vibe->canEdit()
)
{
	$arParams = Page::prepareEditComponentParams($arParams, $vibe);

	$APPLICATION->includeComponent(
		'bitrix:landing.landing_view',
		'.default',
		[
			'TYPE' => Type::SCOPE_CODE_VIBE,
			'SITE_ID' => $vibe->getSiteId(),
			'LANDING_ID' => $vibe->getLandingId(),
			'FULL_PUBLICATION' => $arParams['EDIT_FULL_PUBLICATION'],
			'DONT_LEAVE_AFTER_PUBLICATION' => $arParams['EDIT_DONT_LEAVE_FRAME'],
			'PANEL_LIGHT_MODE' => $arParams['EDIT_PANEL_LIGHT_MODE'],
			'PAGE_URL_URL_SITES' => $arParams['PAGE_URL_SITES'],
			'PAGE_URL_LANDING_EDIT' => $arParams['PAGE_URL_LANDING_SETTINGS'],
			'PAGE_URL_LANDING_SETTINGS' => $arParams['PAGE_URL_LANDING_SETTINGS'],
			'PAGE_URL_LANDING_DESIGN' => $arParams['PAGE_URL_LANDING_DESIGN'],
			'PAGE_URL_SITE_EDIT ' => $arParams['PAGE_URL_SITE_EDIT'],
			// 'PAGE_URL_SITE_SETTINGS' => $arParams['PAGE_URL_SITE_SETTINGS'],
			'PAGE_URL_SITE_DESIGN' => $arParams['PAGE_URL_SITE_DESIGN'],
			'DRAFT_MODE' => $arParams['DRAFT_MODE'],
			'PARAMS' => $arParams['PARAMS'],
			'SEF' => $arParams['SEF'],
			'AGREEMENT_ACCEPTED' => $arResult['AGREEMENT_ACCEPTED'],
			'AGREEMENT' => $arResult['AGREEMENT'],
		],
		$component
	);
}

// if open by direct link
else
{
	Extension::load(['sidepanel']);

	$vibe->renderView();
	if (!$vibe->canEdit())
	{
		$vibe->showLimitSlider();
	}
	else
	{
		$publicUrl = $vibe->getUrlPublic();
		?>
		<script>
			BX.ready(() => {
				if (typeof BX.SidePanel !== 'undefined')
				{
					const previous = BX.SidePanel.Instance.getPreviousSlider();
					if (previous)
					{
						previous.close();
					}
				}

				BX.SidePanel.Instance.open(
					window.location.href,
					{
						customLeftBoundary: 66,
						events: {
							onCloseComplete: () => {
								window.top.location = '<?= $publicUrl ?>';
							},
						},
					},
				);
			});

		</script>
		<?php
	}
}
?>
