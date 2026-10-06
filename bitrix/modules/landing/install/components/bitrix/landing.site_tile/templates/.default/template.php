<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Landing\Copilot\Services\NameService;
use Bitrix\Landing\Manager;
use Bitrix\Landing\Metrika\Sections;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;

/** @var array $arParams */
/** @var array $arResult */
/** @var string $templateFolder */
/** @var \LandingSiteTileComponent $component */

Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'sidepanel',
	'main.qrcode',
	'ui.dialogs.messagebox',
	'ui.hint',
	'ui.a11y',
	'main.popup',
	'ui.icon-set.outline',
]);

$isAjax = $component->isAjax();
$request = \Bitrix\Main\Application::getInstance()->getContext()->getRequest();
$zone = Manager::getZone();

?>

<script>
	BX.ready(function()
	{
		<?if ($arResult['SIDE_PANEL_SHORT'] && !$isAjax):?>
		BX.SidePanel.Instance.bindAnchors({
			rules: [
				{
					condition: <?= \CUtil::PhpToJSObject($arResult['SIDE_PANEL_SHORT'])?>,
					stopParameters: ['tab', 'action'],
					options: {
						allowChangeHistory: false,
						width: 600,
						contentClassName: 'landing-site-contacts-wrapper'
					}
				}
			]
		});
		<?endif;?>
		<?php if ($arResult['SIDE_PANEL'] && !$isAjax): ?>
		<?php $addUrlCondition = $component->getUrlAddSidepanelCondition(); ?>
		BX.SidePanel.Instance.bindAnchors({
			rules: [
				<?php if ($addUrlCondition): ?>
				{
					condition: [<?= CUtil::phpToJSObject($addUrlCondition) ?>],
					options: {
						allowChangeHistory: false,
						customLeftBoundary: 0,
						cacheable: false,
						<?php if ($arParams['TYPE'] === 'STORE'): ?>
							width: 1200,
						<?php endif; ?>
					}
				},
				<?php endif; ?>
				{
					condition: <?= \CUtil::PhpToJSObject($arResult['SIDE_PANEL'])?>,
					stopParameters: ['tab', 'action'],
					options: { allowChangeHistory: false }
				}
			]
		});
		<?php endif; ?>
	});
</script>

<?php
$isAiSiteChatAvailable =
	($arParams['AI_SITE_CHAT_AVAILABLE'] ?? true) !== false
	&& ($arParams['AI_SITE_CHAT_AVAILABLE'] ?? true) !== 'N'
;

// every entry point of the tile opens the same address of the generation page, marked by the source of the entry
$aiUrl = (string)($arParams['AI_URL'] ?? '');
$aiGenerationUrl = (new Uri($aiUrl !== '' ? $aiUrl : '/sites/ai/'))
	->addParams([Sections::URL_PARAM => Sections::sites->value])
	->getUri()
;

