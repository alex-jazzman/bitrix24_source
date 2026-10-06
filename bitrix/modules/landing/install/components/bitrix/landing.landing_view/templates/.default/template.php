<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var \LandingViewComponent $component */
/** @var \CMain $APPLICATION */
/** @var array $arResult */
/** @var array $arParams */

use Bitrix\Landing\Assets;
use Bitrix\Landing\Config;
use Bitrix\Landing\Copilot;
use Bitrix\Landing\Manager;
use Bitrix\Landing\Site;
use Bitrix\Landing\Metrika;
use Bitrix\Landing\Vibe\Vibe;
use Bitrix\Main\Application;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

Loc::loadMessages(__FILE__);
Loc::loadMessages(Manager::getDocRoot() . '/bitrix/modules/landing/lib/mutator.php');

$isKnowledge = $arParams['TYPE'] === 'KNOWLEDGE' || $arParams['TYPE'] === 'GROUP';
$isFormEditor = $arResult['SPECIAL_TYPE'] === Site\Type::PSEUDO_SCOPE_CODE_FORMS;
$context = Application::getInstance()->getContext();
$request = $context->getRequest();
$generationId = $request->get('site_generated') ? (int)$request->get('site_generated') : null;
$isNewLanding = $request->get('newLanding') === 'Y';
$isFromAiGenerator = $request->get(Metrika\EditorOpenEventResolver::FROM_GENERATOR_PARAM)
	=== Metrika\EditorOpenEventResolver::FROM_GENERATOR_PARAM_VALUE
;
$isLandingAiSitesEnabled = Copilot\Manager::isAiSitesEnabled();
$isAiAssistantPanelEnabled = (bool)($arResult['SHOW_AI_ASSISTANT_PANEL'] ?? false);
$isCreatedByAiScenario = (bool)($arResult['IS_CREATED_BY_AI_SCENARIO'] ?? false);
$isAiSiteUiEnabled = $isCreatedByAiScenario && $isLandingAiSitesEnabled;
$isAiAssistantPanelRenderable = $isAiAssistantPanelEnabled && $isLandingAiSitesEnabled && (!$isCreatedByAiScenario || $isAiSiteUiEnabled);
$isAiSiteEditorShell = !$request->offsetExists('landing_mode') && $request->get('action') !== 'preview';
$aiSiteTriggerBindingId = (int)($arResult['AI_SITE_BINDING_ID'] ?? 0);
$aiSiteTriggerCode = (string)($arResult['AI_SITE_TRIGGER_CODE'] ?? '');
$aiSiteTriggerContext = $arResult['AI_SITE_TRIGGER_CONTEXT'] ?? [];
if (!is_array($aiSiteTriggerContext))
{
	$aiSiteTriggerContext = [];
}
$aiSiteTriggerEnabled = $isAiSiteEditorShell
	&& $isAiAssistantPanelEnabled
	&& $isAiSiteUiEnabled
	&& ($arResult['AI_SITE_TRIGGER_ENABLED'] ?? false) === true
	&& $aiSiteTriggerBindingId > 0
	&& $aiSiteTriggerCode !== ''
;
$aiAssistantDialogId = (string)($arResult['AI_ASSISTANT_DIALOG_ID'] ?? '');
if (!preg_match('/^chat\d+$/', $aiAssistantDialogId))
{
	$aiAssistantDialogId = '';
}
$isAiAssistantChatExpandable = $isAiAssistantPanelRenderable && ($isAiSiteUiEnabled ? $aiSiteTriggerEnabled : true);
$isAiAssistantToggleDisabled = !$isAiAssistantChatExpandable;
$isMainAiAssistantChatOpen = (bool)($arResult['AI_ASSISTANT_CHAT_IS_OPEN'] ?? false);
$startAiAssistantPanelMinimized = !$isAiAssistantChatExpandable || (!$isAiSiteUiEnabled && !$isMainAiAssistantChatOpen);
$syncMainChatOpenState = !$isAiSiteUiEnabled;
$aiAssistantPanelClass = 'landing-ui-view-layout landing-ai-assistant-panel';
$aiAssistantChatAriaHidden = 'false';
$aiAssistantToggleText = Loc::getMessage('LANDING_VIEW_COPILOT_CHAT_TOGGLE_CLOSE');
if ($startAiAssistantPanelMinimized)
{
	$aiAssistantPanelClass .= ' landing-ai-assistant-panel--chat-minimized';
	$aiAssistantChatAriaHidden = 'true';
	$aiAssistantToggleText = Loc::getMessage('LANDING_VIEW_COPILOT_CHAT_TOGGLE_OPEN');
}

$isVibeEditor = $arParams['TYPE'] === Site\Type::SCOPE_CODE_VIBE;
if ($isVibeEditor)
{
	/** @var Vibe $vibe */
	$vibe = $arResult['VIBE'];
	$isVibePublic = isset($vibe) && $vibe->isPublished();
	$isVibeAvailable = isset($vibe) && $vibe->isAvailable();
	$isVibeFeatureAvailable = Vibe::isFeatureEnable();
}

if ($isVibeEditor && !$isVibeAvailable)
{
	?>
	<div class="landing-error-page">
		<div class="landing-error-page-inner">
			<div class="landing-error-page-title">Not vibing yet</div>
			<div class="landing-error-page-img">
				<div class="landing-error-page-img-inner"></div>
			</div>
		</div>
	</div>
	<?php
	return;
}

// assets, extensions
Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.icon-set.outline',
	'ui.alerts',
	'ui.icons',
	'ui.info-helper',
	'ui.notification',
	'sidepanel',
	'popup_menu',
	'marketplace',
	'applayout',
	'landing_master',
	'helper',
	'main.qrcode',
	'ui.hint',
	'ui.a11y',
	'bitrix24.phoneverify',
	'main.core',
	'landing.ui.copilot.skeleton',
	'landing.copilot.generation-observer',
	'landing.editor.realtime',
	'landing.copilot.change-ai-site-editor-sync',
	'landing.copilot.element-picker',
	'intranet.sidepanel.bindings',
]);

if ($isAiAssistantPanelRenderable)
{
	if ($isAiAssistantChatExpandable)
	{
		Extension::load('landing.aiassistant.widgetpanel');
		if ($aiSiteTriggerEnabled)
		{
			Extension::load('aiassistant.trigger');
		}
	}
}

if (
	($arResult['AI_TEXT_AVAILABLE'] && $arResult['AI_TEXT_ACTIVE'])
	|| ($arResult['AI_IMAGE_AVAILABLE'] && $arResult['AI_IMAGE_ACTIVE'])
)
{
	Extension::load('ai.picker');
}

$assets = Assets\Manager::getInstance();
$assets->addAsset(
	'landing_master',
	Assets\Location::LOCATION_KERNEL
);
$assets->addAsset(
	Config::get('js_core_edit'),
	Assets\Location::LOCATION_KERNEL
);

if ($isVibeEditor)
{
	Asset::getInstance()->addCSS('/bitrix/components/bitrix/landing.landing_view/templates/.default/mainpage-style.css');
}

Manager::setPageView(
	'BodyClass',
	'landing-editor'
);

if (!$isKnowledge)
{
    Manager::setPageView(
        'BodyClass',
        'enable-external-controls'
    );
}

