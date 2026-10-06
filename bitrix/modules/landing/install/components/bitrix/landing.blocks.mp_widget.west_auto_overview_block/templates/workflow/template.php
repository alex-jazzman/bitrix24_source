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

$title = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_TITLE');
$text = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_TEXT');
$cardTitles = [
	'1' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_CARD_TITLE_1'),
	'2' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_CARD_TITLE_2')),
];
$cardTexts = [
	'1' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_CARD_TEXT_1'),
	'2' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_CARD_TEXT_2'),
];
$buttonText = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_OVERVIEW_BLOCK_WORKFLOW_BUTTON_TEXT');
$links = [
	'1' => "https://www.bitrix24.com/upload/files/Setting-up-workflow-automation-for-an-architectural-design-studio.pdf",
	'2' => "/bizproc/userprocesses/",
	'3' => "/company/personal/user/0/tasks/flow/",
];

?>

<div class="landing-block landing-block-overview-workflow --ui-context-content-light" id="<?= $id ?>">
	<div class="col">
		<div class="row justify-content-between">
			<div class="d-flex flex-column justify-content-between g-mb-30">
				<div class="landing-block-overview-title-content-workflow d-flex flex-row g-mb-10">
					<div class="landing-block-overview-title-icon-workflow d-flex flex-column g-rounded-10">
						<div class="ui-icon-set --persons-3"></div>
					</div>
					<div class="landing-block-overview-title-workflow g-font-weight-700 g-font-size-33 d-flex flex-column g-rounded-4">
						<?= htmlspecialcharsbx($title) ?>
					</div>
				</div>
				<div class="landing-block-overview-text-workflow g-font-weight-400 g-font-size-17">
					<?= htmlspecialcharsbx($text) ?>
				</div>
			</div>
			<div class="d-flex justify-content-between g-mb-40 flex-column">
				<a class="d-flex flex-row landing-block-overview-btn-workflow border g-border-color g-rounded-10" href="<?= $links[1] ?>">
					<div class="landing-block-overview-btn-text-workflow g-font-weight-500 g-font-size-16">
						<?= htmlspecialcharsbx($buttonText) ?>
					</div>
					<div class="landing-block-overview-btn-icon-workflow d-flex flex-column g-rounded-4">
						<div class="ui-icon-set --open-book"></div>
					</div>
				</a>
			</div>
		</div>
		<div class="row">
			<div class="landing-block-overview-card-box-workflow d-flex flex-row g-pl-17 g-pr-17 g-pt-16 g-pb-16 g-rounded-20">
				<a class=" landing-block-overview-card-workflow d-flex flex-row g-rounded-20  g-border-color" href="<?= $links[2] ?>">
					<div class="landing-block-overview-card-content-workflow d-flex flex-column g-ml-20 g-mt-20 g-mb-20">
						<div class="landing-block-overview-card-title-content-workflow d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title-workflow g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[1]) ?>
							</div>
							<div class="landing-block-overview-card-title-more-workflow">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[1]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --workflow-img-1"></div>
				</a>
				<?php if (!$isChineseZone): ?>
				<a class=" landing-block-overview-card-workflow d-flex flex-row g-rounded-20  g-border-color" href="<?= $links[3] ?>">
					<div class="landing-block-overview-card-content-workflow d-flex flex-column g-ml-20 g-mt-20 g-mb-20">
						<div class="landing-block-overview-card-title-content-workflow d-flex flex-row justify-content-between">
							<div class=" landing-block-overview-card-title-workflow g-font-size-17 g-font-weight-700 g-line-height-1_3">
								<?= htmlspecialcharsbx($cardTitles[2]) ?>
							</div>
							<div class="landing-block-overview-card-title-more-workflow">
								<div class="ui-icon-set --chevron-right-m"></div>
							</div>
						</div>
						<div class=" g-font-size-13 g-font-weight-400 g-line-height-1_3">
							<?= htmlspecialcharsbx($cardTexts[2]) ?>
						</div>
					</div>
					<div class="landing-block-overview-card-img --workflow-img-2"></div>
				</a>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>