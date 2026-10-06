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
$title = Loc::getMessage('BLOCK_MP_WIDGET_VIBE_AUTO_WEST_TASK_TITLE');
$text = Loc::getMessage('BLOCK_MP_WIDGET_VIBE_AUTO_WEST_TASK_TEXT');
$buttonText = Loc::getMessage('BLOCK_MP_WIDGET_VIBE_AUTO_WEST_TASK_BUTTON_TEXT');

?>

<div class="landing-block-link-task row no-gutters g-cursor-default" id="<?= $id ?>">
	<div class="landing-block-link-task-content d-flex flex-column">
		<div class="g-font-weight-600 g-font-size-25 g-mb-10 g-line-height-1_3">
			<?= htmlspecialcharsbx($title) ?>
		</div>
		<div class="g-font-weight-400 g-font-size-17  g-mb-20 g-line-height-1_2">
			<?= htmlspecialcharsbx($text) ?>
		</div>
		<div
			class="landing-block-link-btn-task g-rounded-10 g-font-weight-500 g-font-size-16 g-line-height-1_3"
			id="feedback-button"
		>
			<?= htmlspecialcharsbx($buttonText) ?>
		</div>
	</div>
	<div class="landing-block-link-img-task"></div>
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
				new BX.Landing.Widget.VibeAutoLinkTask(widgetElement, option);
			}
		}
	});
</script>

