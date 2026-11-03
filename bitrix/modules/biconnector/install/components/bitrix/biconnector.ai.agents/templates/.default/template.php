<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 * @var CBitrixComponent $component
 * @var array $arResult
 * @var string $templateFolder
 */

use Bitrix\BIConnector\Internal\Integration\AiAssistant\AiAgentsScenarioAvailability;
use Bitrix\BIConnector\Internal\Integration\AiAssistant\AiAgentsScenarioCatalog;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Loader::includeModule('ui');

$containerId = 'biconnector-ai-agents';
$reportsUrl = rtrim(SITE_DIR, '/') . '/bi/dashboard/';

$availability = $arResult['SCENARIO_AVAILABILITY'] ?? null;
$cards = $arResult['SHOW_SCENARIO_CARDS'] ? $arResult['SCENARIO_CARDS'] : [];
$hasCards = $cards !== [] && $availability !== null;

$extensions = [
	'ui.design-tokens',
	'ui.design-tokens.air',
	'ui.system.typography',
	'ui.buttons',
];

if ($hasCards)
{
	$extensions[] = 'ui.icon-set.outline';
	$extensions[] = 'biconnector.ai-agents-section';
}

Extension::load($extensions);

$groupTitles = [
	AiAgentsScenarioCatalog::GROUP_BUILD => Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_GROUP_BUILD'),
	AiAgentsScenarioCatalog::GROUP_ANALYZE => Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_GROUP_ANALYZE'),
];

$cardsByGroup = [];
foreach ($cards as $card)
{
	$cardsByGroup[$card['group']][] = $card;
}

$rootClasses = ['biconnector-ai-agents', '--ui-context-content-dark'];
if (!$hasCards)
{
	// Without the extension, motion cannot be stopped.
	$rootClasses[] = '--backdrop-still';
}

if ($hasCards)
{
	$availabilityParams = ['state' => (string)$availability['state']];
	if ($availabilityParams['state'] === AiAgentsScenarioAvailability::STATE_TARIFF)
	{
		$availabilityParams['limitCode'] = (string)$availability['restrictionCode'];
	}

	$sectionParams = [
		'containerId' => $containerId,
		'cardIds' => array_column($cards, 'id'),
		'availability' => $availabilityParams,
	];
}

/* The control panel selects the active item from the request path. */
$this->setViewTarget('above_pagetitle');
$APPLICATION->IncludeComponent('bitrix:biconnector.apachesuperset.control_panel', '', [], $component);
$this->endViewTarget();

?>

<div
	class="<?= htmlspecialcharsbx(implode(' ', $rootClasses)) ?>"
	id="<?= $containerId ?>"
	data-testid="ai-agents-section"
