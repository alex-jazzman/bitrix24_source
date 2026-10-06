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
]);

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
$isChineseZone = in_array(
	\CBitrix24::getPortalZone(),
	['cn', 'sc', 'tc'],
	true,
);

$title = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_TITLE');
$text = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_TEXT');
$cardTitles = [
	'1' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TITLE_1'),
	'2' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TITLE_2'),
	'3' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TITLE_3')),
	'4' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TITLE_4')),
	'5' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TITLE_5'),
];
$cardTexts = [
	'1' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TEXT_1'),
	'2' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TEXT_2'),
	'3' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TEXT_3'),
	'4' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TEXT_4'),
	'5' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_CARD_TEXT_5')),
];
$buttonText = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_CRM_BUTTON_TEXT');
$links = [
	'1' => "https://www.bitrix24.com/upload/files/Automating-customer-communication-and-sales-for-a-furniture-company.pdf",
	'2' => "/crm/deal/automation/0/",
	'3' => "/crm/deal/automation/0/",
	'4' => "/crm/copilot-call-assessment/",
	'5' => "/online/",
	'6' => "/crm/copilot-call-assessment/",
];
?>

<div class="landing-block landing-block-overview --ui-context-content-light" id="<?= $id ?>">
	<div class="col">
		<div class="row justify-content-between">
			<div class="d-flex flex-column justify-content-between g-mb-30">
				<div class="landing-block-overview-title-content d-flex flex-row g-mb-10">
					<div class="landing-block-overview-title-icon d-flex flex-column g-rounded-10">
						<div class="ui-icon-set --crm"></div>
					</div>
					<div class="landing-block-overview-title g-font-weight-700 g-font-size-33 d-flex flex-column g-rounded-4">
						<?= htmlspecialcharsbx($title) ?>
					</div>
				</div>
				<div class="landing-block-overview-text g-font-weight-400 g-font-size-17">
					<?= htmlspecialcharsbx($text) ?>
				</div>
			</div>
			<div class="d-flex justify-content-between g-mb-40 flex-column">
				<a class="d-flex flex-row landing-block-overview-btn border g-border-color g-rounded-10" href="<?= $links[1] ?>">
					<div class="landing-block-overview-btn-text g-font-weight-500 g-font-size-16">
						<?= htmlspecialcharsbx($buttonText) ?>
					</div>
					<div class="landing-block-overview-btn-icon d-flex flex-column g-rounded-4">
						<div class="ui-icon-set --open-book"></div>
					</div>
				</a>
			</div>
		</div>
		<div class="row">
			<div class="landing-block-overview-card-box d-flex flex-row g-pl-17 g-pr-17 g-pt-16 g-pb-16 g-rounded-20">
				<a class=" landing-block-overview-card d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[2] ?>">
					<div class="landing-block-overview-card-content d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[1]) ?>
							</div>
							<div class="landing-block-overview-card-title-more">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[1]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --crm-img-1"></div>
				</a>
				<a class=" landing-block-overview-card d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[3] ?>">
					<div class="landing-block-overview-card-content d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[2]) ?>
							</div>
							<div class="landing-block-overview-card-title-more">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[2]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --crm-img-2"></div>
				</a>
				<?php if (!$isChineseZone): ?>
				<a class=" landing-block-overview-card d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[4] ?>">
					<div class="landing-block-overview-card-content d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[3]) ?>
							</div>
							<div class="landing-block-overview-card-title-more">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[3]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --crm-img-3"></div>
				</a>
				<?php endif; ?>
				<?php if (!$isChineseZone): ?>
				<a class=" landing-block-overview-card d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[5] ?>">
					<div class="landing-block-overview-card-content d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[4]) ?>
							</div>
							<div class="landing-block-overview-card-title-more">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[4]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --crm-img-4"></div>
				</a>
				<?php endif; ?>
				<?php if (!$isChineseZone): ?>
				<a class=" landing-block-overview-card d-flex flex-column g-rounded-20  g-border-color" href="<?= $links[6] ?>">
					<div class="landing-block-overview-card-content d-flex flex-column g-ml-20 g-mr-20 g-mt-20 g-mb-10">
						<div class="landing-block-overview-card-title-content d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[5]) ?>
							</div>
							<div class="landing-block-overview-card-title-more">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[5]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --crm-img-5"></div>
				</a>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>
