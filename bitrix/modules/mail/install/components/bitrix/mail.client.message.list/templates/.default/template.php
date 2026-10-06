<?php

use Bitrix\Mail\Helper\MailboxAccess;
use Bitrix\Mail\Helper\AnalyticsHelper;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UI\Filter\Theme;
use Bitrix\Mail\Helper\LicenseManager;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\Icon;
use Bitrix\UI\Buttons\JsCode;
use Bitrix\UI\Buttons\Tag;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

/** @var \CMain $APPLICATION */
/** @var array $arResult */
/** @var array $arParams */

\Bitrix\Main\Loader::includeModule('ui');
\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	"mail.client",
	"mail.messagegrid",
	"mail.favorites-filter-state",
	"mail.avatar",
	"mail.directorymenu",
	"ui.progressbar",
	'ui.info-helper',
	'mail.secretary',
	'ui.buttons',
	'ui.buttons.icons',
	'ui.notification',
	'ui.alerts',
	'ui.dialogs.messagebox',
	'ui.hint',
	'ui.icons.service',
	'pull.client',
	'mail.notification.mail-guide',
	'mail.client.action.discuss-in-chat',
	'ui.icon-set.outline',
	'ui.system.highlighter',
	'mail.client.dialog.passwordless-connect',
	'mail.migration-state',
]);

if (!empty($arResult['LABELS_ENABLED']))
{
	\Bitrix\Main\UI\Extension::load([
		'mail.label.core',
		'mail.label.menu',
	]);
}

if (!empty($arResult['NEED_SHOW_LABELS_ONBOARDING']))
{
	\Bitrix\Main\UI\Extension::load(['mail.notification.labels-guide']);
}

$APPLICATION->SetAdditionalCSS("/bitrix/css/main/font-awesome.css");

Main\Page\Asset::getInstance()->addJS('/bitrix/components/bitrix/mail.client.message.list/templates/.default/user-interface-manager.js');

Toolbar::deleteFavoriteStar();

$bodyClass = $APPLICATION->getPageProperty('BodyClass', false);
$listBodyClass = 'pagetitle-toolbar-field-view pagetitle-mail-view no-background';
if (!empty($arResult['IS_DRAFT_MODE']))
{
	$listBodyClass .= ' mail-draft-list-view';
}
$APPLICATION->setPageProperty('BodyClass', trim(sprintf('%s %s', $bodyClass, $listBodyClass)));
Toolbar::addFilter([
	'FILTER_ID' => $arResult['FILTER_ID'],
	'GRID_ID' => $arResult['GRID_ID'],
	'ENABLE_LABEL' => true,
	'FILTER' => $arResult['FILTER'],
	'FILTER_PRESETS' => $arResult['FILTER_PRESETS'],
	'RESET_TO_DEFAULT_MODE' => true,
	'VALUE_REQUIRED' => true,
	'THEME' => Theme::MUTED,
	'CONFIG' => [
		'AUTOFOCUS' => false,
	],
]);

if (empty($arResult['IS_DRAFT_MODE']) && !empty($arResult['EMBEDDED_DRAFT_LIST']))
{
	$embeddedDraftList = $arResult['EMBEDDED_DRAFT_LIST'];
	$messageFilter = Toolbar::getFilter();

	Toolbar::addFilter([
		'FILTER_ID' => $embeddedDraftList['FILTER_ID'],
		'GRID_ID' => $embeddedDraftList['GRID_ID'],
		'ENABLE_LABEL' => true,
		'FILTER' => $embeddedDraftList['FILTER'],
		'FILTER_PRESETS' => $embeddedDraftList['FILTER_PRESETS'],
		'RESET_TO_DEFAULT_MODE' => true,
		'VALUE_REQUIRED' => true,
		'THEME' => Theme::MUTED,
		'CONFIG' => [
			'AUTOFOCUS' => false,
		],
	]);
	$draftFilter = Toolbar::getFilter();

	Toolbar::setFilter(sprintf(
		'<div class="mail-client-list-filter" data-role="mail-message-list-filter">%s</div>'
		. '<div class="mail-client-list-filter" data-testid="mail-draft-list-filter" hidden>%s</div>',
		$messageFilter,
		$draftFilter,
	));
}

if ($arResult['HAS_ACCESS_TO_MAILBOX_GRID'])
{
	$mailboxGridUrl = '/mail/mailbox-list';
	$sliderData = Json::encode([
		'source' => 'mail_inbox',
	]);

	$onclickCode = sprintf("BX.SidePanel.Instance.open('%s', { data: %s })",
		$mailboxGridUrl,
		$sliderData,
	);

	$gridButtonParams = [
		'color' => Color::LIGHT_BORDER,
		'tag' => Tag::LINK,
		'text' => Loc::getMessage('MAIL_MESSAGE_MAILBOX_GRID_BTN'),
		'counter' => $arResult['MAILBOX_GRID_BUTTON_COUNTER'] > 0
			? $arResult['MAILBOX_GRID_BUTTON_COUNTER']
			: null,
		'dataset' => [
			'toolbar-collapsed-icon' => Icon::LIST,
			'id' => 'mail-mailbox-grid-button',
			'test-id' => 'mailbox-grid-button',
		],
	];

	if (!$arResult['MAILBOX_GRID_TARIFF_RESTRICTED'])
	{
		$gridButtonParams['onclick'] = new JsCode($onclickCode);
	}
	else
	{
		$gridButtonParams['icon'] = Icon::LOCK;
		$gridButtonParams['onclick'] =  new JsCode("BX.Mail.Client.Message.LimitHelpers.showLimitSlider('limit_v2_mail_mailboxes_management_grid')");
	}

	Toolbar::addButton($gridButtonParams);
}

Toolbar::addButton(
	new Bitrix\UI\Buttons\Button([
		'color' => Color::LIGHT_BORDER,
		'icon' => Icon::SETTINGS,
		'classList' => ['mail-list-settings-menu-popup-toggle'],
	]),
);

$createPath = new Uri($arParams['PATH_TO_MAIL_MSG_NEW']);
$createPath->addParams(['id' => $arResult['MAILBOX']['ID']]);
$composeSliderOptions = [
	'width' => \Bitrix\Mail\Helper\Config\Feature::isComposeRedesignAvailable() ? 820 : 960,
	'cacheable' => false,
];

$createButtonParams = [
	'color' => Color::SUCCESS,
	'link' => htmlspecialcharsbx($createPath),
	'text' => Loc::getMessage('MAIL_MESSAGE_NEW_BTN'),
	'classList' => ['mail-message-new-button'],
	'dataset' => ['testid' => 'mail-message-new-button'],
];
if (\Bitrix\Mail\Helper\Config\Feature::isComposeRedesignAvailable())
{
	$createButtonParams['dataset']['slider-ignore-autobinding'] = true;
	$createButtonParams['onclick'] = new JsCode(sprintf(
		"event.preventDefault(); top.BX.SidePanel.Instance.open('%s', %s);",
		\CUtil::jsEscape($createPath),
		Json::encode($composeSliderOptions),
	));
}

Toolbar::addButton(
	new Bitrix\UI\Buttons\Button($createButtonParams),
	ButtonLocation::AFTER_TITLE,
);

Toolbar::hideTitle();

$unseenCountInCurrentMailbox = 0;
$unseenCountInOtherMailboxes = 0;

$isAllMailMode = !empty($arResult['IS_ALL_MAIL_MODE']);
$isDraftMode = !empty($arResult['IS_DRAFT_MODE']);
$internalDraftsAvailable = \Bitrix\Mail\Helper\Config\Feature::isInternalDraftsAvailable();
$globalUnseenCounter = (int)($arResult['MESSAGE_COUNTER_IN_ALL_MAILBOXES'] ?? 0);

$currentMailboxId = (int)$arResult['MAILBOX']['ID'];
$currentMessageListHref = \CComponentEngine::makePathFromTemplate(
	$arParams['PATH_TO_MAIL_MSG_LIST'],
	['id' => $currentMailboxId, 'start_sync_with_showing_stepper' => false],
);
$frameParams = array_filter([
	'IFRAME' => $_REQUEST['IFRAME'] ?? null,
	'IFRAME_TYPE' => $_REQUEST['IFRAME_TYPE'] ?? null,
]);
$currentMessageListHref = \CHTTP::urlAddParams($currentMessageListHref, $frameParams);
$allMailHref = (string)(new Uri(\CComponentEngine::makePathFromTemplate(
		$arParams['PATH_TO_MAIL_MSG_LIST'],
		['id' => $currentMailboxId, 'start_sync_with_showing_stepper' => false],
	)))->addParams(array_filter([
		'virtual' => $arResult['VIRTUAL_FOLDER_KEY'],
		'IFRAME' => $_REQUEST['IFRAME'] ?? null,
		'IFRAME_TYPE' => $_REQUEST['IFRAME_TYPE'] ?? null,
	]))
;

