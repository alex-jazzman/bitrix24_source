<?php

use Bitrix\Landing\Site\Type;
use Bitrix\Landing\Vibe\Integration\Intranet\Page;
use Bitrix\Landing\Vibe\Provider\AbstractVibeProvider;
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

if ($moduleId === '' && $embedId === '')
{
	// todo: change to real
	$specialLimitCode = AbstractVibeProvider::DEFAULT_LIMIT_CODE;
}
else
{
	$error = Page::checkVibeReadyToComponent($vibe, false);
	if ($error !== null)
	{
		ShowError($error);

		return;
	}
}

$request = HttpContext::getCurrent()->getRequest();
$isSlider = $request->get('IFRAME') === 'Y';

if ($vibe->canEdit())
{
	$template = $request->get('tpl');
	$notRedirectToEdit = ($request->get('no_redirect') === 'Y') ? 'Y' : 'N';
	if ($template)
	{
		$APPLICATION->includeComponent(
			'bitrix:ui.sidepanel.wrapper',
			'',
			[
				'POPUP_COMPONENT_NAME' => 'bitrix:landing.demo_preview',
				'POPUP_COMPONENT_TEMPLATE_NAME' => '.default',
				'POPUP_COMPONENT_PARAMS' => [
					'CODE' => $template,
					'TYPE' => Type::SCOPE_CODE_VIBE,
					'REPLACE_SITE_ID' => $vibe->getSiteId(),
					'DISABLE_REDIRECT' => $notRedirectToEdit,
					'DONT_LEAVE_FRAME' => 'N',
				],
				'USE_PADDING' => false,
				'PLAIN_VIEW' => true,
				'PAGE_MODE' => false,
				'CLOSE_AFTER_SAVE' => false,
				'RELOAD_GRID_AFTER_SAVE' => false,
				'RELOAD_PAGE_AFTER_SAVE' => true,
			]
		);
	}
	else
	{
		ShowError('Template not found');
	}
}
// can't edit
else
{
	if ($isSlider)
	{
		$APPLICATION->ShowHead();
	}
	$vibe->showLimitSlider($specialLimitCode ?? null);

	if (!$isSlider)
	{
		$vibe->renderView();
	}
	else
	{
		?>
		<script>
			if (typeof BX.SidePanel !== 'undefined')
			{
				const previous = BX.SidePanel.Instance.getPreviousSlider();
				if (previous)
				{
					previous.close();
				}
			}
		</script>
		<?php
	}
}

?>