// region analytic
if ($request->get('landing_mode') === 'edit')
{
	$tools = $isFormEditor
		? Metrika\Tools::CrmForms
		: Metrika\Tools::getBySiteType($arParams['TYPE'])
	;
	$category = $isFormEditor
		? Metrika\Categories::CrmForms
		: Metrika\Categories::getBySiteType($arParams['TYPE'])
	;
	$metrika = new Metrika\Metrika(
		$category,
		Metrika\EditorOpenEventResolver::resolveEvent($isCreatedByAiScenario),
		$tools,
	);
	if ($isCreatedByAiScenario)
	{
		$metrika->setSubSection(
			Metrika\EditorOpenEventResolver::resolveAiSubSection($isFromAiGenerator)
		);
	}
	elseif ($generationId)
	{
		$metrika
			->setType(Metrika\Types::ai)
			->setSubSection('from_ai_generator')
		;
	}
	elseif ($isNewLanding)
	{
		$metrika
			->setType(Metrika\Types::template)
			->setSubSection('from_template_previewer')
		;
	}
	elseif ($isVibeEditor)
	{
		// todo: do nothing
	}
	else
	{
		$metrika
			->setType(Metrika\Types::template)
			->setSubSection('from_page_list')
		;
	}

	$metrika->setParam(3, 'siteId', $arResult['LANDING']->getSiteId());

	$errorStatus = Metrika\EditorOpenEventResolver::resolveErrorStatus($isCreatedByAiScenario);
	if ($arResult['FATAL'])
	{
		$metrika->setError('fatal', $errorStatus);
	}
	elseif ($arResult['ERRORS'])
	{
		if (isset($arResult['ERRORS']['LICENSE_EXPIRED']))
		{
			$metrika->setError('license_expired', Metrika\Statuses::ErrorB24);
		}
		elseif (isset($arResult['ERRORS']['LICENSE_NOT_FOUND']))
		{
			$metrika->setError('license_not_found', Metrika\Statuses::ErrorB24);
		}
		else
		{
			$errorFull = '';
			foreach ($arResult['ERRORS'] as $code => $message)
			{
				$errorFull .= $code . ':' . $message . "-";
			}
			$metrika->setError($errorFull, $errorStatus);
		}
	}

	$metrika->send();
}
// endregion

// errors output
if ($arResult['ERRORS'])
{
	$errors = $arResult['ERRORS'];
	if (isset($errors['LICENSE_EXPIRED']))
	{
		$link = Manager::isB24()
				? 'https://www.bitrix24.ru/prices/self-hosted.php'
				: 'https://www.1c-bitrix.ru/buy/cms.php#tab-updates-link';
		?>
		<div class="landing-license-wrapper">
			<div class="landing-license-inner">
				<div class="landing-license-icon-container">
					<div class="landing-license-icon"></div>
				</div>
				<div class="landing-license-info">
					<span class="landing-license-info-text"><?= $errors['LICENSE_EXPIRED'];?></span>
					<div class="landing-license-info-btn">
						<?= Loc::getMessage('LANDING_TPL_BUY_RENEW', array(
							'#LINK1#' => '<a href="' . $link . '" target="_blank" class="landing-license-info-link">',
							'#LINK2#' => '</a>'
						));?>
					</div>
				</div>
			</div>
		</div>
		<?php
		return;
	}
	elseif (isset($errors['SITE_IS_NOW_CREATING']))
	{
		?>
		<div class="landing-view-loader-container">
			<div class="main-ui-loader main-ui-show" data-is-shown="true">
				<svg class="main-ui-loader-svg" viewBox="25 25 50 50">
					<circle class="main-ui-loader-svg-circle" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle>
				</svg>
			</div>
			<div class="landing-view-loader-text"><?= Loc::getMessage('LANDING_WAIT_WHILE_CREATING');?></div>
		</div>
		<script>
			BX.ready(function()
			{
				setTimeout(function() {
					window.location.href = "<?= \CUtil::jsEscape($arResult['LANDING_FULL_URL']);?>"
				}, 3000);
			});
		</script>
		<?php
		return;
	}
	else
	{
		// send to user all others errors
		foreach ($errors as $errorCode => $errorMessage)
		{
			$errorMessage .= $component->getSettingLinkByError(
				$errorCode
			);
			if ($arResult['FATAL'])
			{
				?>
				<div class="landing-error-page">
					<div class="landing-error-page-inner">
						<div class="landing-error-page-title"><?= $errorMessage;?></div>
						<div class="landing-error-page-img">
							<div class="landing-error-page-img-inner"></div>
						</div>
					</div>
				</div>
				<?php
			}
			else
			{
				?>
				<script>
					BX.ready(function()
					{
						if (
							top.window.opener &&
							typeof top.window.opener.landingAlertMessage !== 'undefined'
						)
						{
							top.window.opener.landingAlertMessage(
								'<?= \CUtil::jsEscape($errorMessage);?>',
								<?= $component->isTariffError($errorCode) ? 'true' : 'false';?>,
								'<?= $errorCode;?>'
							);
							top.window.close();
						}
					});
				</script>
				<?php
			}
			break;
		}
	}
}

if ($arResult['FATAL'])
{
	return;
}


$site = $arResult['SITE'];
$siteId = $arResult['LANDING']->getSiteId();
$landingId = $arResult['LANDING']->getId();
$folderId = $arResult['LANDING']->getFolderId();
$successSave = $arResult['SUCCESS_SAVE'];
$curUrl = $arResult['CUR_URI'];
$urls = $arResult['TOP_PANEL_CONFIG']['urls'];
$aiAssistantDialogIdJson = Json::encode($aiAssistantDialogId);
$imApplicationData = Json::encode($arResult['IM_APPLICATION_DATA'] ?? []);
$aiSiteTriggerOptions = Json::encode([
	'enabled' => $aiSiteTriggerEnabled,
	'triggerCode' => $aiSiteTriggerCode,
	'bindingId' => $aiSiteTriggerBindingId,
	'triggerContext' => $aiSiteTriggerContext,
]);
$this->getComponent()->initAPIKeys();

$urlLandingAdd = $arParams['PAGE_URL_LANDING_ADD'];
$urlFolderAdd = str_replace(['#site_show#', '#landing_edit#'], [$siteId, 0], $arParams['~PARAMS']['sef_url']['site_show'] ?? '');
$urlFolderAdd = $component->getPageParam($urlFolderAdd, ['folderId' => $folderId, 'folderNew' => 'Y']);
$urlFormAdd = '/crm/webform/edit/0/';

// Tool availability (by intranet settings)
if (
	!$component->isToolAvailable()
	&& $request->offsetExists('landing_mode')
)
{
	echo $component->getToolUnavailableInfoScript();
}

if ($isFormEditor)
{
	$arParams['PAGE_URL_URL_SITES'] = '/crm/webform/';
	Extension::load([
		'landing.ui.panel.formsettingspanel',
		'crm.form.embed',
		'landing.form.share-popup',
	]);
}

if ($request->get('close') == 'Y')
{
	?>
	<script>
		if (top.window !== window)
		{
			top.window.location.reload();
		}
	</script>
	<div class="landing-view-loader-container">
		<div class="main-ui-loader main-ui-show" data-is-shown="true">
			<svg class="main-ui-loader-svg" viewBox="25 25 50 50">
				<circle class="main-ui-loader-svg-circle" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"></circle>
			</svg>
		</div>
	</div>
	<?php
	return;
}

