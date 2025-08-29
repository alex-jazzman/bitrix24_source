<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var \CMain $APPLICATION */

/** @var array $arParams */

/** @var array $arResult */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Loc::loadMessages(__FILE__);

Extension::load(['ui.feedback.form']);

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));

$isTrialActive = $arResult['IS_TRIAL_ACTIVE'] ?? false;
$isTrialAlreadyActivated = $arResult['IS_TRIAL_ALREADY_ACTIVATED'] ?? false;

$trialButtonText = Loc::getMessage('BLOCK_MP_WIDGET_ENT_WEST_BUTTON_TRIAL');
$priceButtonText = Loc::getMessage('BLOCK_MP_WIDGET_ENT_WEST_BUTTON_PRICE');
$trialText = Loc::getMessage('BLOCK_MP_WIDGET_ENT_WEST_TEXT');
$priceText = Loc::getMessage('BLOCK_MP_WIDGET_ENT_WEST_TEXT_2');
$trialActivatedTitle = Loc::getMessage('BLOCK_MP_WIDGET_ENT_WEST_TITLE');
?>

<div class="g-pl-30 g-pr-30 g-pt-30 g-pb-25" id="<?= $id ?>">
	<div class="row no-gutters">
		<div class="col-lg-9 col-md-6 col-sm-12">
			<div
				class="landing-block-node-title g-font-weight-600 g-font-size-25 g-color g-mb-30"
				style="--color: #1f86ff;"
			>
				Main title
			</div>
			<div
				class="landing-block-node-subtitle g-font-size-25 g-color g-mb-25"
				style="--color: #000;"
			>
				Subtitle of the block
			</div>
			<div
				id="feedback-button"
				class="g-pl-16 g-pr-16 g-pt-7 g-pb-7 g-rounded-10 g-font-size-20 g-color text-center g-cursor-pointer"
				style="--color: #fff; display: inline-flex; background-color: #1f86ff;"
			>
				Block Button
			</div>
		</div>
		<div class="col-lg-3 col-md-6 col-sm-12">
			<img style="width: 100%; height: auto; object-fit: cover;" alt="" src="https://cdn.bitrix24.site/bitrix/images/landing/vibe/auto/vibe-auto-1.png" class="g-cursor-default">
		</div>
	</div>
</div>

<script>
	BX.ready(function() {
		const editModeElement = document.querySelector('main.landing-edit-mode');
		if (!editModeElement)
		{
			const widgetElement = document.querySelector('#<?= $id ?>');
			if (widgetElement)
			{
				const option = <?= Json::encode($arResult['FEEDBACK_FORM'] ?? []) ?>;
				new BX.Landing.Widget.VibeAuto(widgetElement, option);
			}
		}
	});
</script>
