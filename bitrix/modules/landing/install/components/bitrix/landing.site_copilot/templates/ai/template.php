<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Landing\Copilot\Services\NameService;
use Bitrix\Landing\Manager;
use Bitrix\Landing\Metrika\EditorOpenEventResolver;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Loc::loadMessages(__FILE__);

$aiSiteTriggerBindingId = (int)($arResult['AI_SITE_BINDING_ID'] ?? 0);
$aiSiteTriggerCode = (string)($arResult['AI_SITE_TRIGGER_CODE'] ?? '');
$aiSiteTriggerContext = $arResult['AI_SITE_TRIGGER_CONTEXT'] ?? [];
if (!is_array($aiSiteTriggerContext))
{
	$aiSiteTriggerContext = [];
}
$aiSiteTriggerEnabled = ($arResult['AI_SITE_TRIGGER_ENABLED'] ?? false) === true
	&& $aiSiteTriggerBindingId > 0
	&& $aiSiteTriggerCode !== ''
;
$isAiAssistantChatExpandable = $aiSiteTriggerEnabled;
$isAiAssistantToggleDisabled = !$isAiAssistantChatExpandable;
$aiAssistantChatColumnId = 'landing-site-copilot-ai-chat-column';
$aiAssistantPanelClass = 'landing-site-copilot-ai landing-ai-assistant-panel';
if (!$isAiAssistantChatExpandable)
{
	$aiAssistantPanelClass .= ' landing-ai-assistant-panel--chat-minimized';
}

$extensions = [
	'main.core',
	'landing_master',
	'landing.ui.button.basebutton',
	'landing.copilot.generation-observer',
	'landing.copilot.change-ai-site-editor-sync',
	'ui.icon-set.actions',
	'ui.design-tokens',
	'ui.a11y',
	'intranet.sidepanel.bindings',
];
if ($aiSiteTriggerEnabled)
{
	$extensions[] = 'landing.aiassistant.widgetpanel';
	$extensions[] = 'aiassistant.trigger';
}

Extension::load($extensions);

Manager::setPageTitle(NameService::replaceCopilotName(Loc::getMessage('LANDING_SITE_PAGE_TITLE')));

$APPLICATION->SetAdditionalCSS($templateFolder . '/style.css');
$aiAssistantDialogId = (string)($arResult['AI_ASSISTANT_DIALOG_ID'] ?? '');
if (!preg_match('/^chat\d+$/', $aiAssistantDialogId))
{
	$aiAssistantDialogId = '';
}
$aiAssistantDialogIdJson = Json::encode($aiAssistantDialogId);
$imApplicationData = Json::encode($arResult['IM_APPLICATION_DATA'] ?? []);
$initialPrompt = Json::encode($arResult['INITIAL_PROMPT'] ?? '');
$aiSiteTriggerOptions = Json::encode([
	'enabled' => $aiSiteTriggerEnabled,
	'triggerCode' => $aiSiteTriggerCode,
	'bindingId' => $aiSiteTriggerBindingId,
	'triggerContext' => $aiSiteTriggerContext,
]);
$landingViewUrlTemplate = Json::encode(
	($arParams['~PAGE_URL_LANDING_VIEW'] ?? '') ?: '/sites/site/#site_show#/view/#landing_edit#/'
);
$editorFromGeneratorParam = Json::encode(EditorOpenEventResolver::FROM_GENERATOR_PARAM);
$editorFromGeneratorParamValue = Json::encode(EditorOpenEventResolver::FROM_GENERATOR_PARAM_VALUE);
$placeholderProgressPhrases = Json::encode(array_map(
	static fn(?string $phrase): string => NameService::replaceCopilotName($phrase),
	[
		Loc::getMessage('LANDING_COPILOT_AI_SITE_PLACEHOLDER'),
		Loc::getMessage('LANDING_COPILOT_AI_SITE_PLACEHOLDER_1'),
		Loc::getMessage('LANDING_COPILOT_AI_SITE_PLACEHOLDER_2'),
	]
));
$placeholderProgressLabel = htmlspecialcharsbx(Loc::getMessage('LANDING_COPILOT_AI_SITE_PROGRESS_LABEL'));
$placeholderA11yMessages = Json::encode([
	'generationStarted' => Loc::getMessage('LANDING_COPILOT_AI_SITE_A11Y_GENERATION_STARTED'),
	'generationFinished' => Loc::getMessage('LANDING_COPILOT_AI_SITE_A11Y_GENERATION_FINISHED'),
	'generationFailed' => Loc::getMessage('LANDING_COPILOT_AI_SITE_A11Y_GENERATION_FAILED'),
]);
$topPanelExitHint = htmlspecialcharsbx(Loc::getMessage('LANDING_COPILOT_AI_TOP_PANEL_EXIT_HINT'));
$initialPlaceholderMessage = htmlspecialcharsbx(Loc::getMessage('LANDING_COPILOT_AI_SITE_INITIAL_PLACEHOLDER'));
$initialPlaceholderCopilotName = htmlspecialcharsbx(NameService::getCopilotName() ?? '#COPILOT_NAME#');
$initialPlaceholderText = str_replace(
	'#COPILOT_NAME#',
	'<span class="landing-site-copilot-ai-placeholder-initial-text-name">' . $initialPlaceholderCopilotName . '</span>',
	$initialPlaceholderMessage,
);
$pathTemplate24 = getLocalPath('templates/' . Manager::getTemplateId(Manager::getMainSiteId()));