$mailboxesData = [];
foreach ($arResult['MAILBOXES'] as $mailboxId => $item)
{
	$mailboxId = (int)$mailboxId;
	$itemMailboxId = (int)$item['ID'];
	$isCurrent = $itemMailboxId === $currentMailboxId;

	if ($isCurrent)
	{
		$unseenCountInCurrentMailbox += $item['__unseen'];
	}
	else
	{
		$unseenCountInOtherMailboxes += $item['__unseen'];
	}

	$mailboxesData[] = [
		'id' => $mailboxId,
		'name' => $item['NAME'],
		'unseen' => (int)$item['__unseen'],
		'isLocked' => !LicenseManager::checkTheMailboxForSyncAvailability($mailboxId, (int)$item['USER_ID']),
		'isCurrent' => $isCurrent,
		'href' => (string)(new Uri(\CComponentEngine::makePathFromTemplate(
				$arParams['PATH_TO_MAIL_MSG_LIST'],
				['id' => $itemMailboxId, 'start_sync_with_showing_stepper' => false],
			)))->addParams(array_filter([
				'IFRAME' => $_REQUEST['IFRAME'] ?? null,
				'IFRAME_TYPE' => $_REQUEST['IFRAME_TYPE'] ?? null,
			])),
	];
}

$userMailboxesLimit = $arResult['MAX_ALLOWED_CONNECTED_MAILBOXES'];
$addMailboxData = [
	'href' => \CComponentEngine::makePathFromTemplate(
		$arParams['PATH_TO_MAIL_CONFIG'],
		['act' => ''],
	),
	'isLocked' => $userMailboxesLimit >= 0 && $arResult['USER_OWNED_MAILBOXES_COUNT'] >= $userMailboxesLimit,
];

$mailboxSelectorConfig = [
	'isAllMailMode' => $isAllMailMode,
	'virtualFolderKey' => $arResult['VIRTUAL_FOLDER_KEY'],
	'globalUnseenCounter' => $globalUnseenCounter,
	'allMailHref' => $allMailHref,
	'mailboxes' => $mailboxesData,
	'addMailbox' => $addMailboxData,
	'currentMailboxId' => intval($arResult['MAILBOX']['ID']),
	'titleText' => htmlspecialcharsbx($arResult['MAILBOX_NAME'] . $arResult['MAILBOX_DOMAIN']),
	'titleHoverText' => htmlspecialcharsbx($arResult['MAILBOX']['NAME']),
	'unseenCountInOtherMailboxes' => $unseenCountInOtherMailboxes,
];
$migrationMailboxIds = $isAllMailMode
	? array_values(array_map(static fn (array $mailbox): int => (int)$mailbox['ID'], $arResult['MAILBOXES']))
	: [$currentMailboxId]
;

$listImprovementsEnabled = !empty($arResult['IS_MAIL_LIST_IMPROVEMENTS_AVAILABLE']);
$favoritesSectionActive = !empty($arResult['IS_FAVORITES_SECTION_ACTIVE']);

// only the improved row carries attachment chips, and only they show the file icons of the pack
if ($listImprovementsEnabled)
{
	\Bitrix\Main\UI\Extension::load(['ui.icons.disk']);
}
$archiveDownloadAvailable = $listImprovementsEnabled
	&& (new \Bitrix\Mail\Internal\Service\Attachment\ArchiveService())->isDownloadAvailable();

$configPath = (string)(new Uri(\CComponentEngine::makePathFromTemplate(
		$arParams['PATH_TO_MAIL_CONFIG'],
		['act' => 'edit'],
	)))->addParams(['id' => $arResult['MAILBOX']['ID']])
;

$disabledMailSettings = !MailboxAccess::hasCurrentUserAccessToEditMailbox($arResult['MAILBOX']['ID']);

$settingsMenu = [
	[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_BLACKLIST_LINK'),
		'className' => '',
		'href' => htmlspecialcharsbx($arParams['PATH_TO_MAIL_BLACKLIST']),
	],
	[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_ADDRESSBOOK_LINK_MSGVER_1'),
		'href' => htmlspecialcharsbx($arParams['PATH_TO_MAIL_ADDRESSBOOK']),
	],
	[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_SIGNATURE_LINK'),
		'href' => htmlspecialcharsbx($arParams['PATH_TO_MAIL_SIGNATURES']),
	],
	[
		'delimiter' => true,
	],
	[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_INTEGRATION_WITH_CRM'),
		'className' => '',
		'href' => htmlspecialcharsbx($configPath) . '#configcrm',
		'disabled' => ($disabledMailSettings || !$arResult['userHasCrmActivityPermission']),
	],
	[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_SETTINGS_LINK'),
		'className' => '',
		'href' => htmlspecialcharsbx($configPath),
		'disabled' => $disabledMailSettings,
	],
	[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_LINK'),
		'className' => '',
		'href' => htmlspecialcharsbx($arResult['MAILBOX']['LINK']),
		'target' => "_blank",
		'disabled' => empty($arResult['MAILBOX']['LINK']),
	],
	/*[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_MANAGEMENT'),
		'className' => '',
		'onclick' => 'BX.Mail.Home.Grid.openGridSettingsWindow()',
	],*/
];

if (!empty($arResult['LABELS_ENABLED']))
{
	array_splice($settingsMenu, 3, 0, [[
		'text' => Loc::getMessage('MAIL_MESSAGE_LIST_LABELS_SETTINGS'),
		'onclick' => "BX.SidePanel.Instance.open('/mail/labels', { width: 900 })",
		'dataset' => ['testid' => 'mail-settings-menu-labels'],
	]]);
}

if ($arResult['HAS_ACCESS_TO_ACCESS_RIGHTS'])
{
	array_unshift($settingsMenu, [
		'delimiter' => true,
	]);

	if (!$arResult['ACCESS_RIGHTS_TARIFF_RESTRICTED'])
	{
		$permissionsUrl = '/mail/permissions';
		$sliderData = Json::encode([
			'source' => 'mail_inbox',
		]);

		$onclickCode = sprintf("BX.SidePanel.Instance.open('%s', { data: %s })",
			$permissionsUrl,
			$sliderData,
		);

		$accessButton = [
			'text' => Loc::getMessage('MAIL_MESSAGE_LIST_CONFIG_PERMISSIONS_LINK'),
			'onclick' => $onclickCode,
		];
	}
	else
	{
		$accessButton = [
			'onclick' => "BX.Mail.Client.Message.LimitHelpers.showLimitSlider('limit_v2_mail_access_rights')",
			'html' => '<div class="mail-connect-lock-item-container">'
				. '<div class="mail-connect-lock-item-icon ui-icon-set --lock-m"></div>'
				. '<span class="mail-connect-lock-text">' . htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIG_PERMISSIONS_LINK')) . '</span>'
				. '</div>'
			,
		];
	}

	array_unshift($settingsMenu, $accessButton);
}

$mailAlertBlocks = '';

if (!$isDraftMode && empty($arResult['CONFIG_SYNC_DIRS']))
{
	$mailAlertBlocks .= sprintf('
		<div class="ui-alert ui-alert-warning ui-alert-icon-warning">
			<span class="ui-alert-message">%s</span>
		</div>',
		htmlspecialcharsbx(Loc::getMessage('MAIL_CLIENT_CONFIG_DIRS_SYNC_EMPTY_WARNING')),
	);
}

$APPLICATION->AddViewContent('mail-msg-counter-panel', sprintf('
	<div class="mail-error-box-wrapper" data-role="mail-error-box-wrapper">
		%s
		<!-- The old error output block, which is controlled from the synchronization progress bar. -->
		<div data-role="error-box" class="mail-home-error-box mail-hidden-element">
			<div data-role="error-box-title" class="error-box-title"></div>
			<div data-role="error-box-text" class="error-box-text"></div>
			<div data-role="error-box-hint" class="error-box-hint"></div>
		</div>
	</div>
	<div class="mail-msg-counter-wrapper">
		<div class="mail-counter-toolbar" data-role="mail-counter-toolbar"></div>
	</div>',
	$mailAlertBlocks,
));

$APPLICATION->AddViewContent('progress', '
	<div data-role="mail-progress-bar" class="mail-progress">
		<div class="mail-progress-bar"></div>
	</div>',
);

$draftButtonHtml = '';
if ($internalDraftsAvailable)
{
	$draftsHref = \CHTTP::urlAddParams($arParams['PATH_TO_MAIL_DRAFTS'], $frameParams);
	$draftsLabel = htmlspecialcharsbx(Loc::getMessage('MAIL_MESSAGE_LIST_INTERNAL_DRAFTS'));
	// the item repeats the markup of the favorites one: they share the block and the left menu styles
	$draftButtonHtml = '<div class="mail-draft-navigation mail-menu-directory-item-container">'
		. '<button type="button" class="ui-sidepanel-menu-item mail-menu-directory-item mail-menu-directory-item-drafts'
		. ($isDraftMode ? ' mail-menu-directory-item--active' : '') . '"'
		. ' data-id="mail-internal-drafts-button"'
		. ' data-testid="mail-drafts-button"'
		. ($isDraftMode ? ' aria-current="page"' : '') . '>'
		. '<span class="ui-sidepanel-menu-link mail-menu-directory-link">'
		. '<span class="ui-sidepanel-menu-link-text">'
		. '<span class="ui-icon-set --o-document-sign mail-menu-directory-item-icon"></span>'
		. '<span class="ui-sidepanel-menu-link-text-item">' . $draftsLabel . '</span>'
		. '</span>'
		. '</span>'
		. '</button>'
		. '</div>'
	;
}