// top panel
if (!$request->offsetExists('landing_mode')):
	// tpl vars
	$startChain = $component->getMessageType('LANDING_TPL_START_PAGE');
	$lightMode = $arParams['PANEL_LIGHT_MODE'] == 'Y';
	$panelModifier = $lightMode ? ' landing-ui-panel-top-light' : '';
	$useAiTopPanelHeader = $isAiSiteUiEnabled && ($arParams['USE_AI_TOP_PANEL_HEADER'] ?? 'Y') !== 'N';
	// feedback form
	$formCode = '';
	if (!isset($arResult['LICENSE']) || $arResult['LICENSE'] != 'nfr')
	{
		$formCode = 'partner';
		?>
		<div style="display: none">
			<?php $APPLICATION->includeComponent(
				'bitrix:ui.feedback.form',
				'',
				$component->getFeedbackParameters($formCode)
			);?>
		</div>
		<?php
	}
	?>
	<?php if ($isAiAssistantPanelRenderable): ?>
	<div class="<?= $aiAssistantPanelClass ?>">
		<div class="landing-ui-view-main landing-ai-assistant-panel__main">
	<?php endif; ?>
	<?php if ($useAiTopPanelHeader): ?>
		<?php
		$aiTopPanelHref = $arParams['TYPE'] === 'GROUP' ? '#' : $arParams['PAGE_URL_URL_SITES'];
		$aiTopPanelFeaturesText = $isVibeEditor
			? Loc::getMessage('LANDING_MAINPAGE_FEATURES')
			: $component->getMessageType('LANDING_TPL_FEATURES')
		;
		$aiPanelBtnAutoPubClass = 'landing-ui-panel-top-pub-btn';
		$aiPanelBtnAutoPubClass .= (!$arResult['FAKE_PUBLICATION']) ? ' landing-ui-panel-top-pub-btn-error' : '';
		$aiPanelBtnAutoPubClass .= ($arResult['TOP_PANEL_CONFIG']['autoPublicationEnabled'] == 1) ? ' landing-ui-panel-top-pub-btn-auto' : '';
		$aiPanelBtnAutoPubClass .= (!$arResult['IS_AREA']) ? ' landing-ui-panel-top-pub-btn-enable' : '';
		$aiPanelBtnAutoPubIconClass = ($arResult['TOP_PANEL_CONFIG']['autoPublicationEnabled'] == 1) ? '--s-cloud' : '--o-cloud';

		if ($arResult['IS_AREA'])
		{
			$aiBtnAutoPubHint = Loc::getMessage('LANDING_SITE_HINT_AUTOPUBLISHING_AREA');
		}
		else
		{
			$aiBtnAutoPubHint = Loc::getMessage('LANDING_SITE_HINT_AUTOPUBLISHING_OPTIONS');
		}
		?>
		<div class="landing-ui-panel landing-ui-panel-top landing-ui-panel-top-ai<?= $panelModifier ?>">
			<div class="landing-ui-panel-top-ai__brand">
				<a href="<?= $aiTopPanelHref ?>" class="landing-ui-panel-top-ai__brand-link" data-slider-ignore-autobinding="true" tabindex="0"<?php if ($arParams['TYPE'] !== 'GROUP'){?> target="_top"<?php }?>>
					<span class="ui-icon-set --o-home landing-ui-panel-top-ai__home" data-hint="<?= Loc::getMessage("LANDING_TPL_PREVIEW_EXIT")?>" data-hint-no-icon></span>
					<span class="landing-ui-panel-top-ai__product"><?= Loc::getMessage('LANDING_TPL_AI_TOP_PANEL_TITLE') ?></span>
				</a>
			</div>
			<div class="landing-ui-panel-top-ai__divider"></div>
			<div class="landing-ui-panel-top-ai__title">
				<?= htmlspecialcharsbx($arResult['LANDING']->getTitle()) ?>
			</div>
			<div class="landing-ui-panel-top-ai__title-icon ui-icon-set --o-no-cloud-sync" aria-hidden="true"></div>
			<div class="landing-ui-panel-top-ai__spacer"></div>
			<div class="landing-ui-panel-top-devices">
				<div class="landing-ui-panel-top-devices-inner">
					<button class="landing-ui-button landing-ui-button-desktop active" type="button" data-id="desktop_button" tabindex="0" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_DEVICE_DESKTOP'))?>" aria-pressed="true">
						<span class="ui-icon-set --o-screen" aria-hidden="true"></span>
					</button>
					<button class="landing-ui-button landing-ui-button-tablet" type="button" data-id="tablet_button" tabindex="0" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_DEVICE_TABLET'))?>" aria-pressed="false">
						<span class="ui-icon-set --o-tablet" aria-hidden="true"></span>
					</button>
					<button class="landing-ui-button landing-ui-button-mobile" type="button" data-id="mobile_button" tabindex="0" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_DEVICE_MOBILE'))?>" aria-pressed="false">
						<span class="ui-icon-set --o-mobile" aria-hidden="true"></span>
					</button>
				</div>
			</div>
			<div class="landing-ui-panel-top-ai__spacer"></div>
			<div class="landing-ui-panel-top-history">
				<button class="landing-ui-panel-top-history-button landing-ui-panel-top-history-undo landing-ui-disabled" type="button" tabindex="-1" disabled aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_HISTORY_UNDO'))?>"></button>
				<button class="landing-ui-panel-top-history-button landing-ui-panel-top-history-redo landing-ui-disabled" type="button" tabindex="-1" disabled aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_HISTORY_REDO'))?>"></button>
			</div>
			<div class="landing-ui-panel-top-ai__actions" id="landing-panel-settings">
				<?php if ($arParams['DRAFT_MODE'] != 'Y'): ?>
					<button class="landing-ui-panel-top-ai__icon-button landing-ui-panel-top-ai__publication-button <?=$aiPanelBtnAutoPubClass?>" id="landing-popup-publication-btn" type="button" tabindex="0" aria-label="<?=$aiBtnAutoPubHint?>" data-hint="<?=$aiBtnAutoPubHint?>" data-hint-no-icon>
						<span class="ui-icon-set <?=$aiPanelBtnAutoPubIconClass?>"></span>
					</button>
					<?php
					if ($arResult['FAKE_PUBLICATION']):
						?><div id="landing-popup-publication-error-area" style="display: none;"></div><?php
					else:
						$errTitle = null;
						$errorCode = array_key_first($arResult['ERRORS']);
						$errDesc = $arResult['ERRORS'][$errorCode];
						if ($errorCode === 'PUBLIC_SITE_REACHED_FREE')
						{
							$errTitle = $arResult['ERRORS'][$errorCode];
							$errDesc = null;
						}
						if (!$errorCode && $arResult['PUBLICATION_ERROR_CODE'] === 'shop1c')
						{
							$errorCode = 'SHOP_1C';
							$errTitle = Loc::getMessage('LANDING_PUBLICATION_SHOP_ERROR_1C');
						}
						?>
						<div id="landing-popup-publication-error-area"
							style="display: none;"
							data-error="<?=$errorCode?>"
							<?=($errTitle ? " data-error-title=\"{$errTitle}\"" : '')?>
							<?=($errDesc ? " data-error-description=\"{$errDesc}\"" : '')?>
						>
						</div><?php
					endif;
					?>
				<?php endif; ?>
				<?php if ($arParams['DRAFT_MODE'] != 'Y' && !$isFormEditor): ?>
					<button
						type="button"
						id="landing-popup-features-btn"
						class="ui-btn --air ui-btn-sm --style-outline-no-accent ui-btn-no-caps landing-ui-panel-top-ai__features landing-ui-panel-top-menu-link-features"
						tabindex="0"
						<?php if ($formCode){?> data-feedback="landing-feedback-<?= $formCode?>-button"<?php }?>
					>
						<span class="landing-ui-panel-top-ai__features-text">
							<?= $aiTopPanelFeaturesText?>
						</span>
						<span class="ui-icon-set --server-settings landing-ui-panel-top-ai__features-icon" aria-hidden="true"></span>
					</button>
				<?php endif; ?>
				<div class="landing-ui-panel-top-chat-toggle-container landing-ai-assistant-panel__toggle-container">
					<button
						class="landing-ui-panel-top-ai__icon-button landing-ui-panel-top-chat-toggle landing-ai-assistant-panel__toggle"
						type="button"
						tabindex="0"
						aria-expanded="<?= $startAiAssistantPanelMinimized ? 'false' : 'true' ?>"
						<?= $isAiAssistantToggleDisabled ? 'aria-disabled="true"' : '' ?>
					>
						<?= $aiAssistantToggleText ?>
					</button>
				</div>
			</div>
		</div>
	<?php else: ?>
	<div class="landing-ui-panel landing-ui-panel-top<?= $panelModifier ?>">
		<!-- region Logotype -->
		<div class="landing-ui-panel-top-logo">
			<?php
			$uiPanelTopClassList = 'landing-ui-panel-top-logo-link';
			if ($arParams['TYPE'] === 'GROUP')
			{
				$href = '#';
			}
			else
			{
				$href = $arParams['PAGE_URL_URL_SITES'];
			}
			?>
			<a href="<?= $href ?>" class="<?= $uiPanelTopClassList ?>" data-slider-ignore-autobinding="true"<?php if ($arParams['TYPE'] !== 'GROUP'){?> target="_top"<?php }?>>
				<span class="landing-ui-panel-top-logo-home-btn" data-hint="<?= Loc::getMessage("LANDING_TPL_PREVIEW_EXIT")?>" data-hint-no-icon>
					<svg class='landing-ui-panel-top-logo-home-btn-icon' width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path fill-rule="evenodd" clip-rule="evenodd" d="M11.902 19.6877V15.8046C11.902 15.5837 12.0811 15.4046 12.302 15.4046H14.5087C14.7296 15.4046 14.9087 15.5837 14.9087 15.8046V19.6877C14.9089 19.9086 15.0879 20.0876 15.3087 20.0878L18.8299 20.0891C19.0508 20.0893 19.2299 19.9103 19.23 19.6894C19.23 19.6893 19.23 19.6893 19.2299 19.6892V13.4563C19.2299 13.4365 19.2275 13.4142 19.2275 13.3943H20.4332C20.6633 13.3943 20.8604 13.2883 20.9909 13.0932C21.1189 12.9005 21.1425 12.6747 21.0581 12.4561C20.9519 12.1816 14.2383 5.92948 14.2047 5.90379C13.7957 5.59077 13.3216 5.58796 12.9131 5.89536C12.8759 5.92337 6.15525 12.1815 6.04901 12.4561C5.96462 12.6729 5.99059 12.9011 6.11629 13.0932C6.24671 13.2859 6.44145 13.3943 6.67162 13.3943H7.87965C7.87729 13.4142 7.87729 13.4365 7.87729 13.4563V19.6846C7.8776 19.9054 8.0565 20.0844 8.27729 20.0849L11.502 20.0874C11.7229 20.0879 11.9021 19.9089 11.9023 19.688C11.9023 19.6879 11.9023 19.6878 11.902 19.6877Z" fill="#525C69"/>
					</svg>
				</span>
				<?php
				if (Manager::isB24() && $isFormEditor)
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_LOGO").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>'
						.'<span class="landing-ui-panel-top-logo-text left-spaced">'.Loc::getMessage('LANDING_TPL_START_PAGE_FORM_LOGO_SMN').'</span>';
				}
				else if (Manager::isB24() && $isVibeEditor)
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_LOGO").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>'
						.'<span class="landing-ui-panel-top-logo-text left-spaced">'.Loc::getMessage('LANDING_TPL_VIEW_LOGO_WELCOME_PAGE').'</span>';
				}
				else if (!Manager::isB24() && $isFormEditor)
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_FORM_LOGO_SMN").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>';
				}
				else if(Manager::isB24() && $arParams['PANEL_LIGHT_MODE'] == 'Y')
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_LOGO").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>'
						.'<span class="landing-ui-panel-top-logo-text left-spaced">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_KB').'</span>';
				}
				else if (Manager::isB24())
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_LOGO").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>'
						.'<span class="landing-ui-panel-top-logo-text left-spaced">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_SMN').'</span>';
				}
				else if (!Manager::isB24() && $arParams['PANEL_LIGHT_MODE'] == 'Y')
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_LOGO_KB").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>';
				}
				else if (!Manager::isB24())
				{
					echo '<span class="landing-ui-panel-top-logo-text">'.Loc::getMessage("LANDING_TPL_START_PAGE_LOGO_SMN").'</span>'
						.'<span class="landing-ui-panel-top-logo-color">'.Loc::getMessage('LANDING_TPL_START_PAGE_LOGO_24').'</span>'
						.'<span class="landing-ui-panel-top-logo-icon fa fa-clock-three"></span>';
				}
				?>
			</a>
		</div>
		<!-- endregion -->

		<!-- region landing.selector -->
		<?php if (!$isVibeEditor): ?>
			<div class="landing-ui-panel-top-selector">
				<?php $APPLICATION->includeComponent('bitrix:landing.selector', '', [
					'TYPE' => $arParams['TYPE'],
					'SITE_ID' => $siteId,
					'FOLDER_ID' => $folderId,
					'LANDING_ID' => $arResult['LANDING']->getId(),
					'INPUT_VALUE' => $arResult['LANDING']->getTitle(),
					'PAGE_URL_LANDING_VIEW' => $arParams['~PARAMS']['sef_url']['landing_view'] ?? '',
					'PAGE_URL_LANDING_ADD' => !$isFormEditor ? $urlLandingAdd : '',
					'PAGE_URL_FOLDER_ADD' => !$isFormEditor ? $urlFolderAdd : '',
					'PAGE_URL_FORM_ADD' => $isFormEditor ? $urlFormAdd : '',
				]); ?>
			</div>
		<?php endif; ?>
		<!--  endregion -->

		<?php
		// region Autopub
		$panelBtnAutoPubClass = 'landing-ui-panel-top-pub-btn';
		$panelBtnAutoPubClass .= (!$arResult['FAKE_PUBLICATION']) ? ' landing-ui-panel-top-pub-btn-error' : '';
		$panelBtnAutoPubClass .= ($arResult['TOP_PANEL_CONFIG']['autoPublicationEnabled'] == 1) ? ' landing-ui-panel-top-pub-btn-auto' : '';
		$panelBtnAutoPubClass .= (!$arResult['IS_AREA']) ? ' landing-ui-panel-top-pub-btn-enable' : '';

		if ($arResult['IS_AREA'])
		{
			$btnAutoPubHint = Loc::getMessage('LANDING_SITE_HINT_AUTOPUBLISHING_AREA');
		}
		else
		{
			$btnAutoPubHint = Loc::getMessage('LANDING_SITE_HINT_AUTOPUBLISHING_OPTIONS');
		}

		if ($arParams['DRAFT_MODE'] != 'Y'):
			?>
			<button class="<?=$panelBtnAutoPubClass?>" id="landing-popup-publication-btn" type="button" aria-label="<?=htmlspecialcharsbx($btnAutoPubHint)?>" data-hint="<?=$btnAutoPubHint?>" data-hint-no-icon>
				<svg class="landing-ui-panel-top-pub-btn-icon" width="25" height="25" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill="#C6CDD3" class="landing-ui-panel-top-pub-btn-icon-defs-cloud"  d="M18.5075 18.8896H10.4177C10.3485 18.8896 10.2799 18.887 10.2119 18.882C8.38363 18.8398 6.91434 17.3271 6.91434 15.4671C6.91487 14.5606 7.27128 13.6914 7.90517 13.0507C8.2301 12.7223 8.61429 12.4678 9.03227 12.2978C9.02528 12.2055 9.02172 12.1123 9.02172 12.0182C9.02229 11.0617 9.39838 10.1446 10.0672 9.46862C10.7361 8.79266 11.6429 8.41324 12.5883 8.41382C13.7992 8.41531 14.8683 9.02804 15.5108 9.96325C15.816 9.85386 16.1444 9.79441 16.4866 9.79459C17.9982 9.79643 19.2397 10.9624 19.3836 12.4534C20.832 12.7729 21.9159 14.0785 21.9146 15.6395C21.9131 17.4385 20.4711 18.8958 18.6932 18.895C18.6309 18.895 18.569 18.8932 18.5075 18.8896Z" fill-rule="evenodd" clip-rule="evenodd"/>
					<path fill="#FFFFFF" class="landing-ui-panel-top-pub-btn-icon-defs-success" d="M7.46967 13.782L9.1093 12.14L12.2726 15.2532L18.6078 8.91091L20.2474 10.5529L12.2881 18.5218L7.46967 13.782Z" fill-rule="evenodd" clip-rule="evenodd"/>
					<path fill="#FF7975" class="landing-ui-panel-top-pub-btn-icon-defs-error"  d="M19.8991 9.8334L17.607 7.54126L7.00036 18.1479L9.2925 20.44L19.8991 9.8334Z"/>
					<path fill="#FFFFFF" class="landing-ui-panel-top-pub-btn-icon-defs-error"  d="M19.9323 10.0725C20.2657 9.73913 20.2657 9.19867 19.9323 8.86532C19.599 8.53198 19.0585 8.53198 18.7252 8.86532L8.6579 18.9326C8.32455 19.266 8.32455 19.8064 8.6579 20.1398C8.99124 20.4731 9.5317 20.4731 9.86505 20.1398L19.9323 10.0725Z"/>
					<path fill="#2FC6F6" class="landing-ui-panel-top-pub-btn-icon-defs-loader" d="M14 7C14.0668 7 14.1335 7.00094 14.1998 7.0028L14.1998 8.85103C14.1335 8.8485 14.0669 8.84723 14 8.84723C11.1542 8.84723 8.84723 11.1542 8.84723 14C8.84723 16.8458 11.1542 19.1528 14 19.1528C16.8458 19.1528 19.1528 16.8458 19.1528 14L19.1478 13.7993H20.9968L21 14C21 17.7871 17.9926 20.8718 14.2358 20.9961L14 21C10.134 21 7 17.866 7 14C7 10.134 10.134 7 14 7Z" />
				</svg>
			</button>
			<?php
			if ($arResult['FAKE_PUBLICATION']):
				?><div id="landing-popup-publication-error-area" style="display: none;"></div><?php
			else:
				$errTitle = null;
				$errorCode = array_key_first($arResult['ERRORS']);
				$errDesc = $arResult['ERRORS'][$errorCode];
				if ($errorCode === 'PUBLIC_SITE_REACHED_FREE')
				{
					$errTitle = $arResult['ERRORS'][$errorCode];
					$errDesc = null;
				}
				if (!$errorCode && $arResult['PUBLICATION_ERROR_CODE'] === 'shop1c')
				{
					$errorCode = 'SHOP_1C';
					$errTitle = Loc::getMessage('LANDING_PUBLICATION_SHOP_ERROR_1C');
				}
				?>
				<div id="landing-popup-publication-error-area"
					style="display: none;"
					data-error="<?=$errorCode?>"
					<?=($errTitle ? " data-error-title=\"{$errTitle}\"" : '')?>
					<?=($errDesc ? " data-error-description=\"{$errDesc}\"" : '')?>
				>
				</div><?php
			endif;
		endif;
		// endregion

		?>

		<div class="landing-ui-panel-top-devices">
			<div class="landing-ui-panel-top-devices-inner">
				<button class="landing-ui-button landing-ui-button-desktop active" data-id="desktop_button" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_DEVICE_DESKTOP'))?>" aria-pressed="true"></button>
				<button class="landing-ui-button landing-ui-button-tablet" data-id="tablet_button" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_DEVICE_TABLET'))?>" aria-pressed="false"></button>
				<button class="landing-ui-button landing-ui-button-mobile" data-id="mobile_button" aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_DEVICE_MOBILE'))?>" aria-pressed="false"></button>
			</div>
		</div>

		<div style="flex:1"></div>

		<!-- region History-->
		<div class="landing-ui-panel-top-history">
			<button class="landing-ui-panel-top-history-button landing-ui-panel-top-history-undo landing-ui-disabled" type="button" tabindex="-1" disabled aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_HISTORY_UNDO'))?>"></button>
			<button class="landing-ui-panel-top-history-button landing-ui-panel-top-history-redo landing-ui-disabled" type="button" tabindex="-1" disabled aria-label="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_HISTORY_REDO'))?>"></button>
		</div>
		<!-- endregion -->

		<div class="landing-ui-panel-top-menu" id="landing-panel-settings">
			<?php if ($arParams['DRAFT_MODE'] != 'Y'):?>
				<?php if (
					$arResult['IS_AREA'] === false
					&& !$isVibeEditor
				):?>
					<button
						type="button"
						id="landing-popup-preview-btn"
						data-domain="<?= $site['DOMAIN_NAME']?>"
						data-form-verification-required="<?=(($isFormEditor && $arResult['FORM_VERIFICATION_REQUIRED']) ? '1' : '0')?>"
						data-form-verification-entity="<?=(int)$arResult['VERIFY_FORM_ID']?>"
						class="ui-btn ui-btn-light-border landing-ui-panel-top-menu-link landing-btn-menu">
						<?= $isFormEditor ? Loc::getMessage('LANDING_TPL_PREVIEW_URL_OPEN_FORM') : Loc::getMessage('LANDING_TPL_PREVIEW_URL_OPEN');?>
					</button>
				<?php endif;?>

				<?php if (!$isFormEditor): ?>
					<?php
						$featuresText = $isVibeEditor
							? Loc::getMessage('LANDING_MAINPAGE_FEATURES')
							: $component->getMessageType('LANDING_TPL_FEATURES');
					?>
					<input type="button" id="landing-popup-features-btn"<?php
						?>class="ui-btn ui-btn-light-border ui-btn-round landing-ui-panel-top-menu-link-features" <?php
						?><?php if ($formCode){?> data-feedback="landing-feedback-<?= $formCode?>-button"<?php }?><?php
						?> value="<?= $featuresText?>"<?php
						?> />
				<?php else: ?>
					<button type="button" class="ui-btn ui-btn-light-border ui-btn-round landing-form-editor-share-button"><?php
						echo Loc::getMessage('LANDING_FORM_FEATURES')
					?></button>
				<?php endif; ?>
			<?php else:?>
				<div id="landing-panel-settings-kb"></div>
			<?php endif;?>
		</div>

		<?php if ($isAiAssistantPanelRenderable): ?>
			<div class="landing-ui-panel-top-chat-toggle-container landing-ai-assistant-panel__toggle-container">
				<button
					class="landing-ui-panel-top-chat-toggle landing-ai-assistant-panel__toggle<?= $isAiAssistantToggleDisabled ? ' landing-ui-panel-top-chat-toggle--disabled-offset' : '' ?>"
					type="button"
					aria-expanded="<?= $startAiAssistantPanelMinimized ? 'false' : 'true' ?>"
					<?= $isAiAssistantToggleDisabled ? 'aria-disabled="true"' : '' ?>
				>
					<?= $aiAssistantToggleText ?>
				</button>
			</div>
		<?php endif; ?>

		<?php if ($isVibeEditor): ?>
			<?php if ($isVibeFeatureAvailable ?? false): ?>
				<div class="landing-ui-panel-top-mainpage-public">
					<?php $hide = ' style="display: none;"'; ?>

					<div
						id="landing-vibe-unpublication"
						class="ui-btn ui-btn-light-border"
						<?= ($isVibePublic ?? false) ? '' : $hide ?>
					>
						<?= Loc::getMessage('LANDING_MAINPAGE_UNPUBLIC') ?>
					</div>
					<div
						id="landing-vibe-publication"
						class="ui-btn ui-btn-primary"
						<?= ($isVibePublic ?? false) ? $hide : '' ?>
					>
						<?= Loc::getMessage('LANDING_MAINPAGE_PUBLIC') ?>
					</div>

					<script>
						BX.ready(() => {
							new BX.Landing.Component.View.MainpagePublication({
								buttonPublic: BX('landing-vibe-publication'),
								buttonUnpublic: BX('landing-vibe-unpublication'),
								vibeModuleId: '<?= isset($vibe) ? CUtil::JSEscape($vibe->getModuleId()) : null ?>',
								vibeEmbedId: '<?= isset($vibe) ? CUtil::JSEscape($vibe->getEmbedId()) : null ?>',
								isPublic: <?= ($isVibePublic ?? false) ? 'true' : 'false' ?>,
							});
						});
					</script>
				</div>
			<?php else: ?>
				<div class="landing-ui-panel-top-mainpage-public" onclick="BX.UI.InfoHelper.show('limit_office_vibe');">
					<div
						id="landing-vibe-publication-disabled"
						class="ui-btn ui-btn-primary landing-ui-disabled"
					>
						<?= Loc::getMessage('LANDING_MAINPAGE_PUBLIC') ?>
					</div>
				</div>
			<?php endif; ?>
		<?php endif; ?>

	</div>
	<?php endif; ?>
	<div class="landing-ui-view-container">