if ($arParams['TYPE'] === 'PAGE' && $isAiSiteChatAvailable && empty($arParams['IS_DELETED']))
{
	$htmlItems = [];
	$aiFirstVisitTooltipOptionName = LandingSiteTileComponent::getAiFirstVisitTooltipOptionName();
	$aiFirstVisitTooltipTitle = Loc::getMessage('LANDING_SITE_TILE_AI_FIRST_VISIT_POPUP_TITLE');
	$aiFirstVisitTooltipText = Loc::getMessage('LANDING_SITE_TILE_AI_FIRST_VISIT_POPUP_TEXT');
	$shouldShowAiFirstVisitTooltip =
		\CUserOptions::getOption('landing', $aiFirstVisitTooltipOptionName, 'N') !== 'Y'
		&& is_string($aiFirstVisitTooltipTitle)
		&& $aiFirstVisitTooltipTitle !== ''
		&& is_string($aiFirstVisitTooltipText)
		&& $aiFirstVisitTooltipText !== ''
	;
	$aiFirstVisitTooltipOptions = [
		'shouldShow' => $shouldShowAiFirstVisitTooltip,
		'optionName' => $aiFirstVisitTooltipOptionName,
		'component' => 'bitrix:landing.site_tile',
		'action' => 'markAiFirstVisitTooltipSeen',
		'title' => $aiFirstVisitTooltipTitle,
		'text' => $aiFirstVisitTooltipText,
	];

	$htmlItems[] = 'fan';
	if ($isAiSiteChatAvailable)
	{
		$htmlItems[] = 'input';
	}
	$htmlItems[] = 'buttons';

	if (count($htmlItems) > 0)
	{
		$marketButtonUrl = $arParams['PAGE_URL_SITE_ADD'] ?: '#';
		$templatesButtonText = Loc::getMessage('LANDING_SITE_TILE_AI_TEMPLATES_BUTTON');
		$builderButtonText = Loc::getMessage('LANDING_SITE_TILE_AI_BUILDER_BUTTON');

		$fan = '<div id="landing-sites-ai-slider" data-testid="landing-sites-ai-slider"></div>';
		$inputPlaceholder = NameService::replaceCopilotName(Loc::getMessage('LANDING_SITE_TILE_AI_INPUT_PLACEHOLDER'));
		$inputLabel = NameService::replaceCopilotName(Loc::getMessage('LANDING_SITE_TILE_AI_INPUT_LABEL'));
		$inputNotice = Loc::getMessage('LANDING_SITE_TILE_AI_INPUT_NOTICE');
		$inputSubmitLabel = Loc::getMessage('LANDING_SITE_TILE_AI_SUBMIT_BUTTON');
		$inputIconHref = $aiUrl !== '' ? $aiGenerationUrl : '';
		$inputNoticeId = 'landing-sites-ai-input-notice';
		$inputContainer = '<div tabindex="-1" class="landing-sites-ai__input-frame --inactive" data-testid="landing-sites-ai-input-frame" data-landing-sites-ai-input-frame>'
			. '<div class="landing-sites-ai__input-box --inactive" data-landing-sites-ai-input-box>'
			. '<div class="landing-sites-ai__input-notice" id="' . htmlspecialcharsbx($inputNoticeId) . '" data-testid="landing-sites-ai-input-notice" data-landing-sites-ai-input-notice>' . htmlspecialcharsbx($inputNotice) . '</div>'
			. '<div class="landing-sites-ai__input-control" data-landing-sites-ai-input-control>'
			. '<div class="landing-sites-ai__input" contenteditable="false" role="textbox" aria-label="' . htmlspecialcharsbx($inputLabel) . '" aria-multiline="true" aria-describedby="' . htmlspecialcharsbx($inputNoticeId) . '" aria-disabled="true" tabindex="-1" data-placeholder="' . htmlspecialcharsbx($inputPlaceholder) . '" data-testid="landing-sites-ai-input" data-landing-sites-ai-input></div>'
			. '<button type="button" class="landing-sites-ai__input-icon" data-action="' . htmlspecialcharsbx($inputIconHref) . '" tabindex="-1" aria-disabled="true" aria-label="' . htmlspecialcharsbx($inputSubmitLabel) . '" data-testid="landing-sites-ai-submit-btn" data-landing-sites-ai-input-icon></button>'
			. '</div>'
			. '<input type="hidden" name="ai_prompt" data-landing-sites-ai-input-value /> '
			. '</div>'
			. '</div>';
		$buttonsContainer = '<div class="landing-sites-ai__actions" data-testid="landing-sites-ai-actions">'
			. '<a class="ui-btn ui-btn-no-caps landing-action-btn" href="' . htmlspecialcharsbx($marketButtonUrl) . '" data-testid="landing-sites-ai-templates-btn"> <div class="ui-icon-set --o-market" aria-hidden="true"></div> ' . htmlspecialcharsbx($templatesButtonText) . '</a> '
			. '<button type="button" class="ui-btn ui-btn-no-caps landing-action-btn" data-testid="landing-sites-ai-builder-btn" onclick="BX.Landing.Component.Filter.onCreateDropdownItemClick(\'build_yourself\');"> <div class="ui-icon-set --s-browser" aria-hidden="true"></div> ' . htmlspecialcharsbx($builderButtonText) . '</button>'
			. '</div>';

		$fanHtml = in_array('fan', $htmlItems, true) ? $fan : '';
		$inputContainerHtml = in_array('input', $htmlItems, true) ? $inputContainer : '';
		$buttonsContainerHtml = in_array('buttons', $htmlItems, true) ? $buttonsContainer : '';

		$aiHtml = '<div class="landing-sites-ai-shell" data-testid="landing-sites-ai-shell">'
			. '<div class="landing-sites-ai-shell__inner">'
			. $fanHtml
			. $inputContainerHtml
			. $buttonsContainerHtml
			. '</div>'
			. '</div>';
	}

	if (isset($aiHtml))
	{
		echo $aiHtml;
	}
}
?>