$APPLICATION->AddViewContent('left-panel', sprintf('
	<div class="mail-left-menu-wrapper">
		<div class="mail-left-menu-head">
			<h2 class="mail-left-menu-title">
				<span class="logo-mail">%s</span>
			</h2>
		</div>
		<nav class="mailbox-sync-panel" role="toolbar" aria-label="%s">
			<div data-role="mailbox-selector-root"></div>
			<div class="mailbox-sync-btn" data-role="mail-msg-sync-button-wrapper" data-test-id="mail_sync-panel__sync-button"></div>
			<div class="mailbox-sort-btn" data-role="mail-folder-sort-button-wrapper" data-test-id="mail_sync-panel__sort-button"></div>
		</nav>
		%s
	</div>',
	Loc::getMessage('MAIL_CLIENT_HOME_TITLE_MSGVER_1'),
	Loc::getMessage('MAIL_CLIENT_HOME_TITLE_MSGVER_1'),
	$draftButtonHtml,
));

$APPLICATION->AddViewContent('below_pagetitle', sprintf(
	'%s%s%s',
	$APPLICATION->getViewContent('progress'),
	$APPLICATION->getViewContent('mail-msg-counter-panel'),
	$APPLICATION->getViewContent('mail-msg-temp-alert'),
));

if (!$isDraftMode)
{
	$APPLICATION->AddViewContent('mail-msg-counter-script', sprintf('
	<script>
		(function () {
			var uiManager = BX.Mail.Client.Message.List["%s"].userInterfaceManager;
			BX.onCustomEvent("Grid::updated", [uiManager.getGridInstance()]);
			if (BX.Mail.Home && BX.Mail.Home.MailboxSelector) {
				BX.Mail.Home.MailboxSelector.initMailboxes(%s);
				BX.Mail.Home.MailboxSelector.setInitialState(%d);
			}

			BX.Mail.Home.mailboxCounters.setCounters([
				{ "path": "unseenCountInOtherMailboxes", "count": %d },
				{ "path": "unseenCountInCurrentMailbox", "count": %d }
			]);

			if (uiManager.getLastDir() !== uiManager.getCurrentFolder()) {
				uiManager.setLastDir();
				BXMailMailbox.sync(BX.Mail.Home.ProgressBar, "%s", true, true);
			}

			uiManager.updateMessageMailHrefList(%s, %d, %s);
		})();
	</script>',
	\CUtil::jsEscape($component->getComponentId()),
	Main\Web\Json::encode($mailboxSelectorConfig),
	intval($isAllMailMode ? 0 : $unseenCountInOtherMailboxes),
	intval($unseenCountInOtherMailboxes),
	intval($unseenCountInCurrentMailbox),
	\CUtil::jsEscape($arResult['FILTER_ID']),
	Main\Web\Json::encode($arResult['MESSAGE_HREF_LIST']),
	(int)$arResult['NAV_OBJECT']->getCurrentPage(),
		!empty($arResult['ENABLE_NEXT_PAGE']) ? 'true' : 'false',
	));

	addEventHandler('main', 'onAfterAjaxResponse', function () {
		global $APPLICATION;

		return $APPLICATION->getViewContent('mail-msg-counter-script');
	});
}


if (!$isDraftMode && Main\Loader::includeModule('pull'))
{
	global $USER;
	if ($isAllMailMode)
	{
		foreach ($arResult['MAILBOXES'] as $mailboxItem)
		{
			\CPullWatch::add($USER->getId(), 'mail_mailbox_' . (int)$mailboxItem['ID']);
		}
	}
	else
	{
		\CPullWatch::add($USER->getId(), 'mail_mailbox_' . $arResult['MAILBOX']['ID']);
	}
}

$snippet = new Main\Grid\Panel\Snippet();

$actionPanelActionButtons = [
	[
		'TYPE' => \Bitrix\Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['read']['id'],
		'ICON' => $arResult['gridActionsData']['read']['icon'],
		'TITLE'=> $arResult['gridActionsData']['read']['title'],
		'TEXT'=> $arResult['gridActionsData']['read']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onReadClick()",
					],
				],
			],
		],
	],
	[
		'TYPE' => \Bitrix\Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['notRead']['id'],
		'ICON' => $arResult['gridActionsData']['notRead']['icon'],
		'TITLE'=> $arResult['gridActionsData']['notRead']['title'],
		'TEXT'=> $arResult['gridActionsData']['notRead']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onReadClick()",
					],
				],
			],
		],
	],
];

if (!$isAllMailMode)
{
	$actionPanelActionButtons[] = [
		'TYPE' => Main\Grid\Panel\Types::DROPDOWN,
		'ID' => $arResult['gridActionsData']['move']['id'],
		'ICON' => $arResult['gridActionsData']['move']['icon'],
		'TITLE' => $arResult['gridActionsData']['move']['title'],
		'TEXT' => $arResult['gridActionsData']['move']['text'],
		'ITEMS' => $arResult['foldersItems'],
	];
}

if (!empty($arResult['LABELS_ENABLED']))
{
	$actionPanelActionButtons[] = [
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['assignLabel']['id'],
		'ICON' => $arResult['gridActionsData']['assignLabel']['icon'],
		'TITLE' => $arResult['gridActionsData']['assignLabel']['title'],
		'TEXT' => $arResult['gridActionsData']['assignLabel']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onAssignLabelClick()",
					],
				],
			],
		],
	];
}

$actionPanelActionButtons = array_merge($actionPanelActionButtons, [
	[
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['spam']['id'],
		'ICON' => $arResult['gridActionsData']['spam']['icon'],
		'TITLE'=> $arResult['gridActionsData']['spam']['title'],
		'TEXT'=> $arResult['gridActionsData']['spam']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onSpamClick()",
					],
				],
			],
		],
	],
	[
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ICON' => $arResult['gridActionsData']['notSpam']['icon'],
		'ID' => $arResult['gridActionsData']['notSpam']['id'],
		'TITLE' => $arResult['gridActionsData']['notSpam']['title'],
		'TEXT' => $arResult['gridActionsData']['notSpam']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onSpamClick()",
					],
				],
			],
		],
	],
	[
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['delete']['id'],
		'ICON' => $arResult['gridActionsData']['delete']['icon'],
		'TITLE'=> $arResult['gridActionsData']['delete']['title'],
		'TEXT'=> $arResult['gridActionsData']['delete']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'CONFIRM' => true,
				'CONFIRM_APPLY_BUTTON' => 'CONFIRM_APPLY_BUTTON',
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onDeleteClick()",
					],
				],
			],
		],
	],
	[
		'HIDDEN_IN_PANEL' => true,
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => 'separator',
		'ADDITIONAL_CLASS_FOR_PANEL' => 'mail-separator',
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[

					],
				],
			],
		],
	],
]);

$draftActionPanelActionButtons = [
	[
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => 'draft-delete',
		'ICON' => $arResult['gridActionsData']['delete']['icon'],
		'TITLE' => $arResult['gridActionsData']['delete']['title'],
		'TEXT' => $arResult['gridActionsData']['delete']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => 'BX.Mail.Client.Message.List.confirmDeleteSelectedDrafts()',
					],
				],
			],
		],
	],
];

$actionPanelActionButtons = array_merge($actionPanelActionButtons, [
	[
		'HIDDEN_IN_PANEL' => true,
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['addToCrm']['id'],
		'ADDITIONAL_CLASS_FOR_PANEL' => 'mail-crm-action',
		'TEXT' => '<span data-role="crm-action">' . $arResult['gridActionsData']['addToCrm']['text'] . '</span>',
		'TITLE' => $arResult['gridActionsData']['addToCrm']['title'],
		'DISABLED' => true,
		'ONCHANGE' => [
			[
				'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onDisabledGroupActionClick()",
					],
				],
			],
		],
	],
	[
		'HIDDEN_IN_PANEL' => true,
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ADDITIONAL_CLASS_FOR_PANEL' => 'mail-not-crm-action',
		'ID' => $arResult['gridActionsData']['excludeFromCrm']['id'],
		'TEXT' => '<span data-role="not-crm-action">' . $arResult['gridActionsData']['excludeFromCrm']['text'] . '</span>',
		'TITLE' => $arResult['gridActionsData']['excludeFromCrm']['text'],
		'DISABLED' => true,
		'ONCHANGE' => [
			[
				'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onDisabledGroupActionClick()",
					],
				],
			],
		],
	],
]);