<?php endif;?>

<?php
if ($arParams['TYPE'] === 'STORE')
{
	$submitText = Loc::getMessage('LANDING_PUBLICATION_STORE_SUBMIT');
}
else
{
	$submitText = Loc::getMessage('LANDING_PUBLICATION_SUBMIT');
}
?>

<script>
	var landingParams = <?= \CUtil::phpToJSObject($arParams);?>;
	var landingSiteType = '<?= $arParams['TYPE'];?>';
	BX.ready(function()
	{
		BX.UI.Hint.init(document.querySelector('.landing-ui-panel'));
		BX.UI.Hint.popupParameters = {
			angle: false
		};

		BX.message({
			LANDING_SITE_TYPE: '<?= $arParams['TYPE'];?>',
			LANDING_PUBLIC_PAGE_REACHED: '<?= \CUtil::jsEscape(\Bitrix\Landing\Restriction\Manager::getSystemErrorMessage('limit_sites_number_page'));?>',
			LANDING_TPL_SETTINGS_SITE_URL: '<?= \CUtil::jsEscape($component->getMessageType('LANDING_TPL_SETTINGS_SITE_URL'));?>',
			LANDING_TPL_SETTINGS_SITE_DIZ_URL: '<?= \CUtil::jsEscape($component->getMessageType('LANDING_TPL_SETTINGS_SITE_DIZ_URL'));?>',
			LANDING_TPL_SETTINGS_CATALOG_URL: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_SETTINGS_CATALOG_URL'));?>',
			LANDING_TPL_SETTINGS_PAGE_URL: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_SETTINGS_PAGE_URL'));?>',
			LANDING_TPL_SETTINGS_PAGE_DIZ_URL: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_SETTINGS_PAGE_DIZ_URL'));?>',
			LANDING_PREVIEW_MOBILE_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PREVIEW_MOBILE_TITLE'));?>',
			LANDING_PREVIEW_MOBILE_TEXT: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PREVIEW_MOBILE_TEXT'));?>',
			LANDING_PREVIEW_MOBILE_NEW_TAB: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PREVIEW_MOBILE_NEW_TAB_MSGVER_1'));?>',
			LANDING_PREVIEW_MOBILE_COPY_LINK: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PREVIEW_MOBILE_COPY_LINK'));?>',
			LANDING_PUBLICATION_SUBMIT: '<?= \CUtil::jsEscape($submitText);?>',
			LANDING_PUBLICATION_AUTO: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PUBLICATION_AUTO'));?>',
			LANDING_PUBLICATION_AUTO_OFF: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PUBLICATION_AUTO_OFF'));?>',
			LANDING_TPL_FEATURES_FORMS_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_FEATURES_FORMS_TITLE'));?>',
			LANDING_TPL_FEATURES_FORMS_PROMO_LINK: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_FEATURES_FORMS_PROMO_LINK'));?>',
			LANDING_TPL_FEATURES_SETTINGS: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_FEATURES_SETTINGS'));?>',
			LANDING_TPL_FEATURES_OL_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_FEATURES_OL_TITLE'));?>',
			LANDING_TPL_FEATURES_OL_PROMO_LINK: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_FEATURES_OL_PROMO_LINK'));?>',
			LANDING_TPL_FEATURES_HELP_TITLE_MSGVER_1: '<?= \CUtil::jsEscape($component->getMessageType('LANDING_TPL_FEATURES_HELP_TITLE_MSGVER_1'));?>',
			LANDING_TPL_FEATURES_HELP_PROMO_LINK_MSGVER_1: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_FEATURES_HELP_PROMO_LINK_MSGVER_1'));?>',
			LANDING_PAGE_STATUS_PUBLIC: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PAGE_STATUS_PUBLIC'));?>',
			LANDING_PAGE_STATUS_PUBLIC_NOW: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PAGE_STATUS_PUBLIC_NOW'));?>',
			LANDING_PAGE_STATUS_UPDATED_ORIG: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PAGE_STATUS_UPDATED_ORIG'));?>',
			LANDING_PAGE_STATUS_UPDATED_NOW_ORIG: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PAGE_STATUS_UPDATED_NOW_ORIG'));?>',
			LANDING_PUBLICATION_BUY_RENEW: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PUBLICATION_BUY_RENEW'));?>',
			LANDING_PUBLICATION_CONFIRM_EMAIL: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PUBLICATION_CONFIRM_EMAIL'));?>',
			LANDING_PUBLICATION_GOTO_BLOCK: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PUBLICATION_GOTO_BLOCK'));?>',
			LANDING_SITE_TILE_POPUP_COPY_LINK_COMPLETE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_SITE_TILE_POPUP_COPY_LINK_COMPLETE'));?>',
			LANDING_TPL_PREVIEW_URL: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_PREVIEW_URL'));?>',
			LANDING_TPL_PREVIEW_URL_HINT: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_PREVIEW_URL_HINT'));?>',
			LANDING_PAR_PAGE_URL_SITE_EDIT: '<?= \CUtil::jsEscape($arParams['PAGE_URL_SITE_EDIT']);?>',
			LANDING_TPL_PREVIEW_EXIT: '<?= \CUtil::jsEscape($arParams['LANDING_TPL_PREVIEW_EXIT']);?>',
			LANDING_OPEN_FORM_PHONE_VERIFY_CUSTOM_SLIDER_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_OPEN_FORM_PHONE_VERIFY_CUSTOM_SLIDER_TITLE'));?>',
			LANDING_OPEN_FORM_PHONE_VERIFY_CUSTOM_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_OPEN_FORM_PHONE_VERIFY_CUSTOM_TITLE'));?>',
			LANDING_OPEN_FORM_PHONE_VERIFY_CUSTOM_DESCRIPTION: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_OPEN_FORM_PHONE_VERIFY_CUSTOM_DESCRIPTION'));?>',
			LANDING_PUBLICATION_SHOP_ERROR_1C_BUTTON: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PUBLICATION_SHOP_ERROR_1C_BUTTON'));?>',
			LANDING_PUBLICATION_SHOP_ERROR_1C_BUTTON_LINK: '<?= isset($arResult['PUBLICATION_ERROR_LINK']) ? \CUtil::jsEscape($arResult['PUBLICATION_ERROR_LINK']) : '';?>',
			PAGE_URL_LANDING_SETTINGS: '<?= \CUtil::jsEscape($arParams['PAGE_URL_LANDING_SETTINGS']);?>',
		});
	});
