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
use Bitrix\UI\Buttons\Tag;
use Bitrix\UI\Counter\CounterStyle;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\Main\UI\Extension;

/** @var array $arParams */
/** @var array $arResult */
/** @var $APPLICATION */
/** @var $USER */

$component = $this->getComponent();

$bodyClass = $APPLICATION->GetPageProperty('BodyClass');
$APPLICATION->SetPageProperty('BodyClass', ($bodyClass ? $bodyClass . ' ' : '') . 'mail-mailbox-list-page --ui-context-content-light');

Extension::load([
	'ui.buttons',
	'ui.forms',
	'ui.cnt',
	'main.grid',
	'main.popup',
	'mail.grid.mailbox-grid',
	'ui.mail.provider-showcase',
	'mail.notification.massconnect-notification',
	'ui.system.highlighter',
]);

$APPLICATION->SetTitle($arResult['TITLE']);

Toolbar::deleteFavoriteStar();

if ($arResult['HAS_ACCESS_TO_MASS_CONNECT'])
{
	$massConnectButton = [
		"color" => Color::SUCCESS,
		"text" => Loc::getMessage('MAIL_MAILBOX_GRID_MASSCONNECT_BUTTON'),
		"dataset" => [
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

		$massConnectButton["onclick"] = new JsCode($onclickCode);
	}
	else
	{
		$massConnectButton['icon'] = Icon::LOCK;
		$massConnectButton['dataset']['toolbar-collapsed-icon'] = Icon::LOCK;
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

$gearMenuItems = [];
$sentTotalCount = (int)($arResult['PASSWORDLESS_SENT_TOTAL_COUNT'] ?? 0);
$isPasswordlessConnectAvailable = (bool)$arResult['IS_PASSWORDLESS_CONNECT_AVAILABLE'];

if (
	$arResult['HAS_ACCESS_TO_MASS_CONNECT']
	&& $isPasswordlessConnectAvailable
)
{
	$sentRequestsLabel = htmlspecialcharsbx(Loc::getMessage('MAIL_MAILBOX_LIST_GEAR_SENT_REQUESTS'));
	$counterHtml = ' <span class="ui-counter --air --style-filled-no-accent ui-counter-md" id="mailbox-gear-menu-sent-counter" style="margin-left: 4px;' . ($sentTotalCount <= 0 ? ' display: none;' : '') . '">'
		. '<span class="ui-counter-inner">' . $sentTotalCount . '</span>'
		. '</span>';

	$sentRequestsUrl = '/mail/sentrequests';
	$sentRequestsSliderData = Json::encode([
		'data' => [
			'source' => 'mailbox_grid',
		],
		'width' => 1100,
	]);

	$gearMenuItems[] = [
		'html' => $sentRequestsLabel . $counterHtml,
		'onclick' => new JsCode(sprintf(
			"this.close(); BX.SidePanel.Instance.open('%s', %s)",
			$sentRequestsUrl,
			$sentRequestsSliderData,
		)),
		'dataset' => [
			'id' => 'mailbox-grid-gear-sent-requests',
		],
	];
}

if ($arResult['HAS_ACCESS_TO_EDIT_PERMISSIONS'] && !$isPasswordlessConnectAvailable)
{
	$accessButton = [
		'color' => Color::LIGHT_BORDER,
		'tag' => Tag::LINK,
		'text' => Loc::getMessage('MAIL_MAILBOX_LIST_CONFIG_PERMISSIONS_BUTTON'),
		'dataset' => [
			'toolbar-collapsed-icon' => Icon::LIST,
			'id' => 'mailboxGridAccessRightsButton',
			'test-id' => 'mailbox-grid-access-rights-button',
		],
	];

	if ($arResult['ACCESS_RIGHTS_ENABLED'])
	{
		$permissionsUrl = '/mail/permissions';
		$permissionsSliderData = Json::encode([
			'data' => [
				'source' => 'mailbox_grid',
			],
		]);

		$accessButton['onclick'] = new JsCode(sprintf(
			"BX.SidePanel.Instance.open('%s', %s)",
			$permissionsUrl,
			$permissionsSliderData,
		));
	}
	else
	{
		$accessButton['icon'] = Icon::LOCK;
		$accessButton['onclick'] = new JsCode(
			"BX.Mail.MailboxList.LimitHelpers.showLimitSlider('limit_v2_mail_access_rights')",
		);
	}

	Toolbar::addButton($accessButton);
}
elseif ($arResult['HAS_ACCESS_TO_EDIT_PERMISSIONS'])
{
	$permissionsItem = [
		'text' => Loc::getMessage('MAIL_MAILBOX_LIST_CONFIG_PERMISSIONS_BUTTON'),
		'dataset' => [
			'id' => 'mailbox-grid-gear-permissions',
		],
	];

	if ($arResult['ACCESS_RIGHTS_ENABLED'])
	{
		$permissionsUrl = '/mail/permissions';
		$permissionsSliderData = Json::encode([
			'data' => [
				'source' => 'mailbox_grid',
			],
		]);

		$permissionsItem['onclick'] = new JsCode(sprintf(
			"this.close(); BX.SidePanel.Instance.open('%s', %s)",
			$permissionsUrl,
			$permissionsSliderData,
		));
	}
	else
	{
		$permissionsItem['onclick'] = new JsCode(
			"this.close(); BX.Mail.MailboxList.LimitHelpers.showLimitSlider('limit_v2_mail_access_rights')",
		);
	}

	$gearMenuItems[] = $permissionsItem;
}

if (!empty($gearMenuItems))
{
	$gearButton = [
		'color' => Color::LIGHT_BORDER,
		'icon' => Icon::SETTING,
		'dataset' => [
			'toolbar-collapsed-icon' => Icon::SETTING,
			'id' => 'mailboxGridGearButton',
			'test-id' => 'mailbox-grid-gear-button',
		],
	];

	if ($sentTotalCount > 0)
	{
		$gearButton['counter'] = $sentTotalCount;
		$gearButton['counterStyle'] = CounterStyle::FILLED_NO_ACCENT;
	}

	$gearButton['menu'] = [
		'items' => $gearMenuItems,
		'closeByEsc' => true,
	];

	Toolbar::addButton($gearButton);
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

		const resetFilterOnClose = slider ? Boolean(slider.getData().get('resetFilterOnClose')) : false;

		new BX.Mail.MailboxList.Manager({
			gridId,
			needHighlightGearButton: <?= $arResult['NEED_HIGHLIGHT_GEAR_BUTTON'] ? 'true' : 'false' ?>,
			highlightGearButtonOptionName: '<?= CUtil::JSEscape($arResult['HIGHLIGHT_GEAR_BUTTON_OPTION_NAME']) ?>',
			resetFilterOnClose,
		});
	});
</script>

<?php // Popup for MassConnectNotification (mail/install/js/mail/notification/massconnect-notification/src/massconnect-notification.js) ?>
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
