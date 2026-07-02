<?php

use Bitrix\Mail\MailboxTable;
use Bitrix\Main\Localization\Loc;

$extensions = [
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.info-helper',
	'ui.mail.provider-showcase',
	'ui.system.highlighter',
	'mail.notification.mail-guide',
	'mail.client.dialog.passwordless-connect',
];

if ($arParams['IS_CONNECTION_REQUEST_BUTTON'] ?? false)
{
	$extensions[] = 'mail.client.dialog.mailbox-connection-request';
}

\Bitrix\Main\UI\Extension::load($extensions);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

$newPath = \CComponentEngine::makePathFromTemplate(
	$arParams['PATH_TO_MAIL_CONFIG'],
	array('act' => 'new')
);

if (!$arResult['CAN_CONNECT_NEW_MAILBOX'])
{
	if (\CModule::includeModule('bitrix24'))
	{
		\CJsCore::init('popup');
		\CBitrix24::initLicenseInfoPopupJS();
	}
}

$bodyClass = $APPLICATION->GetPageProperty("BodyClass");
$APPLICATION->SetPageProperty("BodyClass", ($bodyClass ? $bodyClass." " : "")."no-background");

$isMainPage = $arParams['VARIABLES']['IS_MAIN_MAIL_PAGE'] ?? false;

global $USER;

$hasUserMailbox = empty(MailboxTable::getUserMailboxes($USER->getId(), onlyIds: true));
?>

<div class="mail-provider-showcase-container <?= $isMainPage === true ? 'mail-provider-showcase-container-wide' : '' ?>"></div>

<script>
	const slider = BX.SidePanel.Instance.getTopSlider();
	const providerContainer = document.querySelector('.mail-provider-showcase-container');
	let titleNode = null;
	<?php if ($isMainPage === true): ?>
		titleNode = BX.Tag.render`
			<h2 class="mail-provider-showcase-title"><?= Loc::getMessage('MAIL_CLIENT_CONFIG_PROMPT') ?></h2>
		`;
	<?php endif; ?>

	const connectionRequest = slider ? (slider.getRequestParams() || {}).connectionRequest || null : null;

	if (slider)
	{
		const loader = new BX.Loader({
			size: 120,
			color: getComputedStyle(document.body).getPropertyValue('--ui-color-palette-gray-15') || '#e6e7e9',
			target: providerContainer,
		});

		loader.show();

		const showcaseOptions = {};
		if (connectionRequest)
		{
			showcaseOptions.sliderOptions = {
				requestParams: {
					connectionRequest: connectionRequest,
				},
			};
		}

		BX.UI.Mail.ProviderShowcase.renderTo(providerContainer, showcaseOptions)
			.then(() => {
				if (!BX.Type.isNull(titleNode))
				{
					BX.Dom.prepend(titleNode, providerContainer);
				}

				<?php if ($hasUserMailbox): ?>
					BX.UI.Analytics.sendData({
						tool: 'mail',
						event: 'mailbox_connect_start',
						category: 'mail_general_ops',
						c_section: 'mail',
					});
				<?php endif;?>

				loader.destroy();
			})
			.catch(() => {
				slider.close();
			})
		;
	}

	BX.addCustomEvent(
		'SidePanel.Slider:onMessage',
		function (event)
		{
			var urlParams = {};
			if (window !== window.top)
			{
				urlParams.IFRAME = 'Y';
			}

			if (event.getEventId() === 'mail-mailbox-connection-request-completed')
			{
				top.BX.SidePanel.Instance.postMessage(window, event.getEventId(), event.data);

				var currentSlider = top.BX.SidePanel.Instance.getSliderByWindow(window);
				if (currentSlider)
				{
					currentSlider.setCacheable(false);
					currentSlider.close();
				}

				return;
			}

			if (event.getEventId() === 'mail-mailbox-config-success')
			{
				event.data.handled = false;

				top.BX.SidePanel.Instance.postMessage(window, event.getEventId(), event.data);

				if (event.data.handled)
				{
					var slider = top.BX.SidePanel.Instance.getSliderByWindow(window);
					if (slider)
					{
						slider.setCacheable(false);
						slider.close();
					}
				}
				else
				{
					window.location.href = BX.util.add_url_param(
						'<?=\CUtil::jsEscape($arParams['PATH_TO_MAIL_MSG_LIST']) ?>'.replace('#id#', event.data.id).replace('#start_sync_with_showing_stepper#', true),
						urlParams
					);
				}
			}
		}
	);

	BX.addCustomEvent('onPullEvent-mail', function(command, params) {
		if (command !== 'connection_request_count_changed')
		{
			return;
		}

		const count = params?.pendingCount ?? 0;
		const node = document.querySelector('[data-id="mail-provider-showcase-mailbox-grid-button"]');
		if (!node)
		{
			return;
		}

		const button = BX.UI.ButtonManager.createFromNode(node);
		if (count <= 0)
		{
			button.setRightCounter(null);

			return;
		}

		const counter = button.getRightCounter();
		if (counter)
		{
			counter.setValue(count);
		}
	});

	BX.ready(function()
	{
		<?php if ($arParams['NEED_SHOW_TOOLBAR_GUIDE'] ?? false): ?>
		const button = document.querySelector('[data-id="mail-provider-showcase-mailbox-grid-button"]');
		if (button)
		{
			(new BX.Mail.MailGuide({
				id: 'mail-provider-showcase-mailbox-grid-guide',
				title: '<?= \CUtil::jsEscape($arParams['TOOLBAR_GUIDE_TITLE'] ?? '') ?>',
				description: '<?= \CUtil::jsEscape($arParams['TOOLBAR_GUIDE_TEXT'] ?? '') ?>',
				bindElement: button,
				addHighlighter: true,
				userOptionName: '<?= \CUtil::jsEscape($arParams['TOOLBAR_GUIDE_OPTION_NAME'] ?? null) ?>',
				<?php if (!empty($arParams['TOOLBAR_GUIDE_WIDTH'])): ?>
				width: <?= (int)$arParams['TOOLBAR_GUIDE_WIDTH'] ?>,
				<?php endif; ?>
			})).show();
		}
		<?php endif; ?>

		BX.Mail.Client.Dialog.PasswordlessConnect.checkAndShow({
			messageListUrl: '<?= \CUtil::jsEscape($arParams['PATH_TO_MAIL_MSG_LIST']) ?>',
		});
	});
</script>