<?php if ($arParams['TYPE'] === 'PAGE' && $isAiSiteChatAvailable && empty($arParams['IS_DELETED'])): ?>
<script>
	BX.ready(function()
	{
		let isLandingSitesAiInputRightPanelBound = false;
		let isLandingSitesAiInputInitialized = false;
		let isLandingSitesAiSliderInitialized = false;
		let isLandingSitesAiFirstVisitTooltipInitialized = false;
		const isLandingSitesAiChatAvailable = <?= $isAiSiteChatAvailable ? 'true' : 'false' ?>;
		const landingSitesAiFirstVisitTooltipOptions = <?= CUtil::PhpToJSObject($aiFirstVisitTooltipOptions ?? []) ?>;

		const getLandingSitesAiRightPanel = function()
		{
			const reflection = BX && BX.Reflection;
			if (!reflection || typeof reflection.getClass !== 'function')
			{
				return null;
			}

			const siteTemplate = reflection.getClass('BX.Intranet.Bitrix24.Template');
			if (!siteTemplate || typeof siteTemplate.getRightPanel !== 'function')
			{
				return null;
			}

			const rightPanel = siteTemplate.getRightPanel();
			if (!rightPanel || typeof rightPanel.isExpanded !== 'function')
			{
				return null;
			}

			return rightPanel;
		};

		const syncLandingSitesAiInputState = function(rightPanel)
		{
			if (!rightPanel || !BX.Landing.Component.LandingSitesAiInput)
			{
				return;
			}

			BX.Landing.Component.LandingSitesAiInput.setActive(isLandingSitesAiChatAvailable && !rightPanel.isExpanded());
		};

		const bindLandingSitesAiInputRightPanel = function()
		{
			if (isLandingSitesAiInputRightPanelBound)
			{
				return;
			}

			const rightPanel = getLandingSitesAiRightPanel();
			if (!rightPanel || typeof rightPanel.subscribe !== 'function')
			{
				return;
			}

			syncLandingSitesAiInputState(rightPanel);
			rightPanel.subscribe('onExpand', function()
			{
				if (BX.Landing.Component.LandingSitesAiInput)
				{
					BX.Landing.Component.LandingSitesAiInput.setActive(false);
				}
			});
			rightPanel.subscribe('onCollapse', function()
			{
				if (BX.Landing.Component.LandingSitesAiInput)
				{
					BX.Landing.Component.LandingSitesAiInput.setActive(isLandingSitesAiChatAvailable, { focus: true });
				}
			});
			isLandingSitesAiInputRightPanelBound = true;
		};

		const initLandingSitesAiFirstVisitTooltip = function()
		{
			if (
				isLandingSitesAiFirstVisitTooltipInitialized
				|| !isLandingSitesAiChatAvailable
				|| !isLandingSitesAiInputInitialized
				|| !isLandingSitesAiSliderInitialized
				|| !BX.Landing.Component.LandingSitesAiFirstVisitTooltip
			)
			{
				return;
			}

			const bindElement = document.querySelector('[data-landing-sites-ai-input]');
			if (!bindElement)
			{
				return;
			}

			isLandingSitesAiFirstVisitTooltipInitialized = true;
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					BX.Landing.Component.LandingSitesAiFirstVisitTooltip.init({
						...landingSitesAiFirstVisitTooltipOptions,
						bindElement: bindElement,
					});
				});
			});
		};

		const initLandingSitesAiInput = function()
		{
			if (!BX.Landing.Component.LandingSitesAiInput)
			{
				setTimeout(initLandingSitesAiInput, 50);
				return;
			}

			BX.Landing.Component.LandingSitesAiInput.init({
				box: document.querySelector('[data-landing-sites-ai-input-box]'),
				frame: document.querySelector('[data-landing-sites-ai-input-frame]'),
				notice: document.querySelector('[data-landing-sites-ai-input-notice]'),
				control: document.querySelector('[data-landing-sites-ai-input-control]'),
				input: document.querySelector('[data-landing-sites-ai-input]'),
				valueInput: document.querySelector('[data-landing-sites-ai-input-value]'),
				icon: document.querySelector('[data-landing-sites-ai-input-icon]'),
			});

			const rightPanel = getLandingSitesAiRightPanel();
			syncLandingSitesAiInputState(rightPanel);
			bindLandingSitesAiInputRightPanel();

			isLandingSitesAiInputInitialized = true;
			initLandingSitesAiFirstVisitTooltip();
		};

		if (isLandingSitesAiChatAvailable)
		{
			initLandingSitesAiInput();
		}

		const initLandingSitesAiSlider = function()
		{
			if (!BX.Landing.Component.LandingSitesAiSlider)
			{
				setTimeout(initLandingSitesAiSlider, 50);
				return;
			}

			BX.Landing.Component.LandingSitesAiSlider.init({
				renderTo: BX('landing-sites-ai-slider'),
				templateFolder: '<?= CUtil::JSEscape($templateFolder) ?>',
				lang: '<?= CUtil::JSEscape(LANGUAGE_ID) ?>',
			});

			isLandingSitesAiSliderInitialized = true;
			initLandingSitesAiFirstVisitTooltip();
		};

		initLandingSitesAiSlider();
	});