$actionPanelActionButtons = array_merge($actionPanelActionButtons, [
	[
		'HIDDEN_IN_PANEL' => true,
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['task']['id'],
		'TEXT' => $arResult['gridActionsData']['task']['text'],
		'TITLE' => $arResult['gridActionsData']['task']['title'],
		'ADDITIONAL_CLASS_FOR_PANEL' => 'mail-task',
		'DISABLED' => true,
		'ONCHANGE' => [
			[
				'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onDisabledGroupActionClick()",
					],
				],
			],
		],
	],
	[
		'HIDDEN_IN_PANEL' => true,
		'TYPE' => Main\Grid\Panel\Types::DROPDOWN,
		'ID' => $arResult['gridActionsData']['discuss']['id'],
		'TEXT' => $arResult['gridActionsData']['discuss']['text'],
		'ADDITIONAL_CLASS_FOR_PANEL' => 'mail-discuss',
		'TITLE' => $arResult['gridActionsData']['discuss']['title'],
		'DISABLED' => true,
	],

	[
		'HIDDEN_IN_PANEL' => true,
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['event']['id'],
		'TEXT' => $arResult['gridActionsData']['event']['text'],
		'TITLE' => $arResult['gridActionsData']['event']['title'],
		'ADDITIONAL_CLASS_FOR_PANEL' => 'mail-meeting',
		'DISABLED' => true,
		'ONCHANGE' => [
			[
				'ACTION' => \Bitrix\Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onDisabledGroupActionClick()",
					],
				],
			],
		],
	],
	[
		'HIDDEN_IN_PANEL' => true,
		'DISABLED' => ($arResult['currentDir'] !== '[Gmail]/All Mail') ? false : true,
		'TYPE' => Main\Grid\Panel\Types::BUTTON,
		'ID' => $arResult['gridActionsData']['deleteImmediately']['id'],
		'TEXT' => $arResult['gridActionsData']['deleteImmediately']['text'],
		'TITLE' => $arResult['gridActionsData']['deleteImmediately']['text'],
		'ONCHANGE' => [
			[
				'ACTION' => Main\Grid\Panel\Actions::CALLBACK,
				'DATA' => [
					[
						'JS' => "BX.Mail.Client.Message.List['" . CUtil::JSEscape($component->getComponentId()) . "'].onDeleteImmediately()",
					],
				],
			],
		],
	],
]);

// The screen runs under the light:mail theme, so the body carries --ui-context-edge-dark and the
// base color tokens resolve to white. The grid is a content surface and declares its own context.

?>
<div
	class="mail-msg-list-grid-stub-wrapper<?= $isDraftMode ? ' mail-draft-list-view' : '' ?>"
	data-role="mail-message-list-view"
	data-testid="<?= $isDraftMode ? 'mail-client-draft-list' : 'mail-client-message-list' ?>"
><div class="mail-msg-list-grid-stub" data-role="mail-msg-list-grid-stub"></div>
<?php if ($isDraftMode): ?>
	<div class="mail-draft-retention" data-testid="mail-draft-list-retention">
		<?= Loc::getMessage('MAIL_DRAFT_LIST_RETENTION') ?>
	</div>
<?php endif ?>
	<div
		id="<?= htmlspecialcharsbx($arResult['GRID_ID']) ?>-actionpanel"
		class="mail-msg-list-actionpanel-container mail-msg-list-actionpanel-container-<?= htmlspecialcharsbx($arResult['GRID_ID']) ?>"
		data-role="mail-msg-list-actionpanel-container"
	></div>
<div class="mail-msg-list-grid --ui-context-content-light" data-role="mail-msg-list-grid" data-testid="mail-list-grid">
<script>
	BX.ready(function()
	{
		var Mail = BX.Mail.Home;

		<?php if (!$isDraftMode): ?>
		Mail.Counters.setHiddenCountersForTotalCounter(<?= Main\Web\Json::encode($arResult['invisibleDirsToCounters']) ?>);
		<?php endif ?>

		var client = new BX.Mail.Client.Mailer({
			mailboxId: <?= intval($arResult['MAILBOX']['ID']) ?>,
			migrationMailboxIds: <?= Main\Web\Json::encode($migrationMailboxIds) ?>,
			filterId: '<?= $arResult['FILTER_ID'] ?>',
			syncAvailable: '<?= \Bitrix\Mail\Helper\LicenseManager::isSyncAvailable() ?>',
			configPath: '<?= CUtil::JSEscape(htmlspecialcharsbx($configPath)) ?>',
			mailboxSelectorConfig: <?= Main\Web\Json::encode($mailboxSelectorConfig) ?>,
			isDraftMode: <?= CUtil::PhpToJSObject($isDraftMode) ?>,
			staticCounter: <?= Main\Web\Json::encode($isDraftMode ? [
				'title' => Loc::getMessage('MAIL_MESSAGE_LIST_INTERNAL_DRAFTS') . ':',
				'count' => (int)($arResult['DRAFT_TOTAL'] ?? 0),
			] : null) ?>,
		});

		Mail.FilterToolbar = client.getFilterToolbar();

		<?php if (!$isDraftMode && $isAllMailMode): ?>
		Mail.Counters.addCounters([
			{ path: '<?= CUtil::JSEscape($arResult['VIRTUAL_FOLDER_KEY']) ?>', count: <?= $globalUnseenCounter ?> }
		]);
		<?php elseif (!$isDraftMode): ?>
		Mail.Counters.addCounters(<?= Main\Web\Json::encode($arResult['DIRS_WITH_UNSEEN_MAIL_COUNTERS']) ?>);
		<?php endif; ?>

		<?php if (!$isDraftMode && $isAllMailMode): ?>
		Mail.mailboxCounters.addCounters([
			{
				'path': 'unseenCountInAllMailboxes',
				'count': <?= $globalUnseenCounter ?>
			}
		]);
		<?php elseif (!$isDraftMode): ?>
		Mail.mailboxCounters.addCounters([
			{
				'path': 'unseenCountInOtherMailboxes',
				'count': <?= $unseenCountInOtherMailboxes ?>
			},
			{
				'path': 'unseenCountInCurrentMailbox',
				'count': <?= $unseenCountInCurrentMailbox ?>
			}
		]);
		<?php endif; ?>

		<?php if (!$isDraftMode): ?>
		BX.addCustomEvent(
			'BX.UI.ActionPanel:created',
			function (panel)
			{
				if (panel.params.gridId == '<?= \CUtil::jsEscape($arResult['GRID_ID']); ?>')
				{
					Mail.Grid.setPanel(panel);
					panel.getPanelContainer().classList.add('mail-msg-list-action-panel');
					var disableItem = panel.disableItem.bind(panel);
					panel.disableItem = function (item)
					{
						if (item) disableItem(item);
					};

					var fixPanel = panel.fixPanel.bind(panel);
					panel.fixPanel = function()
					{
						document.body.appendChild(this.getPanelContainer());
						fixPanel();
					};

					var unfixPanel = panel.unfixPanel.bind(panel);
					panel.unfixPanel = function()
					{
						var grid = BX.Main.gridManager.getInstanceById(panel.params.gridId) || panel.grid;
						var container = grid?.getContainer();
						if (container?.parentNode)
						{
							container.parentNode.insertBefore(this.getPanelContainer(), container);
						}
						unfixPanel();
					};

					setTimeout(panel.unfixPanel.bind(panel));

					//cancellation of reset of checkboxes when clicking outside the panel and grid area
					panel.handleOuterClick = function()
					{
					};
				}
			}
		);
		<?php endif; ?>
	});
</script>

<?php