$asset = Asset::getInstance();
$asset->addJs($templateFolder . '/script.js');
$cssFiles = [
	$pathTemplate24 . '/theme.css',
	$pathTemplate24 . '/assets/vendor/bootstrap/bootstrap.css',
	'/bitrix/components/bitrix/landing.landing_view/templates/.default/style.css',
	'/bitrix/components/bitrix/landing.selector/templates/.default/style.css',
];

foreach ($cssFiles as $cssFile) {
	$asset->addCSS($cssFile);
}
?>

<div class="<?= $aiAssistantPanelClass ?>" data-testid="landing-ai-site-generation-page">
	<div class="landing-site-copilot-ai-site landing-ai-assistant-panel__main">
		<div class="landing-ui-panel landing-ui-panel-top landing-ui-panel-top-ai" data-testid="landing-ai-site-top-panel">
			<div class="landing-ui-panel-top-ai__brand">
				<a href="/sites/" class="landing-ui-panel-top-ai__brand-link" data-slider-ignore-autobinding="true" target="_top" data-testid="landing-ai-site-exit-link">
					<span
						class="ui-icon-set --o-home landing-ui-panel-top-ai__home"
						role="img"
						aria-label="<?= $topPanelExitHint ?>"
						data-hint="<?= $topPanelExitHint ?>"
						data-hint-no-icon=""
					></span>
					<span class="landing-ui-panel-top-ai__product"><?= Loc::getMessage('LANDING_COPILOT_AI_TOP_PANEL_TITLE') ?></span>
				</a>
			</div>
			<div class="landing-ui-panel-top-ai__divider"></div>
			<div class="landing-ui-panel-top-ai__title">
				<?= Loc::getMessage('LANDING_COPILOT_AI_TOP_PANEL_SITE_NAME') ?>
			</div>
			<div class="landing-ui-panel-top-ai__title-icon ui-icon-set --o-no-cloud-sync" aria-hidden="true"></div>
			<div class="landing-ui-panel-top-ai__spacer"></div>
			<div class="landing-ui-panel-top-devices landing-ui-disabled" aria-hidden="true">
				<div class="landing-ui-panel-top-devices-inner">
					<button class="landing-ui-button landing-ui-button-desktop active" data-id="desktop_button" disabled>
						<span class="ui-icon-set --o-screen" aria-hidden="true"></span>
					</button>
					<button class="landing-ui-button landing-ui-button-tablet" data-id="tablet_button" disabled>
						<span class="ui-icon-set --o-tablet" aria-hidden="true"></span>
					</button>
					<button class="landing-ui-button landing-ui-button-mobile" data-id="mobile_button" disabled>
						<span class="ui-icon-set --o-mobile" aria-hidden="true"></span>
					</button>
				</div>
			</div>
			<div class="landing-ui-panel-top-ai__spacer"></div>
			<div class="landing-ui-panel-top-history" aria-hidden="true">
				<span class="landing-ui-panel-top-history-button landing-ui-panel-top-history-undo landing-ui-disabled"></span>
				<span class="landing-ui-panel-top-history-button landing-ui-panel-top-history-redo landing-ui-disabled"></span>
			</div>
			<div class="landing-ui-panel-top-ai__actions" id="landing-panel-settings">
				<div
					class="landing-ui-panel-top-ai__icon-button landing-ui-panel-top-ai__publication-button landing-ui-panel-top-pub-btn"
					id="landing-popup-preview-btn"
					aria-hidden="true"
					data-hint="<?= Loc::getMessage('LANDING_CMP_TOP_PANEL_PREVIEW_BTN_TEXT') ?>"
					data-hint-no-icon=""
				>
					<span class="ui-icon-set --o-cloud"></span>
				</div>
				<button
					class="ui-btn --air --style-outline-no-accent ui-btn-no-caps ui-btn-sm landing-ui-panel-top-ai__features landing-ui-panel-top-menu-link-features"
					id="landing-popup-features-btn"
					type="button"
					data-testid="landing-ai-site-features-btn"
				>
					<span class="landing-ui-panel-top-ai__features-text">
						<?= Loc::getMessage('LANDING_CMP_TOP_PANEL_FEATURES_BTN_TEXT') ?>
					</span>
					<span class="ui-icon-set --server-settings landing-ui-panel-top-ai__features-icon" aria-hidden="true"></span>
				</button>
				<div class="landing-ui-panel-top-chat-toggle-container landing-ai-assistant-panel__toggle-container">
					<button
						class="landing-ui-panel-top-ai__icon-button landing-ui-panel-top-chat-toggle landing-ai-assistant-panel__toggle"
						type="button"
						data-testid="landing-ai-site-chat-toggle-btn"
						aria-expanded="<?= $isAiAssistantChatExpandable ? 'true' : 'false' ?>"
						<?= $isAiAssistantChatExpandable ? 'aria-controls="' . $aiAssistantChatColumnId . '"' : '' ?>
						<?= $isAiAssistantToggleDisabled ? 'disabled' : '' ?>
					>
						<?= Loc::getMessage('LANDING_COPILOT_AI_CHAT_TOGGLE_CLOSE') ?>
					</button>
				</div>
			</div>
		</div>
		<div
			class="landing-site-copilot-ai-placeholder"
			data-testid="landing-ai-site-generation-placeholder"
			data-js-landing-site-copilot-ai-placeholder-video-container
			data-landing-site-copilot-ai-placeholder-video-container
			data-landing-site-copilot-ai-placeholder-video-state="paused"
		>
			<span
				class="landing-site-copilot-ai-placeholder-glow --hidden"
				aria-hidden="true"
				data-landing-site-copilot-ai-placeholder-animation
			>
				<span
					class="landing-site-copilot-ai-placeholder-glow-beam"
					data-landing-site-copilot-ai-placeholder-animation-beam
				></span>
			</span>
			<span class="landing-site-copilot-ai-placeholder-content">
				<span class="landing-site-copilot-ai-placeholder-video-container">
					<video
						class="landing-site-copilot-ai-placeholder-video"
						muted
						loop
						playsinline
						preload="auto"
						aria-hidden="true"
						data-js-landing-site-copilot-ai-placeholder-video
						data-landing-site-copilot-ai-placeholder-video
					>
						<source src="<?= $templateFolder ?>/video/marshmallows.mov" type='video/quicktime; codecs="hvc1"'>
						<source src="<?= $templateFolder ?>/video/marshmallows.webm" type="video/webm">
					</video>
					</span>
					<span
						class="landing-site-copilot-ai-placeholder-initial-text"
						data-landing-site-copilot-ai-placeholder-initial-text
					>
						<?= $initialPlaceholderText ?>
					</span>
					<span
						class="landing-site-copilot-ai-placeholder-text --hidden"
						role="status"
						aria-live="polite"
						data-testid="landing-ai-site-generation-status"
						data-landing-site-copilot-ai-placeholder-generation-text
					>
						<?= Loc::getMessage('LANDING_COPILOT_AI_SITE_PLACEHOLDER') ?>
					</span>
					<span
						class="landing-site-copilot-ai-placeholder-progress --hidden"
						role="progressbar"
						aria-label="<?= $placeholderProgressLabel ?>"
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow="0"
						data-testid="landing-ai-site-generation-progress"
						data-js-landing-site-copilot-ai-placeholder-progress
						data-landing-site-copilot-ai-placeholder-progress
						style="--landing-site-copilot-ai-placeholder-progress: 0%;"
					>
					<span class="landing-site-copilot-ai-placeholder-progress-fill"></span>
				</span>
			</span>
		</div>
	</div>
	<?php if ($isAiAssistantChatExpandable): ?>
		<div
			class="landing-site-copilot-ai-chat landing-ai-assistant-panel__chat"
			id="<?= $aiAssistantChatColumnId ?>"
			data-testid="landing-ai-site-chat-column"
			aria-hidden="false"
		>
			<div class="landing-ai-assistant-panel__widget"></div>
		</div>
	<?php endif; ?>