</script>
<?php endif; ?>

<?php if (!empty($arParams['IS_DELETED']) && !$arParams['ITEMS'] && $arParams['TOTAL_COUNT'] === 0): ?>
	<div class="landing-sites__trash-empty" data-testid="landing-sites-trash-empty">
		<div class="landing-sites__trash-empty-card">
			<div class="landing-sites__trash-empty-image" aria-hidden="true">
				<span class="ui-icon-set --o-trashcan"></span>
			</div>
			<div class="landing-sites__trash-empty-title" role="status">
				<?= htmlspecialcharsbx(Loc::getMessage('LANDING_SITE_TILE_TRASH_EMPTY_TITLE')) ?>
			</div>
		</div>
	</div>
	<div class="landing-sites" id="landing-sites"></div>
<?php elseif (!$arParams['ITEMS'] && $arParams['TYPE'] === 'STORE' ):
	$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT1');
	if ($zone === 'ru')
	{
		$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT6');
	}
	else
	{
		$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT2');
	}
	$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT3');
	if ($zone === 'ru')
	{
		$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT7');
	}
	else
	{
		$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT4');
	}
	$features[] = $component->getMessageType('LANDING_SITE_TILE_EMPTY_FEAT5');
	\trimArr($features, true);
	$langImg = Manager::availableOnlyForZone('ru') ? 'ru' : 'en';
	?>
	<div class="landing-sites__grid-empty landing-sites__scope">
		<div class="landing-sites__grid-empty--all-info">
			<div class="landing-sites__grid-empty--info-text-container">
				<div class="landing-sites__grid-empty--info-block-title">
					<div class="landing-sites__grid-empty--title-quickly">
						<?= $component->getMessageType('LANDING_SITE_TILE_EMPTY_HEADER1')?>
					</div>
					<div class="landing-sites__grid-empty--title">
						<?= $component->getMessageType('LANDING_SITE_TILE_EMPTY_HEADER2')?>
					</div>
					<?php if (\Bitrix\Landing\Connector\Ai::isCopilotAvailable()): ?>
						<div class="landing-sites__grid-empty--balloon">
							<div class="ui-icon-set --copilot-ai landing-sites__grid-empty--balloon-icon"></div>
							<div class="landing-sites__grid-empty--balloon-text"><?= NameService::replaceCopilotName($component->getMessageType('LANDING_SITE_TILE_EMPTY_BALLOON_TEXT_MSGVER_1'))?></div>
						</div>
					<?php endif; ?>
				</div>
				<div class="landing-sites__grid-empty--info-block-content">
					<ul class="landing-sites__grid-empty--list-items">
						<?foreach ($features as $feature):?>
						<li class="landing-sites__grid-empty--list-item"><?= $feature?></li>
						<?endforeach;?>
					</ul>
					<div class="landing-sites__grid-empty--bth-container">
						<?php if ($arParams['PAGE_URL_SITE_ADD'] !== ''): ?>
							<a href="<?= $arParams['PAGE_URL_SITE_ADD']?>" class="ui-btn ui-btn-success landing-sites__grid-empty--bth-radiance">
								<?= $component->getMessageType('LANDING_SITE_TILE_EMPTY_ADD_2')?>
							</a>
						<?php else: ?>
							<p class="landing-sites__grid-empty--text">
								<?= $component->getMessageType('LANDING_SITE_TILE_EMPTY_ADD_NO_RIGHT')?>
							</p>
						<?php endif; ?>
					</div>
				</div>
			</div>
			<div class="landing-sites__grid-empty--info-image-block">
				<img src="<?= $templateFolder?>/images/empty_<?= htmlspecialcharsbx(strtolower((string)$arParams['TYPE']))?>_<?= $langImg?>.png" alt="" class="landing-sites__grid-empty--info-image"/>
			</div>
		</div>
	</div>