$gridHeaders = [
	['id' => 'FROM', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_FROM'), 'class' => 'mail-msg-list-from-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
	['id' => 'SUBJECT', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_SUBJECT'), 'class' => 'mail-msg-list-subject-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
];

// the column holds the star and nothing else, so it is not declared where the star is not offered;
// the unseen dot lives in the sender cell and needs no column of its own
if (!$isDraftMode && $listImprovementsEnabled)
{
	array_unshift(
		$gridHeaders,
		['id' => 'FAVORITE', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_FAVORITE'), 'class' => 'mail-msg-list-favorite-cell-head', 'default' => true, 'editable' => false, 'showname' => true, 'prevent_default' => false],
	);
}

$gridHeaders[] = ['id' => 'DATE', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_DATE'), 'class' => 'mail-msg-list-date-cell-head', 'default' => true, 'editable' => false, 'showname' => false];
if (!$isDraftMode)
{
	$gridHeaders = array_merge($gridHeaders, [
		['id' => 'CRM_BIND', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_CRM_BIND'), 'class' => 'mail-msg-list-crm-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
		['id' => 'TASK_BIND', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_TASK_BIND'), 'class' => 'mail-msg-list-task-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
		['id' => 'CHAT_BIND', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_CHAT_BIND'), 'class' => 'mail-msg-list-chat-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
		['id' => 'POST_BIND', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_POST_BIND'), 'class' => 'mail-msg-list-post-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
		['id' => 'MEETING_BIND', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_MEETING_BIND'), 'class' => 'mail-msg-list-meeting-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
	]);
}
$renderGrid = static function (
	array $gridData,
	array $headers,
	array $actionButtons,
	bool $draftMode,
) use ($APPLICATION): void
{
	?>
	<script>
		BX(function()
		{
			var container = document.querySelector(
				'.mail-msg-list-actionpanel-container-<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'
			);
			if (container && !container.querySelector('.mail-msg-list-action-panel'))
			{
				var actionPanel = new BX.UI.ActionPanel({
					params: {
						gridId: '<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>',
					},
					pinnedMode: true,
					renderTo: container,
					className: 'mail-msg-list-action-panel',
					groupActions: <?= Main\Web\Json::encode([
						'GROUPS' => [
							['ITEMS' => $actionButtons],
						],
					]) ?>,
					maxHeight: 56,
				});
				var handleGridSelectItem = actionPanel.handleGridSelectItem.bind(actionPanel);
				actionPanel.handleGridSelectItem = function(eventGrid)
				{
					if (!eventGrid || eventGrid.getId() !== '<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>')
					{
						return;
					}

					this.grid = eventGrid;
					handleGridSelectItem();
				};
				var hidePanel = actionPanel.hidePanel.bind(actionPanel);
				actionPanel.hidePanel = function(eventGrid)
				{
					var grid = BX.Main.gridManager.getInstanceById(
						'<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'
					);
					if (eventGrid && eventGrid !== grid)
					{
						return;
					}
					if (!eventGrid && grid?.getRows().getSelectedIds().length > 0)
					{
						return;
					}

					hidePanel();
				};
				actionPanel.getPanelContainer().classList.add('mail-msg-list-action-panel');
				actionPanel.draw();
				<?php if ($draftMode): ?>
				container.appendChild(actionPanel.getPanelContainer());
				<?php endif; ?>
				BX.Mail.Home.GridActionPanels = BX.Mail.Home.GridActionPanels || {};
				BX.Mail.Home.GridActionPanels['<?= \CUtil::jsEscape($gridData['GRID_ID']) ?>'] = actionPanel;
			}
		});
	</script>
	<?php
	$APPLICATION->includeComponent(
		'bitrix:main.ui.grid',
		'',
		[
		'GRID_ID' => $gridData['GRID_ID'],
		'MESSAGES' => $gridData['MESSAGES'] ?? [],
		'AJAX_MODE' => 'Y',
		'AJAX_OPTION_ADDITIONAL' => $gridData['GRID_ID'],
		'AJAX_OPTION_HISTORY' => 'N',
		'AJAX_OPTION_JUMP' => 'N',
		'AJAX_OPTION_STYLE' => 'N',
		'SHOW_ACTION_PANEL' => false,
		'HEADERS' => $headers,

		'ROWS' => $gridData['ROWS'],

		'SHOW_GRID_SETTINGS_MENU' => false,
		'ALLOW_COLUMNS_SORT' => false,
		'ALLOW_ROWS_SORT' => false,
		'SHOW_NAVIGATION_PANEL' => false,

		'SHOW_MORE_BUTTON' => true,
		'ENABLE_NEXT_PAGE' => !empty($gridData['ENABLE_NEXT_PAGE']),
		'NAV_PARAM_NAME' => $gridData['NAV_OBJECT']->getId(),
		'CURRENT_PAGE' => $gridData['NAV_OBJECT']->getCurrentPage(),
		'STUB' => $draftMode && ($gridData['DRAFT_TOTAL'] ?? 0) === 0
			? sprintf(
				'<div class="mail-draft-list-empty" data-testid="mail-draft-list-empty">%s</div>',
				htmlspecialcharsbx(
					Loc::getMessage('MAIL_DRAFT_LIST_EMPTY'),
				),
			)
			: null,
		'ACTION_PANEL' => [
			'GROUPS' => [
				['ITEMS' => $actionButtons],
			],
		],
		'ACTION_PANEL_OPTIONS' => [
			'MAX_HEIGHT' => 56,
		],

		'SHOW_ROW_CHECKBOXES' => true,
		'SHOW_CHECK_ALL_CHECKBOXES' => true,
		],
	);
};

$renderGrid(
	[
		'GRID_ID' => $arResult['GRID_ID'],
		'MESSAGES' => $arResult['MESSAGES'],
		'ROWS' => $arResult['ROWS'],
		'ENABLE_NEXT_PAGE' => $arResult['ENABLE_NEXT_PAGE'],
		'NAV_OBJECT' => $arResult['NAV_OBJECT'],
		'DRAFT_TOTAL' => $arResult['DRAFT_TOTAL'] ?? null,
	],
	$gridHeaders,
	$isDraftMode ? $draftActionPanelActionButtons : $actionPanelActionButtons,
	$isDraftMode,
);

?>

</div>
</div>

<?php if (!$isDraftMode && !empty($arResult['EMBEDDED_DRAFT_LIST'])): ?>
	<?php
	$embeddedDraftList = $arResult['EMBEDDED_DRAFT_LIST'];
	$draftGridHeaders = [
		['id' => 'FROM', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_FROM'), 'class' => 'mail-msg-list-from-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
		['id' => 'SUBJECT', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_SUBJECT'), 'class' => 'mail-msg-list-subject-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
		['id' => 'DATE', 'name' => Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_DATE'), 'class' => 'mail-msg-list-date-cell-head', 'default' => true, 'editable' => false, 'showname' => false],
	];
	?>
	<div class="mail-draft-list-view mail-embedded-draft-list" data-testid="mail-client-draft-list" hidden>
		<div class="mail-draft-retention" data-testid="mail-draft-list-retention">
			<?= Loc::getMessage('MAIL_DRAFT_LIST_RETENTION') ?>
		</div>
		<div
			id="<?= htmlspecialcharsbx($embeddedDraftList['GRID_ID']) ?>-actionpanel"
			class="mail-msg-list-actionpanel-container mail-msg-list-actionpanel-container-<?= htmlspecialcharsbx($embeddedDraftList['GRID_ID']) ?>"
			data-role="mail-draft-list-actionpanel-container"
		></div>
		<div
			class="mail-msg-list-grid --ui-context-content-light"
			data-role="mail-draft-list-grid"
			data-testid="mail-draft-list-grid"
		>
			<?php
			$renderGrid(
				[
					'GRID_ID' => $embeddedDraftList['GRID_ID'],
					'ROWS' => $embeddedDraftList['ROWS'],
					'ENABLE_NEXT_PAGE' => $embeddedDraftList['ENABLE_NEXT_PAGE'],
					'NAV_OBJECT' => $embeddedDraftList['NAV_OBJECT'],
					'DRAFT_TOTAL' => $embeddedDraftList['TOTAL'],
				],
				$draftGridHeaders,
				$draftActionPanelActionButtons,
				true,
			);
			?>
		</div>
	</div>
<?php endif; ?>

<script>
	// workaround to prevent page title update after reloading grid in some side panel
	if(window !== window.top)
	{
		if(BX.type.isFunction(top.BX.ajax.UpdatePageTitle)) top.BX.ajax.UpdatePageTitle = (function() {});
		if(BX.type.isFunction(top.BX.ajax.UpdatePageData)) top.BX.ajax.UpdatePageData = (function() {});
	}

	BX.message({
		MAIL_MAILBOX_ID: '<?= (int)$arResult['MAILBOX']['ID'] ?>',
		MAIL_FOLDER_SORT_MODE: '<?= CUtil::jsEscape($arResult['folderSortMode']) ?>',
		MAIL_FOLDER_MANUAL_SORTING_AVAILABLE: '<?= $arResult['FOLDER_MANUAL_SORTING_AVAILABLE'] ? 'Y' : 'N' ?>',
		MAIL_FOLDER_EXPAND_STATE: '<?= \CUtil::jsEscape($arResult['folderExpandState']) ?>',
		MAIL_NEED_SHOW_FOLDER_SORT_GUIDE: '<?= $arResult['NEED_SHOW_FOLDER_SORT_GUIDE'] ? 'Y' : 'N' ?>',
		MAILBOX_IS_SYNC_AVAILABILITY: '<?= CUtil::JSEscape($arResult['MAILBOX_IS_SYNC_AVAILABILITY']) ?>',
		MAIL_LIST_IMPROVEMENTS_ENABLED: '<?= $listImprovementsEnabled ? 'Y' : 'N' ?>',
		DEFAULT_DIR: '<?= CUtil::JSEscape($isAllMailMode ? $arResult['VIRTUAL_FOLDER_KEY'] : $arResult['defaultDir']) ?>',
		MAIL_VIRTUAL_FOLDER_KEY: '<?= CUtil::JSEscape($arResult['VIRTUAL_FOLDER_KEY']) ?>',
		MESSAGES_ALREADY_EXIST_IN_FOLDER : '<?= Loc::getMessage('MESSAGES_ALREADY_EXIST_IN_FOLDER') ?>',
		MAILBOX_LINK: '<?= CUtil::JSEscape($arResult['MAILBOX']['LINK'])?>',
		MAIL_MESSAGE_GRID_ID: '<?= CUtil::JSEscape($arResult['GRID_ID'])?>',
		MAIL_MESSAGE_FILTER_ID: '<?= CUtil::JSEscape($arResult['FILTER_ID'])?>',
		MAIL_IS_ALL_MAIL_MODE: '<?= $isAllMailMode ? 'Y' : 'N' ?>',
		INTERFACE_MAIL_CHECK_ALL: '<?= Loc::getMessage('INTERFACE_MAIL_CHECK_ALL')?>',
		MAIL_MESSAGE_LIST_COLUMN_BIND_TASKS_TASK: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_BIND_TASKS_TASK')) ?>',
		MAIL_MESSAGE_LIST_COLUMN_BIND_CRM_ACTIVITY: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_BIND_CRM_ACTIVITY')) ?>',
		MAIL_MESSAGE_LIST_COLUMN_BIND_IM_CHAT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_BIND_IM_CHAT')) ?>',
		MAIL_MESSAGE_LIST_COLUMN_BIND_CALENDAR_EVENT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_BIND_CALENDAR_EVENT')) ?>',
		MAIL_MESSAGE_LIST_COLUMN_BIND_BLOG_POST: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_COLUMN_BIND_BLOG_POST')) ?>',
		MAIL_CLIENT_AJAX_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_CLIENT_AJAX_ERROR')) ?>',
		MAIL_MESSAGE_LIST_BTN_SEEN: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_BTN_SEEN')) ?>',
		MAIL_MESSAGE_LIST_BTN_UNSEEN: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_BTN_UNSEEN')) ?>',
		MAIL_MESSAGE_LIST_BTN_DELETE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_BTN_DELETE')) ?>',
		MAIL_MESSAGE_LIST_BTN_NOT_SPAM: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_BTN_NOT_SPAM')) ?>',
		MAIL_MESSAGE_LIST_BTN_SPAM: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_BTN_SPAM')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_DELETE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_DELETE_BTN: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE_BTN')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_TITLE')) ?>',
		MAIL_MESSAGE_LIST_NOTIFY_ADDED_TO_CRM: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADDED_TO_CRM')) ?>',
		MAIL_MESSAGE_LIST_NOTIFY_ADD_TO_CRM_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADD_TO_CRM_ERROR')) ?>',
		MAIL_MESSAGE_LIST_NOTIFY_EXCLUDED_FROM_CRM: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_EXCLUDED_FROM_CRM')) ?>',
		MAIL_MESSAGE_LIST_NOTIFY_SUCCESS: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_SUCCESS')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_TITLE')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_RUNNING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_RUNNING')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_WAITING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_WAITING')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_SWITCHING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_SWITCHING')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_BLOCKED: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_BLOCKED')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_CANCELLING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_CANCELLING')) ?>',
		MAIL_MESSAGE_LIST_MIGRATION_ACTION_UNAVAILABLE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_MIGRATION_ACTION_UNAVAILABLE')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_CANCEL_BTN: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_CANCEL_BTN')) ?>',
		MAIL_MESSAGE_SYNC_BTN_HINT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_SYNC_BTN_HINT')) ?>',
		MAIL_FOLDER_SORT_BTN_HINT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_BTN_HINT')) ?>',
		MAIL_FOLDER_SORT_DEFAULT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_DEFAULT')) ?>',
		MAIL_FOLDER_SORT_ALPHA_ASC: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_ALPHA_ASC')) ?>',
		MAIL_FOLDER_SORT_ALPHA_DESC: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_ALPHA_DESC')) ?>',
		MAIL_FOLDER_SORT_MANUAL: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_MANUAL')) ?>',
		MAIL_FOLDER_SORT_MODE_SAVE_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_MODE_SAVE_ERROR')) ?>',
		MAIL_FOLDER_SORT_GUIDE_TITLE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_GUIDE_TITLE')) ?>',
		MAIL_FOLDER_SORT_GUIDE_DESCRIPTION: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_FOLDER_SORT_GUIDE_DESCRIPTION')) ?>',
		MAIL_CLIENT_MAILBOX_SYNC_BAR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_CLIENT_MAILBOX_SYNC_BAR')) ?>',
		MAIL_CLIENT_MAILBOX_SYNC_BAR_INTERRUPTED: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_CLIENT_MAILBOX_SYNC_BAR_INTERRUPTED')) ?>',
		MAIL_CLIENT_BUTTON_LOADING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_CLIENT_BUTTON_LOADING')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_MOVE_ALL: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_MOVE_ALL')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_SPAM_ALL: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_SPAM_ALL')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_TRASH_ALL: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_TRASH_ALL')) ?>',
		MAIL_MESSAGE_LIST_CONFIRM_DELETE_ALL: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE_ALL')) ?>',
		MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT')) ?>',
		MAIL_MESSAGE_ICAL_NOTIFY_REJECT: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ICAL_NOTIFY_REJECT')) ?>',
		MAIL_MESSAGE_LIST_LABELS_LOAD_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_LABELS_LOAD_ERROR')) ?>',
		MAIL_MESSAGE_LIST_LABEL_TOGGLE_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_LABEL_TOGGLE_ERROR')) ?>',
		MAIL_MESSAGE_LIST_LABELS_EMPTY: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_LABELS_EMPTY')) ?>',
<?php if ($listImprovementsEnabled): ?>
		MAIL_LIST_ARCHIVE_DOWNLOAD_AVAILABLE: '<?= $archiveDownloadAvailable ? 'Y' : 'N' ?>',
		MAIL_DISK_FILE_DOWNLOAD_ARCHIVE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_DISK_FILE_DOWNLOAD_ARCHIVE')) ?>',
		MAIL_MESSAGE_LIST_ARCHIVE_PREPARING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ARCHIVE_PREPARING')) ?>',
		MAIL_MESSAGE_LIST_ARCHIVE_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ARCHIVE_ERROR')) ?>',
		MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD')) ?>',
		MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD_FILE: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD_FILE')) ?>',
		MAIL_MESSAGE_LIST_ATTACHMENTS_LOADING: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_LOADING')) ?>',
		MAIL_MESSAGE_LIST_ATTACHMENTS_EMPTY: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_EMPTY')) ?>',
		MAIL_MESSAGE_LIST_ATTACHMENTS_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_ERROR')) ?>',
		MAIL_MESSAGE_LIST_FAVORITES_SHOWN_PLURAL_0: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITES_SHOWN_PLURAL_0')) ?>',
		MAIL_MESSAGE_LIST_FAVORITES_SHOWN_PLURAL_1: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITES_SHOWN_PLURAL_1')) ?>',
		MAIL_MESSAGE_LIST_FAVORITES_SHOWN_PLURAL_2: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITES_SHOWN_PLURAL_2')) ?>',
		MAIL_MESSAGE_LIST_FAVORITES_EMPTY: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITES_EMPTY')) ?>',
		MAIL_MESSAGE_LIST_FAVORITE_ADDED: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITE_ADDED')) ?>',
		MAIL_MESSAGE_LIST_FAVORITE_REMOVED: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITE_REMOVED')) ?>',
		MAIL_MESSAGE_LIST_FAVORITE_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITE_ERROR')) ?>',
<?php endif; ?>
		MAIL_MESSAGE_ICAL_NOTIFY_ERROR: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ICAL_NOTIFY_ERROR')) ?>'
	});

	var numberOfRowsPerPage = 25;

	BX.ready(function()
	{
		<?php if (!empty($arResult['ANALYTICS']['SOURCE'])): ?>
			const analyticsParams = {
				tool: 'mail',
				event: 'mail_inbox_open',
				category: 'mail_general_ops',
			}

			<?php if ($arResult['ANALYTICS']['SOURCE'] === AnalyticsHelper::SOURCE_TYPE_NOTIFICATION): ?>
				analyticsParams.c_section = '<?= \CUtil::JSEscape($arResult['ANALYTICS']['SOURCE']) ?>'
			<?php else: ?>
				analyticsParams.c_element = '<?= \CUtil::JSEscape($arResult['ANALYTICS']['SOURCE']) ?>'
			<?php endif; ?>

			BX.UI.Analytics.sendData(analyticsParams);
		<?php endif;?>

		var Mail = BX.Mail.Home;
		Mail.Grid.setGridId('<?= CUtil::JSEscape($arResult['GRID_ID'])?>');
		var mailboxId = Number(<?= intval($arResult['MAILBOX']['ID']) ?>);
		var allMailMode = <?= CUtil::PhpToJSObject((bool)$isAllMailMode) ?>;
		var allMailboxIds = <?= Main\Web\Json::encode(array_keys($arResult['MAILBOXES'])) ?>;

		<?php if (!$isDraftMode): ?>
		BX.addCustomEvent("onPullEvent-mail", BX.delegate(function(command, params)
		{
			var incomingMailboxId = Number(params.mailboxId);
			var isRelevantMailbox = allMailMode
				? allMailboxIds.indexOf(incomingMailboxId) !== -1
				: mailboxId === incomingMailboxId;

			if (isRelevantMailbox)
			{
				if (
					(
						command === 'recovered_message_is_synchronized' ||
						(command === 'new_message_is_synchronized' && Mail.Grid.getCountDisplayed() < numberOfRowsPerPage)
					) &&
					mailMessageList.getCurrentFolder() === params.dir
				)
				{
					BX.ajax.runComponentAction('bitrix:mail.client.message.list', 'syncMailCounters',
					{
						mode: 'class',
						data:
						{
							mailboxId: incomingMailboxId,
						}
					});

					Mail.Grid.reloadTable();
				}

				if (command ==='counters_updated')
				{
					if (mailMessageList.pendingCountersAction !== true)
					{
						mailMessageList.updateCountersFromBackend();
					}
				}

				if (command ==='counters_is_synchronized')
				{
					if (!allMailMode)
					{
						const data = params.dirs || {};
						BX.Mail.Home.Counters.setCounters(data);
					}
				}
			}

		}, this));
		<?php endif ?>

		<?php if (!$isDraftMode && $arParams['VARIABLES']['start_sync_with_showing_stepper']==='true')
		{
		?>
			if(!Mail.Grid.getCountDisplayed())
			{
				Mail.Grid.setGridWrapper(document.querySelector('[data-role="mail-msg-list-grid"]'));
				Mail.Grid.setGridStub(document.querySelector('[data-role="mail-msg-list-grid-stub"]'));
				Mail.Grid.enableLoadingMessagesStub();
			}
		<?php
		}
		?>

		<?php
		$leftMenuDirs = $isAllMailMode
			? [[
				'path' => $arResult['VIRTUAL_FOLDER_KEY'],
				'name' => Loc::getMessage('MAIL_CLIENT_ALL_INBOX'),
				'count' => $globalUnseenCounter,
				'icon' => 'inbox',
				'items' => [],
			]]
			: $arResult['DIRECTORY_HIERARCHY_WITH_UNSEEN_MAIL_COUNTERS'];
		?>
		BX.Mail.Home.LeftMenuNode = new Mail.LeftMenu({
			mailboxId: <?= intval($arResult['MAILBOX']['ID']) ?>,
			dirsWithUnseenMailCounters: <?= Main\Web\Json::encode($leftMenuDirs) ?>,
			filterId: '<?= $arResult['FILTER_ID'] ?>',
			labelsEnabled: <?= !empty($arResult['LABELS_ENABLED']) ? 'true' : 'false' ?>,
			labels: <?= Main\Web\Json::encode($arResult['LABELS'] ?? []) ?>,
			labelActiveId: <?= (int)($arResult['currentLabelId'] ?? 0) ?>,
			labelScopeMailboxId: <?= $isAllMailMode ? 'null' : (int)$arResult['MAILBOX']['ID'] ?>,
			systemDirs :
				{
					spam: '<?= CUtil::JSEscape($arResult['spamDir']) ?>',
					trash: '<?= CUtil::JSEscape($arResult['trashDir']) ?>',
					drafts: '<?= CUtil::JSEscape($arResult['draftsDir']) ?>',
					outcome: '<?= CUtil::JSEscape($arResult['outcomeDir']) ?>',
					inbox: '<?= CUtil::JSEscape($isAllMailMode ? $arResult['VIRTUAL_FOLDER_KEY'] : $arResult['defaultDir']) ?>',
				},
			sortMode: '<?= \CUtil::jsEscape($arResult['folderSortMode']) ?>',
			collapsedFolders: JSON.parse('<?= \CUtil::jsEscape($arResult['folderExpandState']) ?>'),
			listImprovementsEnabled: <?= $listImprovementsEnabled ? 'true' : 'false' ?>,
			favoritesLabel: '<?= \CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_FAVORITES_FILTER')) ?>',
			favoritesActive: <?= $favoritesSectionActive ? 'true' : 'false' ?>,
			folderCustomOrder: JSON.parse('<?= \CUtil::jsEscape($arResult['folderCustomOrder']) ?>'),
			// the single link between the left menu and the list screen: false stops the menu,
			// because the screen is navigating away by itself
			onDirectorySelect: function(directory, section)
			{
				if (section === BX.Mail.FAVORITES_SECTION)
				{
					<?php if ($isDraftMode): ?>
					mailMessageList.navigateToMessageList({
						[BX.Mail.LIST_SECTION_PARAM]: BX.Mail.FAVORITES_SECTION,
					});

					return false;
					<?php else: ?>
					mailMessageList.showFavoritesSection();

					return true;
					<?php endif ?>
				}

				mailMessageList.leaveFavoritesSection();

				<?php if ($internalDraftsAvailable): ?>
				if (!<?= $isDraftMode ? 'true' : 'false' ?> && mailMessageList?.draftListContainer?.hidden === false)
				{
					mailMessageList.hideDrafts();

					return true;
				}

				<?php if ($isDraftMode): ?>
				mailMessageList.navigateToMessageList({ apply_filter: 'Y', DIR: directory });

				return false;
				<?php endif ?>
				<?php endif ?>

				return true;
			},
			folderDefaultOrder: <?= Main\Web\Json::encode($arResult['folderDefaultOrder']) ?>,
			manualSortingAvailable: <?= $arResult['FOLDER_MANUAL_SORTING_AVAILABLE'] ? 'true' : 'false' ?>,
		});
		<?php if ($isDraftMode): ?>
		BX.Mail.Home.LeftMenuNode.directoryMenu.clearActiveMenuButtons();
		<?php endif; ?>

		<?php if ($isAllMailMode): ?>
		(function() {
			var virtualKey = '<?= CUtil::JSEscape($arResult['VIRTUAL_FOLDER_KEY']) ?>';
			BX.Mail.Home.LeftMenuNode.directoryMenu.setDirectory(virtualKey);
			BX.Event.EventEmitter.subscribe('BX.Main.Filter:apply', function() {
				BX.Mail.Home.LeftMenuNode.directoryMenu.setDirectory(virtualKey);
			});
		})();
		<?php endif; ?>

		var mailMessageList = new BX.Mail.Client.Message.List({
			id: '<?= CUtil::JSEscape($component->getComponentId())?>',
			gridId: '<?= CUtil::JSEscape($arResult['GRID_ID'])?>',
			filterId: '<?= CUtil::JSEscape($arResult['FILTER_ID'])?>',
			mailboxId: <?= intval($arResult['MAILBOX']['ID']) ?>,
			migrationMailboxIds: <?= Json::encode($migrationMailboxIds) ?>,
			labels: <?= Main\Web\Json::encode($arResult['LABELS'] ?? []) ?>,
			labelScopeMailboxId: <?= $isAllMailMode ? 'null' : (int)$arResult['MAILBOX']['ID'] ?>,
			settingsMenu: <?= Main\Web\Json::encode($settingsMenu) ?>,
			canDelete: <?= CUtil::PhpToJSObject((bool)$arResult['trashDir']); ?>,
			canMarkSpam: <?= CUtil::PhpToJSObject((bool)$arResult['spamDir']); ?>,
			mailboxCanDelete: <?= Main\Web\Json::encode($arResult['MAILBOX_CAN_DELETE'] ?? []) ?>,
			mailboxCanMarkSpam: <?= Main\Web\Json::encode($arResult['MAILBOX_CAN_MARK_SPAM'] ?? []) ?>,
			migrationActionIds: <?= Json::encode(array_values(array_unique([
				$arResult['gridActionsData']['read']['id'],
				$arResult['gridActionsData']['notRead']['id'],
				$arResult['gridActionsData']['move']['id'],
				$arResult['gridActionsData']['delete']['id'],
				$arResult['gridActionsData']['deleteImmediately']['id'],
				$arResult['gridActionsData']['spam']['id'],
				$arResult['gridActionsData']['notSpam']['id'],
			]))) ?>,
			outcomeDir: '<?= CUtil::JSEscape($arResult['outcomeDir']) ?>',
			inboxDir: '<?= CUtil::JSEscape($arResult['defaultDir']) ?>',
			spamDir: '<?= CUtil::JSEscape($arResult['spamDir']) ?>',
			trashDir: '<?= CUtil::JSEscape($arResult['trashDir']) ?>',
			isDraftMode: <?= CUtil::PhpToJSObject($isDraftMode) ?>,
			favoritesSectionActive: <?= $favoritesSectionActive ? 'true' : 'false' ?>,
			composePath: '<?= CUtil::JSEscape($createPath->getUri()) ?>',
			composeSliderOptions: <?= Json::encode($composeSliderOptions) ?>,
			draftsPath: '<?= CUtil::JSEscape($draftsHref ?? '') ?>',
			messageListPath: '<?= CUtil::JSEscape($currentMessageListHref) ?>',
			draftDeleteConfirm: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_CONFIRM')) ?>',
			draftDeleteDescription: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_DESCRIPTION')) ?>',
			draftDeleteManyConfirm: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_MANY_CONFIRM')) ?>',
			draftDeleteManyDescription: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_MANY_DESCRIPTION')) ?>',
			draftDeleteButton: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_BUTTON')) ?>',
			draftCancelButton: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_CANCEL')) ?>',
			draftDeletePartialError: '<?= CUtil::JSEscape(Loc::getMessage('MAIL_DRAFT_LIST_DELETE_PARTIAL_ERROR')) ?>',
			enableNextPage: '<?= !empty($arResult['ENABLE_NEXT_PAGE']) ?>' ?? false,
			MESSAGE_MAIL_HREF_LIST: <?= Main\Web\Json::encode($arResult['MESSAGE_HREF_LIST']) ?>,
			ERROR_CODE_CAN_NOT_MARK_SPAM: 'MAIL_CLIENT_SPAM_FOLDER_NOT_SELECTED_ERROR',
			ERROR_CODE_CAN_NOT_DELETE: 'MAIL_CLIENT_TRASH_FOLDER_NOT_SELECTED_ERROR'
		});

		<?php if ($arResult['NEED_SHOW_DISCUSS_IN_CHAT_GUIDE']): ?>
		const discussButton = document.querySelector('.js-mail-discuss-in-chat');
		if (discussButton)
		{
			const guideOptions = {
				id: 'mail-discuss-in-chat-guide',
				bindElement: discussButton,
				description: '<?= GetMessageJS("MAIL_DISCUSS_IN_CHAT_GUIDE_TEXT") ?? "" ?>',
				userOptionName: '<?= \CUtil::jsEscape($arParams['DISCUSS_IN_CHAT_GUIDE_NAME'] ?? null) ?>',
			};

			(new BX.Mail.MailGuide(guideOptions)).show();
		}

		<?php endif ?>

		<?php if ($arResult['NEED_SHOW_ALL_MAIL_MODE_GUIDE'] ?? false): ?>
		const allMailModeButton = document.querySelector('[data-role="mailbox-selector-root"]');
		if (allMailModeButton)
		{
			(new BX.Mail.MailGuide({
				id: 'mail-all-mail-mode-guide',
				title: '<?= GetMessageJS('MAIL_CLIENT_ALL_MAIL_MODE_GUIDE_TITLE') ?? '' ?>',
				description: '<?= GetMessageJS('MAIL_CLIENT_ALL_MAIL_MODE_GUIDE_TEXT') ?? '' ?>',
				bindElement: allMailModeButton,
				userOptionName: '<?= \CUtil::jsEscape($arResult['ALL_MAIL_MODE_GUIDE_OPTION_NAME'] ?? null) ?>',
				width: 471,
			})).show();
		}
		<?php endif ?>

		<?php if ($arResult['NEED_SHOW_LABELS_ONBOARDING'] ?? false): ?>
		const labelsMenuBlock = document.querySelector('.mail-label-menu');
		if (labelsMenuBlock && BX.Mail.LabelsGuide)
		{
			(new BX.Mail.LabelsGuide({
				id: 'mail-labels-onboarding-guide',
				bindElement: labelsMenuBlock,
				userOptionName: '<?= \CUtil::jsEscape($arResult['LABELS_ONBOARDING_OPTION_NAME'] ?? '') ?>',
				onCreate: () => {
					const leftMenu = BX.Mail.Home.LeftMenuNode;
					if (leftMenu && typeof leftMenu.openLabelsCreation === 'function')
					{
						leftMenu.openLabelsCreation();
					}
				},
			})).show();
		}
		<?php endif ?>

		var mailboxData = <?= Main\Web\Json::encode([
			'ID'       => $arResult['MAILBOX']['ID'],
			'EMAIL'    => $arResult['MAILBOX']['EMAIL'],
			'NAME'     => $arResult['MAILBOX']['NAME'],
			'USERNAME' => $arResult['MAILBOX']['USERNAME'],
			'SERVER'   => $arResult['MAILBOX']['SERVER'],
			'PORT'     => $arResult['MAILBOX']['PORT'],
			'USE_TLS'  => $arResult['MAILBOX']['USE_TLS'],
			'LOGIN'    => $arResult['MAILBOX']['LOGIN'],
			'LINK'     => $arResult['MAILBOX']['LINK'],
			'OPTIONS'  => [
				'flags' => !empty($arResult['MAILBOX']['OPTIONS']['flags']) ? $arResult['MAILBOX']['OPTIONS']['flags'] : [],
				'inboxDir' => $arResult['defaultDir'],
			],
		]) ?>;

		<?php if (!$isDraftMode): ?>
		BXMailMailbox.init(mailboxData);

		<?php if (\Bitrix\Mail\Helper\LicenseManager::isSyncAvailable() && !empty($arResult['CONFIG_SYNC_DIRS'])): ?>
			if('<?= $arParams['VARIABLES']['start_sync_with_showing_stepper']!=='true' ?>' || Mail.Grid.getCountDisplayed())
			{
				BXMailMailbox.sync(BX.Mail.Home.ProgressBar, '<?= \CUtil::jsEscape($arResult['FILTER_ID']) ?>',false,true);
			}
			else
			{
				BXMailMailbox.sync(BX.Mail.Home.ProgressBar, '<?= \CUtil::jsEscape($arResult['FILTER_ID']) ?>',false,true);
			}
		<?php endif ?>

		<?php if ($isAllMailMode): ?>
		if (BX.PULL)
		{
			allMailboxIds.forEach(function (id) {
				BX.PULL.extendWatch('mail_mailbox_' + id);
			});
		}
		<?php else: ?>
		BX.PULL && BX.PULL.extendWatch('mail_mailbox_<?= intval($arResult['MAILBOX']['ID']) ?>');
		<?php endif; ?>
		BX.addCustomEvent(
			'onPullEvent-mail',
			function (command, params)
			{
				if ('mailbox_sync_status' === command)
				{
					if (<?= intval($arResult['MAILBOX']['ID']) ?> == params.id && mailMessageList.getCurrentFolder() === params.dir)
					{
						BXMailMailbox.syncProgress(
							BX.Mail.Home.ProgressBar,
							'<?= \CUtil::jsEscape($arResult['FILTER_ID']) ?>',
							params
						);
					}
				}
			}
		);
		<?php endif ?>

		BX.addCustomEvent(
			'SidePanel.Slider:onMessage',
			function (event)
			{
				var grid = BX.Main.gridManager.getInstanceById('<?= \CUtil::jsEscape($arResult['GRID_ID']) ?>');

				var urlParams = {};
				if (window !== window.top)
				{
					urlParams.IFRAME = 'Y';
				}

				if (event.getEventId() == 'mail-mailbox-config-success')
				{
					event.data.handled = true;
					if (event.data.id != <?= intval($arResult['MAILBOX']['ID']) ?> || event.data.changed)
					{
						grid && grid.tableFade();
						window.location.href = BX.util.add_url_param(
							'<?= \CUtil::jsEscape($arParams['PATH_TO_MAIL_MSG_LIST']) ?>'.replace('#id#', event.data.id).replace('#start_sync_with_showing_stepper#', true),
							urlParams
						);
					}
				}
				else if (event.getEventId() == 'mail-mailbox-config-delete')
				{
					grid && grid.tableFade();
					window.location.href = BX.util.add_url_param(
						'<?= \CUtil::jsEscape($arParams['PATH_TO_MAIL_HOME']) ?>',
						urlParams
					);
				}
				else if (event.getEventId() === 'mail-message-reload-grid')
				{
					grid && grid.reload();
				}
				else if (event.getEventId() == 'mail-message-create-task')
				{
					BX.Mail.Client.Message.List['<?= \CUtil::jsEscape($component->getComponentId()) ?>'].onCreateTaskEvent(event);
				}
				else if (event.getEventId() == 'mail-mailbox-config-close')
				{
					if (event.data.changed)
					{
						grid && grid.tableFade();
						window.location.href = BX.util.add_url_param(
							'<?= \CUtil::jsEscape($arParams['PATH_TO_MAIL_HOME']) ?>',
							urlParams
						);
					}
				}
			}
		);

		top.BX.addCustomEvent("SidePanel.Slider:onOpen", (event) => {
			const slider = event.getSlider();
			const dictionary = slider.getData();
			dictionary.set(
				'hrefList',
				mailMessageList.userInterfaceManager.MESSAGE_MAIL_HREF_LIST
			);
			dictionary.set('enableNextPage', mailMessageList.userInterfaceManager.enableNextPage ?? false);

			const views = slider.getWindow()?.BXMailView?.__views
			let view = null;
			if(slider.getWindow()?.BXMailView?.__views)
			{
				const keys = Object.keys(views);
				view = views[keys[0]];
			}

			if(view && view?.pageSwapper)
			{
				view.pageSwapper.updatePagesHref(slider.getData().get('hrefList'));
			}
		});

		if (window === window.top)
		{
			BX.data(
				BX.findChildByClassName(
					BX('bx_left_menu_menu_external_mail') || BX('menu_external_mail'),
					'menu-item-link',
					true
				),
				'slider-ignore-autobinding',
				'true'
			);
		}

		<?php if (empty($arResult['CONFIG_SYNC_DIRS'])): ?>
		var url = '<?= \CUtil::jsEscape((string)(new Uri($arParams['PATH_TO_MAIL_CONFIG_DIRS']))->addParams(['mailboxId' => $arResult['MAILBOX']['ID']])) ?>';

		top.BX.SidePanel.Instance.open(
			url
		);
		<?php endif ?>

		<?php if (
		$arResult['HAS_ACCESS_TO_MAILBOX_GRID']
		&& $arResult['NEED_SHOW_MAILBOX_GRID_HINT']
		): ?>
		const button = document.querySelector('[data-id="mail-mailbox-grid-button"]');
		if (button)
		{
			(new BX.Mail.MailGuide({
				id: 'push-mailbox-grid',
				description: '<?= GetMessageJS("MAIL_MESSAGE_MAILBOX_GRID_HINT_DESCRIPTION") ?>',
				bindElement: button,
				addHighlighter: true,
				userOptionName: '<?= \CUtil::jsEscape($arParams['MAILBOX_GRID_GUIDE_NAME'] ?? null) ?>',
			})).show();
		}
		<?php endif ?>

		BX.Mail.Client.Dialog.PasswordlessConnect.checkAndShow({
			messageListUrl: '<?= \CUtil::jsEscape($arParams['PATH_TO_MAIL_MSG_LIST']) ?>',
		});

		<?php if (isset($_REQUEST['open_settings'])): ?>
		top.BX.SidePanel.Instance.open(
			'<?= \CUtil::jsEscape(
				(new \Bitrix\Main\Web\Uri(\CComponentEngine::makePathFromTemplate(
					$arParams['PATH_TO_MAIL_CONFIG'],
					['act' => 'edit'],
				)))->addParams(
					[
						'id' => $arResult['MAILBOX']['ID'],
						'open_dirs' => 'Y',
					],
			)) ?>',
			{ cacheable: false }
		);
		<?php endif ?>
	});

	function showMailboxLimitSlider()
	{
		const activeFeaturePromoter = BX.UI.FeaturePromotersRegistry.getPromoter({
			code: 'limit_contact_center_mail_box_number',
		});
		activeFeaturePromoter.show();
	}

		</script>