</div>

<script>
	BX.ready(() => {
		const rootContainer = document.querySelector('.landing-site-copilot-ai');
		const placeholderProgressPhrases = <?= $placeholderProgressPhrases ?>;
		const placeholderA11yMessages = <?= $placeholderA11yMessages ?>;
		if (rootContainer && window.LandingCopilotVideo)
		{
			rootContainer.landingSiteCopilotAiPlaceholderVideo = new window.LandingCopilotVideo(rootContainer);
			window.landingSiteCopilotAiPlaceholderVideo = rootContainer.landingSiteCopilotAiPlaceholderVideo;
		}

		if (rootContainer && window.LandingCopilotAnimation)
		{
			rootContainer.landingSiteCopilotAiPlaceholderAnimation = new window.LandingCopilotAnimation(rootContainer);
			window.landingSiteCopilotAiPlaceholderAnimation = rootContainer.landingSiteCopilotAiPlaceholderAnimation;
		}

		if (rootContainer && window.LandingCopilotText)
		{
			rootContainer.landingSiteCopilotAiPlaceholderText = new window.LandingCopilotText(rootContainer);
			window.landingSiteCopilotAiPlaceholderText = rootContainer.landingSiteCopilotAiPlaceholderText;
		}

		if (rootContainer && window.LandingCopilotProgress)
		{
			rootContainer.landingSiteCopilotAiPlaceholderProgress = new window.LandingCopilotProgress(
				rootContainer,
				{phrases: placeholderProgressPhrases}
			);
			window.landingSiteCopilotAiPlaceholderProgress = rootContainer.landingSiteCopilotAiPlaceholderProgress;
		}

		if (rootContainer && window.LandingCopilotA11y)
		{
			rootContainer.landingSiteCopilotAiA11y = new window.LandingCopilotA11y(
				{messages: placeholderA11yMessages}
			);
			window.landingSiteCopilotAiA11y = rootContainer.landingSiteCopilotAiA11y;
		}

		<?php if ($isAiAssistantChatExpandable): ?>
			const aiSiteTriggerOptions = <?= $aiSiteTriggerOptions ?>;
			new BX.Landing.AiAssistant.WidgetPanel({
				rootContainer: document.querySelector('.landing-site-copilot-ai'),
				dialogId: <?= $aiAssistantDialogIdJson ?>,
				triggerOptions: aiSiteTriggerOptions,
				imApplicationData: <?= $imApplicationData ?>,
				initialPrompt: <?= $initialPrompt ?>,
				autoSendInitialPrompt: true,
				openText: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_COPILOT_AI_CHAT_TOGGLE_OPEN')) ?>',
				closeText: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_COPILOT_AI_CHAT_TOGGLE_CLOSE')) ?>',
				logPrefix: 'Landing panel: site copilot',
			}).init();
		<?php endif; ?>

		let generationId = null;
		let activePlaceholderGenerationId = null;
		const finishedPlaceholderGenerationIds = new Set();
		// The pull stream may deliver the same command more than once, and a finish may follow an
		// error of the same generation, so only the handoff to the editor is kept to a single run.
		const editorHandoffGenerationIds = new Set();
		const landingViewUrlTemplate = <?= $landingViewUrlTemplate ?>;
		// The editor tells apart an opening made right after the generation by this address param.
		// It only picks the sub-section of the opening event and is wiped from the address there.
		const editorFromGeneratorParam = <?= $editorFromGeneratorParam ?>;
		const editorFromGeneratorParamValue = <?= $editorFromGeneratorParamValue ?>;

		const startPlaceholderMedia = () => {
			window.landingSiteCopilotAiPlaceholderAnimation?.show();
			window.landingSiteCopilotAiPlaceholderVideo?.play();
			window.landingSiteCopilotAiPlaceholderText?.show();
			window.landingSiteCopilotAiPlaceholderProgress?.show();
		};

		const stopPlaceholderMedia = () => {
			window.landingSiteCopilotAiPlaceholderVideo?.pause();
			window.landingSiteCopilotAiPlaceholderAnimation?.hide();
		};

		const redirectToEditor = (siteId, landingId, generationId) => {
			siteId = parseInt(siteId, 10) || 0;
			landingId = parseInt(landingId, 10) || 0;
			generationId = parseInt(generationId, 10) || 0;

			if (
				siteId > 0
				&& landingId > 0
				&& generationId > 0
			)
			{
				const editorPath = landingViewUrlTemplate
					.replace('#site_show#', siteId)
					.replace('#landing_edit#', landingId)
				;
				const editorUrl = new URL(editorPath, window.location.origin);
				editorUrl.searchParams.set(editorFromGeneratorParam, editorFromGeneratorParamValue);

				window.location.href = `${editorUrl.pathname}${editorUrl.search}${editorUrl.hash}`;
			}
		};

		const observeGeneration = (nextGenerationId) => {
			nextGenerationId = parseInt(nextGenerationId, 10) || 0;
			if (nextGenerationId <= 0 || generationId === nextGenerationId)
			{
				return;
			}

			generationId = nextGenerationId;
			const observer = new BX.Landing.Copilot.GenerationObserver(generationId);
			observer.observe();
		};

		const requestGenerationState = (requestedGenerationId) => {
			requestedGenerationId = parseInt(requestedGenerationId, 10) || 0;
			if (requestedGenerationId <= 0 || !BX.ajax?.runAction)
			{
				return Promise.resolve(null);
			}

			return BX.ajax.runAction('landing.copilot.magicSiteStatus', {
				data: {
					payload: {
						generationId: requestedGenerationId,
					},
				},
			}).then((response) => {
				return response?.data ?? null;
			}).catch(() => null);
		};

		// The live announcer writes into the region a frame later, so the page has to outlive the
		// readiness milestone it announces before the editor takes it over.
		const readinessAnnouncementDeliveryDelay = 1500;

		const handleGenerationState = (state) => {
			const stateGenerationId = parseInt(state?.generationId, 10) || 0;
			if (stateGenerationId <= 0)
			{
				return;
			}

			observeGeneration(stateGenerationId);
			if (state.finished === true)
			{
				finishedPlaceholderGenerationIds.add(stateGenerationId);
				if (activePlaceholderGenerationId === stateGenerationId)
				{
					activePlaceholderGenerationId = null;
				}
				stopPlaceholderMedia();
				if (editorHandoffGenerationIds.has(stateGenerationId))
				{
					return;
				}

				editorHandoffGenerationIds.add(stateGenerationId);
				window.landingSiteCopilotAiA11y?.announceGenerationFinished(stateGenerationId);
				setTimeout(() => {
					redirectToEditor(
						state.siteId,
						state.landingId,
						stateGenerationId
					);
				}, readinessAnnouncementDeliveryDelay);
			}
		};

		const handleGenerationCreate = (eventGenerationId) => {
			eventGenerationId = parseInt(eventGenerationId, 10) || 0;
			if (eventGenerationId <= 0)
			{
				return;
			}

			observeGeneration(eventGenerationId);
			requestGenerationState(eventGenerationId).then((state) => {
				const stateGenerationId = parseInt(state?.generationId, 10) || 0;
				if (
					stateGenerationId !== eventGenerationId
					|| state?.success !== true
					|| state.finished === true
					|| state.error === true
					|| finishedPlaceholderGenerationIds.has(eventGenerationId)
				)
				{
					return;
				}

				activePlaceholderGenerationId = eventGenerationId;
				startPlaceholderMedia();
				window.landingSiteCopilotAiA11y?.announceGenerationStarted(eventGenerationId);
			});
		};

		const requestFinishedGeneration = (finishedGenerationId) => {
			finishedGenerationId = parseInt(finishedGenerationId, 10) || 0;
			if (finishedGenerationId <= 0)
			{
				return;
			}

			requestGenerationState(finishedGenerationId).then((state) => {
				if (state?.finished === true)
				{
					handleGenerationState(state);
				}
			});
		};

		const handleGenerationFinish = (eventData) => {
			const eventGenerationId = parseInt(eventData.params?.generationId, 10) || 0;
			if (eventGenerationId <= 0)
			{
				return;
			}

			finishedPlaceholderGenerationIds.add(eventGenerationId);
			if (activePlaceholderGenerationId === eventGenerationId)
			{
				activePlaceholderGenerationId = null;
				stopPlaceholderMedia();
			}

			requestFinishedGeneration(eventGenerationId);
		};

		const handleGenerationError = (eventData) => {
			const eventGenerationId = parseInt(eventData.params?.generationId, 10) || 0;
			if (eventGenerationId <= 0)
			{
				return;
			}

			// The command is addressed to the user and shared by both site scenarios, so only a
			// failure of the generation this page follows may speak here. The id is known from the
			// create event even when the start was never shown, and it is read before the
			// placeholder is settled below.
			const isObservedGeneration = generationId === eventGenerationId
				|| activePlaceholderGenerationId === eventGenerationId;

			finishedPlaceholderGenerationIds.add(eventGenerationId);
			if (activePlaceholderGenerationId === eventGenerationId)
			{
				activePlaceholderGenerationId = null;
				stopPlaceholderMedia();
			}

			if (isObservedGeneration)
			{
				window.landingSiteCopilotAiA11y?.announceGenerationFailed(eventGenerationId);
			}
		};

		if (BX.PULL)
		{
			BX.PULL.subscribe({
				type: 'server',
				moduleId: 'landing',
				callback: (eventData) => {
					const eventGenerationId = parseInt(eventData.params?.generationId, 10) || 0;

					if (eventData.command === 'LandingCopilotGeneration:onGenerationCreate')
					{
						handleGenerationCreate(eventGenerationId);
					}

					if (eventData.command === 'LandingCopilotGeneration:onGenerationFinish')
					{
						handleGenerationFinish(eventData);
					}

					if (eventData.command === 'LandingCopilotGeneration:onGenerationError')
					{
						handleGenerationError(eventData);
					}
				},
			});
		}
	});
</script>