<?php else: ?>
	<div class="landing-sites" id="landing-sites"></div>
<?php endif; ?>

<script>
	BX.message(<?= \CUtil::PhpToJSObject(Loc::loadLanguageFile(__FILE__)) ?>);
	BX.ready(function()
	{
		let backend = BX.Landing.Backend.getInstance();
		let items = <?= \CUtil::PhpToJSObject(array_values($arParams['ITEMS']))?>;
		let switchDomainPage = '<?= \CUtil::jsEscape($arParams['PAGE_URL_SITE_DOMAIN_SWITCH'])?>';
		const isNeedCopilotPopup = <?= ($isAiSiteChatAvailable && $request->get('preset') === 'sites_ai' && !$arParams['ITEMS']) ? 'true' : 'false' ?>;
		const createByCopilotText = '<?= CUtil::JSEscape(NameService::replaceCopilotName(Loc::getMessage('LANDING_SITE_TILE_COPILOT_LABEL_MSGVER_1')))?>';
		const copilotGeneratedText = '<?= CUtil::JSEscape(NameService::replaceCopilotName(Loc::getMessage('LANDING_SITE_TILE_COPILOT_GENERATED_TEXT_MSGVER_1')))?>';
		const lang = '<?= LANGUAGE_ID ?>';

		<?if ($arParams['FEEDBACK_CODE']):?>
		<?php
		if ($arParams['TYPE'] === 'PAGE')
		{
			$title = Loc::getMessage('LANDING_SITE_TILE_DEV_HELP');
			$text = Loc::getMessage('LANDING_SITE_TILE_DEV_ORDER_MSGVER_1');
			$buttonText = Loc::getMessage('LANDING_SITE_TILE_DEV_BTN');
		}
		else
		{
			$title = Loc::getMessage('LANDING_SITE_TILE_DEV_STORE_HELP');
			$text = Loc::getMessage('LANDING_SITE_TILE_DEV_STORE_ORDER');
			$buttonText = Loc::getMessage('LANDING_SITE_TILE_DEV_STORE_BTN');
		}
		?>
		items.push({
			id: '<?= $arParams['FEEDBACK_CODE']?>',
			type: 'itemMarketing',
			title: '<?= \CUtil::jsEscape($title)?>',
			text: '<?= \CUtil::jsEscape($text)?>',
			buttonText: '<?= \CUtil::jsEscape($buttonText)?>',
			onClick: function()
			{
				BX.fireEvent(BX('landing-feedback-<?= $arParams['FEEDBACK_CODE']?>-button'), 'click');
			}
		});
		<?endif;?>

		const SiteTile = new BX.Landing.Component.SiteTile({
			renderTo: BX('landing-sites'),
			items: items,
			scrollerText: '<?= CUtil::JSEscape($component->getMessageType('LANDING_SITE_TILE_SCROLLER'))?>',
			notPublishedText: {
				title: '<?= CUtil::JSEscape($component->getMessageType('LANDING_SITE_TILE_NOT_PUBLISHED_TITLE')) ?>',
				message: '<?= CUtil::JSEscape($component->getMessageType('LANDING_SITE_TILE_NOT_PUBLISHED_MSG')) ?>',
			},
			isNeedCreateCopilotPopup: isNeedCopilotPopup,
			copilotPopupAiUrl: '<?= CUtil::JSEscape($aiGenerationUrl)?>',
			lang: lang,
			zone: '<?= CUtil::JSEscape($zone)?>',
			createByCopilotText: createByCopilotText,
			copilotGeneratedText: copilotGeneratedText,
		});

		if (isNeedCopilotPopup && SiteTile.popupCopilot)
		{
			const currentUrlString = window.parent.location.href;
			const currentUrl = new URL(currentUrlString);
			currentUrl.search = '';
			window.parent.history.replaceState({}, '', currentUrl.toString());
		}

		BX.addCustomEvent('BX.Landing.SiteTile:unPublish', function(param) {
			var item = param.data;
			item.lock();
			backend.action('Site::unPublic', {
				id: item.id
			}).then(function()
			{
				if (item.domainStatus === 'success')
				{
					item.updateDomainStatus('unknown', '', { announce: false });
				}
				item.unLock();
				item.updatePublishedStatus(false);
			}).catch(function(data)
			{
				var errorMessage = '';
				if (data && data.errors && data.errors[0])
				{
					errorMessage = data.errors[0].message;
				}
				else if (data && data.message)
				{
					errorMessage = data.message;
				}
				item.unLock();
				item.announcePublicationError(errorMessage);
			});
		});

		var publicationFunc = function(item)
		{
			item.lock();

			backend.action('Site::publication', {
					id: item.id
				})
				.then(function()
				{
					if (item.domainStatus === 'unknown' && !item.domainProvider)
					{
						item.updateDomainStatus('success', '', { announce: true });
					}
					else
					{
						item.updateDomainStatus(item.domainStatus, item.domainStatusMessage, { announce: true });
					}
					item.unLock();
					item.updatePublishedStatus(true);
				})
				.catch(function(data)
				{
					let shouldAnnounceError = true;
					let errorText = null;
					if (data.type === 'error' && typeof data.result[0] !== 'undefined')
					{
						let errorCode = data.result[0].error;
						errorText = data.result[0].error_description;
						if (errorCode === 'PUBLIC_SITE_REACHED')
						{
							<?if ($arParams['TYPE'] === 'STORE'):?>
							BX.UI.InfoHelper.show('limit_shop_number');
							<?else:?>
							BX.UI.InfoHelper.show('limit_sites_number');
							<?endif;?>
						}
						else if (errorCode === 'PUBLIC_SITE_REACHED_FREE')
						{
							BX.UI.InfoHelper.show('limit_sites_free');
						}
						else if (errorCode === 'FREE_DOMAIN_IS_NOT_ALLOWED')
						{
							BX.UI.InfoHelper.show('limit_free_domen');
						}
						else if (errorCode === 'EMAIL_NOT_CONFIRMED')
						{
							BX.UI.InfoHelper.show('limit_sites_confirm_email');
						}
						else if (errorCode === 'PHONE_NOT_CONFIRMED' && top.BX.Bitrix24 && top.BX.Bitrix24.PhoneVerify)
						{
							top.BX.Bitrix24.PhoneVerify
								.getInstance()
								.setEntityType('landing_site')
								.setEntityId(item.id)
								.startVerify({
									mandatory: false,
									callback: function (verified) {
										if (verified)
										{
											item.unLock();
											publicationFunc(item);
										}
									}
								})
							;
							shouldAnnounceError = false;
						}
						else if (typeof BX.Landing.AlertShow !== 'undefined')
						{
							BX.Landing.AlertShow({
								message: errorText
							});
						}
						else
						{
							alert(errorText);
						}
					}
					if (shouldAnnounceError)
					{
						item.announcePublicationError(errorText);
					}
					item.unLock();
				});
		}

		BX.addCustomEvent('BX.Landing.SiteTile:publish', function(param) {
			var item = param.data;

			<?if ($arResult['AGREEMENT']):?>
			if (typeof landingAgreementPopup !== 'undefined')
			{
				landingAgreementPopup({
					success: function()
					{
						publicationFunc(item);
					}
				});
				return;
			}
			<?endif;?>

			publicationFunc(item);
		});

		BX.addCustomEvent('BX.Landing.SiteTile:remove', function(param) {
			var item = param.data[0];
			var messageBox = param.data[1];
			item.lock();
			backend.action('Site::markDelete', {
				id: item.id
			}).then(function()
			{
				item.remove({ announce: true });
				top.BX.onCustomEvent('BX.Landing.Filter:apply');
			}).catch(function(err)
			{
				if (item.domainProvider && item.domainProvider.length > 0)
				{
					top.BX.SidePanel.Instance.open(
						switchDomainPage.replace('#site_edit#', item.id),
						{
							width: 750,
							allowChangeHistory: false,
							events: {
								onClose: function(event)
								{
									top.BX.onCustomEvent('BX.Landing.Filter:apply');
								}
							}
						}
					);
				}
			});
		});

		BX.addCustomEvent('BX.Landing.SiteTile:restore', function(param) {
			var item = param.data;
			item.lock();
			backend.action('Site::markUnDelete', {
				id: item.id
			}).then(function()
			{
				item.remove({ announce: true });
				top.BX.onCustomEvent('BX.Landing.Filter:apply');
			});
		});
		<?if ($arParams['TYPE'] === 'STORE'):?>
		BX.addCustomEvent('BX.Landing.SiteTile:onBottomMenuClick', function(param) {
			var type = param.data[0];
			var event = param.data[1];
			var item = param.data[2];
			if (type === 'orders')
			{
				if (item.ordersCount <= 0)
				{
					item.getPopupHelper().show();
					event.preventDefault();
				}
			}
		});
		<?endif;?>

		BX.UI.Hint.init(BX('landing-sites'));
	});
</script>
