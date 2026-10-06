<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

use Bitrix\Main\Localization\Loc;
use Bitrix\Landing\Copilot\Services\NameService;
\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens.air',
	'ui.icon-set.outline',
	'ui.icon-set.main',
	'ui.icon-set.solid',
]);

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
$isChineseZone = in_array(
	\CBitrix24::getPortalZone(),
	['cn', 'sc', 'tc'],
	true,
);

$title = NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_TITLE'));
$text = NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_TEXT'));
$cardTitles = [
	'1' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TITLE_1')),
	'2' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TITLE_2')),
	'3' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TITLE_3')),
	'4' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TITLE_4')),
];
$cardTexts = [
	'1' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TEXT_1'),
	'2' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TEXT_2'),
	'3' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TEXT_3'),
	'4' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_CARD_TEXT_4'),
];
$buttonText = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_AI_BUTTON_TEXT');
$links = [
	'1' => "https://www.bitrix24.com/upload/files/Creating-an-HRMS-platform-for-14,000-employees--of-a-major-consumer-electronics-retailer.pdf",
	'2' => "/stream/",
	'3' => "/online/",
	'4' => "/crm/catalog/",
	'5' => "/sites/",
];

?>

<?php if (!$isChineseZone): ?>
<div class="landing-block landing-block-overview-ai --ui-context-content-light" id="<?= $id ?>">
	<div class="col">
		<div class="row justify-content-between">
			<div class="d-flex flex-column justify-content-between g-mb-30">
				<div class="landing-block-overview-title-content-ai d-flex flex-row g-mb-10">
					<div class="landing-block-overview-title-icon-ai d-flex flex-column g-rounded-10">
						<div class="ui-icon-set --s-copilot"></div>
					</div>
					<div class="landing-block-overview-title-ai g-font-weight-700 g-font-size-33 d-flex flex-column g-rounded-4">
						<?= htmlspecialcharsbx($title) ?>
					</div>
				</div>
				<div class="landing-block-overview-text-ai g-font-weight-400 g-font-size-17">
					<?= htmlspecialcharsbx($text) ?>
				</div>
			</div>
			<div class="d-flex justify-content-between g-mb-40 flex-column">
				<a class="d-flex flex-row landing-block-overview-btn-ai border g-border-color g-rounded-10" href="<?= $links[1] ?>">
					<div class="landing-block-overview-btn-text-ai g-font-weight-500 g-font-size-16">
						<?= htmlspecialcharsbx($buttonText) ?>
					</div>
					<div class="landing-block-overview-btn-icon-ai d-flex flex-column g-rounded-4">
						<div class="ui-icon-set --open-book"></div>
					</div>
				</a>
			</div>
		</div>
		<div class="row">
			<div class="landing-block-overview-card-box-ai d-flex flex-row g-pl-17 g-pr-17 g-pt-16 g-pb-16 g-rounded-20">
				<a class="landing-block-overview-card-ai d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[2] ?>">
					<div class="landing-block-overview-card-content-ai d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content-ai d-flex flex-row justify-content-between">
							<div class="landing-block-overview-card-title-ai g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[1]) ?>
							</div>
							<div class="landing-block-overview-card-title-more-ai">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class="g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[1]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --ai-img-1"></div>
				</a>
				<a class="landing-block-overview-card-ai d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[3] ?>">
					<div class="landing-block-overview-card-content-ai d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content-ai d-flex flex-row justify-content-between">
							<div class="landing-block-overview-card-title-ai g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[2]) ?>
							</div>
							<div class="landing-block-overview-card-title-more-ai">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class="g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[2]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --ai-img-2"></div>
				</a>
				<a class="landing-block-overview-card-ai d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[4] ?>">
					<div class="landing-block-overview-card-content-ai d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content-ai d-flex flex-row justify-content-between">
							<div class="landing-block-overview-card-title-ai g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[3]) ?>
							</div>
							<div class="landing-block-overview-card-title-more-ai">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class="g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[3]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --ai-img-3"></div>
				</a>
				<a class=" landing-block-overview-card-ai d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[5] ?>">
					<div class="landing-block-overview-card-content-ai d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content-ai d-flex flex-row justify-content-between">
							<div class="landing-block-overview-card-title-ai g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[4]) ?>
							</div>
							<div class="landing-block-overview-card-title-more-ai">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class="g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[4]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --ai-img-4"></div>
				</a>
			</div>
		</div>
	</div>
</div>
<?php endif; ?>