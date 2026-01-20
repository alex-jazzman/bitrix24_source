<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\Icon;
use Bitrix\UI\Buttons\JsCode;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Buttons\Tag;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\Main\UI\Extension;

/** @var array $arParams */
/** @var array $arResult */
/** @var $APPLICATION */
/** @var $USER */

$component = $this->getComponent();

Extension::load([
	'ui.buttons',
	'ui.forms',
	'main.grid',
	'main.popup',
	'mail.grid.mailbox-grid',
	'ui.mail.provider-showcase',
	'mail.notification.massconnect-notification',
]);

$APPLICATION->SetTitle($arResult['TITLE']);

Toolbar::deleteFavoriteStar();

if ($arResult['HAS_ACCESS_TO_MASS_CONNECT'])
{
	$massConnectButton = [
		"color" => Color::SUCCESS,
		"text" => Loc::getMessage('MAIL_MAILBOX_GRID_MASSCONNECT_BUTTON'),
		"dataset" => [
			'toolbar-collapsed-icon' => Icon::ADD,
			'id' => 'massconnectButton',
			'test-id' => 'massconnect-button',
		],
	];

	if ($arResult['MAILBOX_MASS_CONNECT_ENABLED'])
	{
		$massconnectUrl = '/mail/massconnect';
		$sliderData = Json::encode([
			'data' => [
				'source' => 'mailbox_grid',
			],
			'width' => 950,
		]);

		$onclickCode = sprintf("BX.SidePanel.Instance.open('%s', %s)",
			$massconnectUrl,
			$sliderData,
		);

		$massConnectButton['icon'] = Icon::ADD;
		$massConnectButton["onclick"] = new JsCode($onclickCode);
	}
	else
	{
		$massConnectButton['icon'] = Icon::LOCK;
		$massConnectButton["onclick"] = new JsCode(
			"BX.Mail.MailboxList.LimitHelpers.showLimitSlider('limit_v2_mail_mailbox_massconnect')",
		);
	}

	Toolbar::addButton($massConnectButton, ButtonLocation::AFTER_TITLE);
}

Toolbar::addFilter(\Bitrix\Main\Filter\Component\ComponentParams::get($arResult['GRID_FILTER'],
	[
		'GRID_ID' => $arResult['GRID_ID'],
		'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
		'ENABLE_LIVE_SEARCH' => true,
		'ENABLE_LABEL' => true,
		'CONFIG' => [
			'AUTOFOCUS' => false,
		],
	],
));

if ($arResult['HAS_ACCESS_TO_EDIT_PERMISSIONS'])
{
	$accessButton = [
		"color" => Color::LIGHT_BORDER,
		"tag" => Tag::LINK,
		"text" => Loc::getMessage('MAIL_MAILBOX_LIST_CONFIG_PERMISSIONS_BUTTON'),
		"dataset" => [
			'toolbar-collapsed-icon' => Icon::LIST,
			'id' => 'mailboxGridAccessRightsButton',
			'test-id' => 'mailbox-grid-access-rights-button',
		],
	];

	if ($arResult['ACCESS_RIGHTS_ENABLED'])
	{
		$permissionsUrl = '/mail/permissions';
		$sliderData = Json::encode([
			'data' => [
				'source' => 'mailbox_grid',
			],
		]);

		$onclickCode = sprintf("BX.SidePanel.Instance.open('%s', %s)",
			$permissionsUrl,
			$sliderData,
		);

		$accessButton['onclick'] = new JsCode($onclickCode);
	}
	else
	{
		$accessButton['icon'] = Icon::LOCK;
		$accessButton["onclick"] = new JsCode("BX.Mail.MailboxList.LimitHelpers.showLimitSlider('limit_v2_mail_access_rights')");
	}

	Toolbar::addButton($accessButton);
}

$gridContainerId = 'bx-mml-' . $arResult['GRID_ID'] . '-container';

?><span class="mail-mailbox-list-grid-container --ui-context-content-light" id="<?= htmlspecialcharsbx($gridContainerId)?>"><?php
	$APPLICATION->IncludeComponent(
		'bitrix:main.ui.grid',
		'',
		$arResult['GRID_PARAMS'],
		$component,
	);
?></span>
<script>
	BX.ready(function()
	{
		const slider = BX.SidePanel.Instance.getTopSlider();
		let source = null;
		if (slider)
		{
			source = slider.getData().get('source') || null;
		}

		if (source)
		{
			BX.UI.Analytics.sendData({
				tool: 'mail',
				event: 'mailbox_grid_open',
				category: 'mail_mass_ops',
				c_section: source,
			});
		}

		const gridId = '<?= CUtil::JSEscape($arResult['GRID_ID']) ?>'

		new BX.Mail.MailboxList.Manager({
			gridId,
		});

		<?php if (
			$arResult['MAILBOX_MASS_CONNECT_ENABLED']
			&& $arResult['HAS_ACCESS_TO_MASS_CONNECT']
			&& $arResult['NEED_SHOW_MAILBOX_LIST_HINT']
		): ?>
		(new BX.Mail.MassConnectNotification({
			contentContainerId: 'mass-connection-popup-content',
			okButtonText: '<?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_OK_BUTTON") ?>',
			skipButtonText: '<?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_SKIP_BUTTON") ?>',
			userOptionName: '<?= $arResult['MAILBOX_LIST_HINT_NAME'] ?>',
		})).show();
		<?php endif ?>
	});
</script>

<div hidden>
	<div id="mass-connection-popup-content">
		<div class="popup">
			<h1 class="mass-connection-popup-title"><?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_TITLE") ?></h1>

			<div class="mass-connection-popup-content">
				<div class="mass-connection-popup-left-section">
					<div class="mass-connection-popup-feature">

						<div class="mass-connection-popup-feature-title">
							<div class="mass-connection-popup-feature-icon">
								<div class="ui-icon-set --o-three-persons"></div>
							</div>
							<h2><?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_FEATURE_1_TITLE") ?></h2>
						</div>
						<p class="mass-connection-popup-feature-description">
							<?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_FEATURE_1_DESCRIPTION") ?>
						</p>
					</div>

					<div class="mass-connection-popup-feature">
						<div class="mass-connection-popup-feature-title">
							<div class="mass-connection-popup-feature-icon">
								<div class="ui-icon-set --mail-2"></div>
							</div>
							<h2><?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_FEATURE_2_TITLE") ?></h2>
						</div>
						<p class="mass-connection-popup-feature-description">
							<?= Loc::getMessage("MAIL_MESSAGE_MAILBOX_GRID_POPUP_FEATURE_2_DESCRIPTION") ?>
						</p>
					</div>
				</div>

				<div class="mass-connection-popup-right-section">
					<div class="mass-connection-popup-illustration">
						<div class="mass-connection-popup-email-card">
							<video src="/bitrix/js/mail/notification/massconnect-notification/dist/video/popup-animation.webm"
								autoplay
								preload
								loop
								muted
								playsinline
								width="307"
								height="186"
							>
							</video>
						</div>
						<div class="mass-connection-popup-character"></div>
					</div>
				</div>
			</div>

		</div>
	</div>
</div>