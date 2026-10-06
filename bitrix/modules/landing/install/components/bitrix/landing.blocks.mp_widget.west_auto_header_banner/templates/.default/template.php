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
	'ui.design-tokens',
	'ui.icon-set.main',
	'ui.icon-set.outline',
]);

$id = 'widget-' . htmlspecialcharsbx(bin2hex(random_bytes(5)));
$isChineseZone = in_array(
	\CBitrix24::getPortalZone(),
	['cn', 'sc', 'tc'],
	true,
);

$title = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_TITLE');
$text = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_TEXT');
$cardTitles = [
	'1' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TITLE_1'),
	'2' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TITLE_2'),
	'3' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TITLE_3'),
	'4' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TITLE_4'),
];
$cardTexts = [
	'1' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TEXT_1')),
	'2' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TEXT_2'),
	'3' => NameService::replaceCopilotName(Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TEXT_3')),
	'4' => Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_CARD_TEXT_4'),
];
$links = [
	'1' => 'help:#helpdesk=25998227',
];
$buttonText = Loc::getMessage('BLOCK_MP_WIDGET_WEST_AUTO_VIBE_HEADER_BANNER_BUTTON_TEXT');

?>

<div class="landing-block-header-banner justify-content-between d-flex flex-row no-gutters" id="<?= $id ?>">
	<div class="landing-block-header-banner-content d-flex flex-column no-gutters">
		<div class="landing-block-header-banner-title g-font-weight-700 g-mb-15 g-line-height-1 g-mr-10">
			<?= htmlspecialcharsbx($title) ?>
		</div>
		<div class="landing-block-header-banner-text g-font-weight-400 g-font-size-17 g-line-height-1_3">
			<?= htmlspecialcharsbx($text) ?>
		</div>
		<div class="d-flex justify-content-between flex-column">
			<a class="landing-block-header-banner-btn d-flex flex-row border g-border-color g-rounded-10" href="<?= $links[1] ?>">
				<div class="landing-block-header-banner-btn-text g-font-weight-500 g-font-size-16">
					<?= htmlspecialcharsbx($buttonText) ?>
				</div>
				<div class="landing-block-header-banner-btn-icon d-flex flex-column g-rounded-4">
					<div class="ui-icon-set --o-card"></div>
				</div>
			</a>
		</div>
	</div>
	<div class="landing-block-header-banner-card-box d-flex flex-column">
		<?php if (!$isChineseZone): ?>
		<div class="landing-block-header-banner-card d-flex flex-row g-pb-14 g-pl-14 g-pr-14 g-pt-14 --header-banner-personal-card --ui-context-content-dark">
			<div class="landing-block-header-banner-card-icon d-flex flex-column g-rounded-10 --header-banner-personal-card">
				<div class="ui-icon-set --person"></div>
			</div>
			<div class="landing-block-header-banner-card-content d-flex flex-column">
				<div class="landing-block-header-banner-card-title g-font-weight-700 g-line-height-1_3 --header-banner-personal-card">
					<?= $cardTitles[1] ?>
				</div>
				<div class="landing-block-header-banner-card-text g-font-weight-700 g-font-size-13 g-line-height-1">
					<?= $cardTexts[1] ?>
				</div>
			</div>
		</div>
		<?php endif; ?>

		<div class="landing-block-header-banner-card d-flex flex-row g-pb-14 g-pl-14 g-pr-14 g-pt-14 --header-banner-team-card --ui-context-content-dark">
			<div class="landing-block-header-banner-card-icon d-flex flex-column g-rounded-10 --header-banner-team-card">
				<div class="ui-icon-set --persons-2"></div>
			</div>
			<div class="landing-block-header-banner-card-content d-flex flex-column">
				<div class="landing-block-header-banner-card-title g-font-weight-700 g-line-height-1_3 --header-banner-team-card">
					<?= $cardTitles[2] ?>
				</div>
				<div class="landing-block-header-banner-card-text g-font-weight-700 g-font-size-13 g-line-height-1">
					<?= $cardTexts[2] ?>
				</div>
			</div>
		</div>

		<?php if (!$isChineseZone): ?>
		<div class="landing-block-header-banner-card d-flex flex-row g-pb-14 g-pl-14 g-pr-14 g-pt-14 --header-banner-department-card --ui-context-content-dark">
			<div class="landing-block-header-banner-card-icon d-flex flex-column g-rounded-10 --header-banner-department-card">
				<div class="ui-icon-set --persons-3"></div>
			</div>
			<div class="landing-block-header-banner-card-content d-flex flex-column">
				<div class="landing-block-header-banner-card-title g-font-weight-700 g-line-height-1_3 --header-banner-department-card">
					<?= $cardTitles[3] ?>
				</div>
				<div class="landing-block-header-banner-card-text g-font-weight-700 g-font-size-13 g-line-height-1">
					<?= $cardTexts[3] ?>
				</div>
			</div>
		</div>
		<?php endif; ?>

		<div class="landing-block-header-banner-card d-flex flex-row g-pb-14 g-pl-14 g-pr-14 g-pt-14 --header-banner-company-card --ui-context-content-dark">
			<div class="landing-block-header-banner-card-icon d-flex flex-column g-rounded-10 --header-banner-company-card">
				<div class="ui-icon-set --city"></div>
			</div>
			<div class="landing-block-header-banner-card-content d-flex flex-column">
				<div class="landing-block-header-banner-card-title g-font-weight-700 g-line-height-1_3 --header-banner-company-card">
					<?= $cardTitles[4] ?>
				</div>
				<div class="landing-block-header-banner-card-text g-font-weight-700 g-font-size-13 g-line-height-1">
					<?= $cardTexts[4] ?>
				</div>
			</div>
		</div>

	</div>
</div>