</script>

<!-- fonts proxy-->
<?= $component->getFontProxyUrlScript() ?>

<?php
// check accepted
if (
	$arParams['AGREEMENT_ACCEPTED'] === false
	&& in_array($arParams['TYPE'], ['PAGE', 'STORE'])
)
{
	return;
}

// editor frame
if ($request->offsetExists('landing_mode'))
{
	if (SITE_TEMPLATE_ID == 'bitrix24')
	{
		$component->refresh();
	}
	if ($request->get('landing_mode') == 'edit')
	{
		Manager::setPageView('MainClass', 'landing-edit-mode');
		if (!$arResult['CAN_EDIT_SITE'])
		{
			Manager::setPageView('MainClass', 'landing-ui-hide-controls');
		}
	}
	$arResult['LANDING']->view();
	?>
	<style>
		.bx-session-message {
			display: none;
		}
		.landing-ui-external-controls .main-color-picker-box {
			width: 14px!important;
			height: 14px!important;
		}
	</style>
	<script>
		BX.ready(function()
		{
			<?php if ($arParams['DRAFT_MODE'] != 'Y'):?>
			new BX.Landing.Component.View.AutoPublication({
				pageIsUnActive: <?= $arResult['LANDING']->isActive() ? 'false' : 'true';?>
			});
			<?php endif;?>
			BX.Landing.Component.View.create(
				<?= \CUtil::phpToJSObject($arResult['TOP_PANEL_CONFIG']);?>
			);
		});
	</script>
	<?php if ($request->get('forceLoad') == 'true'):?>
		<script>
			BX.namespace('BX.Landing');
			BX.Landing.Block = function(element) {
				BX.onCustomEvent(window, 'BX.Landing.Block:init', [
					new BX.Landing.Event.Block({
						block: element,
						node: null,
						card: null,
						data: {},
						onForceInit: function() {}
					})
				]);
			};
			BX.Landing.Main = function() {};
			BX.Landing.Main.createInstance = function() {};
		</script>
	<?php endif;?>

	<script>
		BX.ready(() => {
			const observer = new BX.Landing.Copilot.GenerationObserver(null, {
				landingId: <?= (int)$arResult['LANDING']->getId() ?>,
			});
			observer.observe();
		});
	</script>

	<?php if (isset($generationId) || $isNewLanding || $isFromAiGenerator): ?>
		<script>
			BX.ready(() => {
				const currentUrl = new URL(window.parent.location.href);
				<?php if ($isNewLanding): ?>
				currentUrl.search = '';
				<?php elseif (isset($generationId)): ?>
				// keep non-SEF editor routing in the query, drop only the generation mark,
				// otherwise a refresh of the cleaned URL leads to a wrong screen
				currentUrl.searchParams.delete('site_generated');
				<?php else: ?>
				// the transition from AI 2.0 keeps the editor routing of the non-SEF config in the query
				// and only drops its own mark, otherwise a refresh of the cleaned URL leads to a wrong screen
				currentUrl.searchParams.delete('<?= CUtil::jsEscape(Metrika\EditorOpenEventResolver::FROM_GENERATOR_PARAM) ?>');
				<?php endif; ?>
				window.parent.history.replaceState({}, '', currentUrl.toString());
			});
		</script>
	<?php endif; ?>

	<?php if ($request->get('IS_AJAX') != 'Y'):?>
	<script>
		top.BX.addCustomEvent(
			'BX.Rest.Configuration.Install:onFinish',
			function(event)
			{
				if (!!event.data.elementList && event.data.elementList.length > 0)
				{
					let gotoSiteButton = null;
					for (let i = 0; i < event.data.elementList.length; i++)
					{
						gotoSiteButton = event.data.elementList[i];
						if (
							!gotoSiteButton
							|| gotoSiteButton.nodeName !== 'A'
						)
						{
							continue;
						}

						const replaces = [];
						let landingPath = '<?= CUtil::jsEscape($arParams['PARAMS']['sef_url']['landing_view']) ?>';

						if (gotoSiteButton.dataset.siteId)
						{
							replaces.push([/#site_show#/, gotoSiteButton.dataset.siteId]);
						}
						if (gotoSiteButton.dataset.isLanding === 'Y' && gotoSiteButton.dataset.landingId)
						{
							replaces.push([/#landing_edit#/, gotoSiteButton.dataset.landingId]);
						}
						let replaceLid = null;
						if (gotoSiteButton.dataset.replaceLid && gotoSiteButton.dataset.replaceLid > 0)
						{
							replaceLid = gotoSiteButton.dataset.replaceLid;
						}
						if (gotoSiteButton.getAttribute('href').substr(0, 1) === '#')
						{
							replaces.forEach(function(replace) {
								landingPath = landingPath.replace(replace[0], replace[1]);
							});

							landingPath += '?newLanding=Y';
							if (replaceLid)
							{
								landingPath += '&replacedLanding=Y';
							}
							gotoSiteButton.setAttribute('href', landingPath);
							setTimeout(() => {top.window.location.href = landingPath}, 10000);
						}
					}
				}
			}
		);
	</script>
	<?php endif?>

	<?php
	if (
		$isVibeEditor
		&& \Bitrix\Main\Loader::includeModule('intranet')
	)
	{
		$themePicker = new \Bitrix\Intranet\Integration\Templates\Bitrix24\ThemePicker('bitrix24');
		$theme = $themePicker->getCurrentTheme();
		$bg = ($theme && $theme['prefetchImages'] && is_array($theme)) ? current($theme['prefetchImages']) : null;
		if ($bg)
		{
			// exec theme-hooks for design panel
			$hooksLanding = \Bitrix\Landing\Hook::getForLanding($arResult['LANDING']->getId());
			$hooksSite = \Bitrix\Landing\Hook::getForSite($arResult['LANDING']->getSiteId());
			if (
				(!isset($hooksLanding['BACKGROUND']) || !$hooksLanding['BACKGROUND']->enabled())
				&&
				(!isset($hooksSite['BACKGROUND']) || !$hooksSite['BACKGROUND']->enabled())
			)
			{
				$hooksLanding['BACKGROUND']->setData([
					'USE' => 'Y',
					'PICTURE' => $bg,
				]);
				$hooksLanding['BACKGROUND']->exec();
			}
		}
	}

	?>

	<?php
}
// top panel
else
	{
		Asset::getInstance()->addJS('/bitrix/components/bitrix/landing.landing_view/templates/.default/es6/script.js');

		// exec theme-hooks for design panel
		$hooksLanding = \Bitrix\Landing\Hook::getForLanding($arResult['LANDING']->getId());
	$hooksSite = \Bitrix\Landing\Hook::getForSite($arResult['LANDING']->getSiteId());
	if (isset($hooksLanding['THEME']) && $hooksLanding['THEME']->enabled())
	{
		$hooksLanding['THEME']->exec();
	}
	elseif (isset($hooksSite['THEME']) && $hooksSite['THEME']->enabled())
	{
		$hooksSite['THEME']->exec();
	}

	// title
	Manager::setPageTitle(
		\htmlspecialcharsbx($arResult['LANDING']->getTitle())
	);
	// available view
	$check = \Bitrix\Landing\Restriction\Manager::isAllowed(
		'limit_knowledge_base_number_page_view',
		['ID' => $arResult['LANDING']->getSiteId()]
	);
	if (!$check)
	{
		?>
		<script>
			BX.ready(function()
			{
				document.body.style.opacity = 0.1;
				top.BX.UI.InfoHelper.show('limit_knowledge_base_number_page_view');
			});
		</script>
	<?php
	}
	?>
	<style>
		html, body {
			height: 100%;
			overflow: hidden;
		}
	</style>
	<script>
		BX.ready(function() {
			window.addEventListener('scroll', (e) => {
				e.preventDefault();
				window.requestAnimationFrame(() => {
					window.scroll(0, 0); }
				);
			});

			<?php if ($successSave): ?>
				if (typeof BX.SidePanel !== 'undefined')
				{
					BX.SidePanel.Instance.close();
				}
			<?php endif; ?>
			BX.Landing.Component.View.create(
				<?= \CUtil::phpToJSObject($arResult['TOP_PANEL_CONFIG']);?>,
				true
			);
			<?php if ($isAiAssistantChatExpandable): ?>
				const aiSiteTriggerOptions = <?= $aiSiteTriggerOptions ?>;
				new BX.Landing.AiAssistant.WidgetPanel({
					rootContainer: document.querySelector('.landing-ui-view-layout'),
					<?php if ($aiAssistantDialogId !== ''): ?>
					dialogId: <?= $aiAssistantDialogIdJson ?>,
					<?php endif; ?>
					triggerOptions: aiSiteTriggerOptions,
					imApplicationData: <?= $imApplicationData ?>,
					startMinimized: <?= Json::encode($startAiAssistantPanelMinimized) ?>,
					syncMainChatOpenState: <?= Json::encode($syncMainChatOpenState) ?>,
					openText: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_VIEW_COPILOT_CHAT_TOGGLE_OPEN')) ?>',
					closeText: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_VIEW_COPILOT_CHAT_TOGGLE_CLOSE')) ?>',
					logPrefix: 'Landing panel: view',
				}).init();
				<?php endif; ?>
				<?php if (!$isKnowledge && !$isVibeEditor):?>
					<?php if (!$isAiSiteUiEnabled):?>
						const slidePanel = new BX.Landing.View.SlidePanel();

						new BX.Landing.View.Device({
							target: slidePanel.getPreviewContainer(),
						editorFrameWrapper: document.querySelector('.landing-ui-view-iframe-wrapper'),
						frameUrl: '<?= \CUtil::JSEscape($urls['preview_device']->getUri())?>',
						messages: {
							LANDING_PREVIEW_DEVICE_MOBILES: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PREVIEW_DEVICE_MOBILES'));?>',
							LANDING_PREVIEW_DEVICE_TABLETS: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_PREVIEW_DEVICE_TABLETS'));?>',
							LANDING_TPL_PREVIEW_LOADING: '<?= \CUtil::jsEscape(Loc::getMessage('LANDING_TPL_PREVIEW_LOADING'));?>',
						}
					});
				<?php endif; ?>

				new BX.Landing.View.ExternalControls({
					container: document.querySelector('.landing-ui-view-wrapper'),
					iframeWrapper: document.querySelector('.landing-ui-view-iframe-wrapper'),
					messages: {
						LANDING_TPL_EXT_BUTTON_DESIGNER_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_DESIGNER_BLOCK'))?>',
						LANDING_TPL_EXT_BUTTON_STYLE_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_STYLE_BLOCK'))?>',
						LANDING_TPL_EXT_BUTTON_STYLE_BLOCK_TITLE: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_STYLE_BLOCK_TITLE'))?>',
						LANDING_TPL_EXT_BUTTON_EDIT_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_EDIT_BLOCK'))?>',
						LANDING_TPL_EXT_BUTTON_EDIT_BLOCK_TITLE: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_EDIT_BLOCK_TITLE'))?>',
						LANDING_TPL_EXT_BUTTON_DOWN_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_DOWN_BLOCK'))?>',
						LANDING_TPL_EXT_BUTTON_UP_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_UP_BLOCK'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_BLOCK'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_BLOCK_TITLE: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_BLOCK_TITLE'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_HIDE: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_HIDE'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_SHOW: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_SHOW'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_CUT: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_CUT'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_COPY: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_COPY'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_PASTE: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_PASTE'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_FEEDBACK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_FEEDBACK_MSGVER_1'))?>',
						LANDING_TPL_EXT_BUTTON_ACTIONS_SAVE_IN_LIBRARY: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_ACTIONS_SAVE_IN_LIBRARY_MSGVER_1'))?>',
						LANDING_TPL_EXT_BUTTON_REMOVE_BLOCK: '<?= CUtil::JSEscape(Loc::getMessage('LANDING_TPL_EXT_BUTTON_REMOVE_BLOCK'))?>',
					}
				});
			<?php endif?>
		});
	</script>
	<div class="landing-ui-view-wrapper">
		<div class="landing-editor-loader-container"></div>
			<?php // filled in and given its alert role by the script: an empty region announces nothing?>
			<div class="landing-editor-required-user-action"></div>
			<div class="landing-ui-view-iframe-wrapper">
				<iframe src="<?= htmlspecialcharsbx($urls['landingFrame']->getUri()) ?>" class="landing-ui-view" id="landing-view-frame" title="<?=htmlspecialcharsbx(Loc::getMessage('LANDING_TPL_EDITOR_FRAME_TITLE'))?>" allowfullscreen></iframe>
			</div>
	</div>
	</div>
	<?php if ($isAiAssistantPanelRenderable): ?>
		</div>
		<?php if ($isAiAssistantChatExpandable): ?>
			<div class="landing-ui-view-chat landing-ai-assistant-panel__chat" aria-hidden="<?= $aiAssistantChatAriaHidden ?>">
				<div class="landing-ai-assistant-panel__widget"></div>
			</div>
		<?php endif; ?>
	</div>
	<?php endif; ?>
<?php
}
