<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens.air',
	'ui.feedback.form',
]);

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));

$title = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_FOOTER_BANNER_TITLE');
$text = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_FOOTER_BANNER_TEXT');
$buttonText = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_FOOTER_BANNER_BUTTON_TEXT');


?>

<div class="landing-block-footer-banner d-flex flex-column no-gutters" id="<?= $id ?>">
	<div class="landing-block-footer-banner-content d-flex flex-column g-mb-10">
		<div class="landing-block-footer-banner-title g-font-weight-600 g-font-size-25 g-mt-50 g-mb-15 g-line-height-1_3 g-mr-10">
			<?= htmlspecialcharsbx($title) ?>
		</div>
		<div class="landing-block-footer-banner-text g-font-weight-400 g-font-size-17 g-line-height-1_2">
			<?= htmlspecialcharsbx($text) ?>
		</div>

	</div>


	<div
		class="landing-block-footer-banner-btn g-rounded-10 g-font-weight-500 g-font-size-16 g-line-height-1_3"
		id="feedback-button"
	>
		<?= htmlspecialcharsbx($buttonText) ?>
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
				new BX.Landing.Widget.VibeAutoWestFooter(widgetElement, option);
			}
		}
	});
</script>