>
	<?php
	/* The extension attaches video sources after load; the smaller codec comes first. */
	?>
	<div class="biconnector-ai-agents__backdrop" aria-hidden="true">
		<video
			class="biconnector-ai-agents__video"
			data-role="backdrop-video"
			data-testid="ai-agents-backdrop-video"
			autoplay
			muted
			loop
			playsinline
			preload="none"
		>
			<source
				data-role="backdrop-source"
				data-src="<?= htmlspecialcharsbx($templateFolder) ?>/images/backdrop.webm"
				type="video/webm"
			>
			<source
				data-role="backdrop-source"
				data-src="<?= htmlspecialcharsbx($templateFolder) ?>/images/backdrop.mp4"
				type="video/mp4"
			>
		</video>
		<span class="biconnector-ai-agents__spectrum --one"></span>
		<span class="biconnector-ai-agents__spectrum --two"></span>
		<span class="biconnector-ai-agents__spectrum --three"></span>
	</div>
	<div class="biconnector-ai-agents__content">
		<div class="biconnector-ai-agents__hero" data-testid="ai-agents-hero">
			<h2 class="biconnector-ai-agents__hero-title">
				<?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_HERO_TITLE')) ?>
			</h2>
			<p class="biconnector-ai-agents__hero-text">
				<?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_HERO_TEXT')) ?>
			</p>
			<?php if ($hasCards): ?>
				<button
					type="button"
					class="biconnector-ai-agents__motion"
					data-role="motion-toggle"
					data-testid="ai-agents-motion-toggle"
					aria-pressed="false"
				><?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_MOTION_STOP')) ?></button>
			<?php endif; ?>
		</div>
		<?php if ($hasCards): ?>
			<div class="biconnector-ai-agents__columns">
				<?php foreach ($cardsByGroup as $group => $groupCards): ?>
					<section
						class="biconnector-ai-agents__group"
						data-testid="ai-agents-group-<?= htmlspecialcharsbx($group) ?>"
					>
						<?php if (isset($groupTitles[$group])): ?>
							<h3 class="biconnector-ai-agents__group-title">
								<?= htmlspecialcharsbx($groupTitles[$group]) ?>
							</h3>
						<?php endif; ?>
						<div class="biconnector-ai-agents__card-list">
							<?php foreach ($groupCards as $card): ?>
								<?php
								$cardTitleId = $containerId . '-' . $card['id'] . '-title';
								$cardTextId = $containerId . '-' . $card['id'] . '-text';
								?>
								<button
									type="button"
									class="biconnector-ai-agents-card"
									data-role="card"
									data-testid="ai-agents-card"
									data-card-id="<?= htmlspecialcharsbx($card['id']) ?>"
									aria-labelledby="<?= htmlspecialcharsbx($cardTitleId) ?>"
									aria-describedby="<?= htmlspecialcharsbx($cardTextId) ?>"
								>
									<span class="biconnector-ai-agents-card__icon" data-role="card-icon" aria-hidden="true"></span>
									<span
										class="biconnector-ai-agents-card__title"
										id="<?= htmlspecialcharsbx($cardTitleId) ?>"
									>
										<?= htmlspecialcharsbx($card['title']) ?>
									</span>
									<span
										class="biconnector-ai-agents-card__text"
										id="<?= htmlspecialcharsbx($cardTextId) ?>"
									>
										<?= htmlspecialcharsbx($card['description']) ?>
									</span>
									<span class="biconnector-ai-agents-card__state" data-role="card-state"></span>
								</button>
							<?php endforeach; ?>
						</div>
					</section>
				<?php endforeach; ?>
			</div>
			<?php
			/* Keep separate persistent regions for polite and assertive announcements. */
			?>
			<div
				class="biconnector-ai-agents__status"
				data-role="section-status"
				data-testid="ai-agents-status"
				role="status"
				tabindex="-1"
			></div>
			<div
				class="biconnector-ai-agents__status"
				data-role="section-alert"
				data-testid="ai-agents-alert"
				role="alert"
				tabindex="-1"
			></div>
			<?php
			/* Interactive actions stay outside live regions to retain their announced roles. */
			?>
			<div class="biconnector-ai-agents__action" data-role="section-action"></div>
		<?php endif; ?>
		<div class="biconnector-ai-agents__cta">
			<h3 class="biconnector-ai-agents__cta-title ui-headline --md">
				<?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_CTA_TITLE')) ?>
			</h3>
			<p class="biconnector-ai-agents__cta-text ui-text --md">
				<?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_CTA_TEXT')) ?>
			</p>
			<a
				class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps biconnector-ai-agents__cta-button"
				data-testid="ai-agents-cta"
				href="<?= $reportsUrl ?>"
			><?= htmlspecialcharsbx(Loc::getMessage('BICONNECTOR_AI_AGENTS_SECTION_CTA_BUTTON')) ?></a>
		</div>
	</div>
</div>

<?php if ($hasCards): ?>
	<script>
		BX.ready(function() {
			BX.BIConnector.AiAgentsSection.init(<?= Json::encode($sectionParams) ?>);
		});
	</script>
<?php endif; ?>
