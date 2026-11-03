<?php

use Bitrix\Main\Engine\UrlManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Uri;
use Bitrix\Mail\Helper;
use Bitrix\Mail\Helper\Config\Feature;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @global \CMain $APPLICATION */

Loc::loadMessages(dirname(__DIR__) . '/.default/template.php');
Loc::loadMessages(dirname(__DIR__) . '/.default/__body.php');

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens.air',
	'ui.fonts.opensans',
	'ui.icons.b24',
	'ui.alerts',
	'ui.sidepanel.page-swapper',
	'mail.message-body',
	'mail.migration-state',
	'mail.client.action.discuss-in-chat',
	'mail.client.message-view',
]);
if (!empty($arResult['LABELS_ENABLED']))
{
	\Bitrix\Main\UI\Extension::load(['mail.label.view-button']);
}
$bodyClass = $APPLICATION->getPageProperty('BodyClass', false);
$APPLICATION->setPageProperty('BodyClass', trim(sprintf('%s %s', $bodyClass, 'mail-msg-view-frame')));

$emailsLimitToSendMessage = Helper\LicenseManager::getEmailsLimitToSendMessage();

$message = $arResult['MESSAGE'];
$sendError = $arResult['SEND_ERROR'] ?? null;
$renderLabelControl = !empty($arResult['LABELS_ENABLED']);
// The right is asked once per render and closes both surfaces of the screen: the capability map
// of the read shell and the legacy button its delete delegate clicks.
$hasAccessToMessageDelete = Helper\MailAccess::hasUserAccessToMessageDeletion();
$displaySubject = (string)($message['SUBJECT'] ?? '');
if (trim($displaySubject) === '')
{
	$displaySubject = Helper\Message::extractSubjectFromBody((string)($message['BODY'] ?? ''));
	$displaySubject = $displaySubject !== ''
		? $displaySubject
		: (string)Loc::getMessage('MAIL_MESSAGE_EMPTY_SUBJECT_PLACEHOLDER');
}

$source = $_REQUEST['source'] ?? null;
$openedSource = null;
if (is_string($source) && $source !== '')
{
	$openedSource = Helper\AnalyticsHelper::getAnalyticsSourceByType($source) ?? $source;
}

$urlParams = [
	'IFRAME' => $_REQUEST['IFRAME'] ?? null,
	'IFRAME_TYPE' => $_REQUEST['IFRAME_TYPE'] ?? null,
];

if ($openedSource)
{
	$urlParams['source'] = $openedSource;
}

$messageId = (int)($message['ID'] ?? 0);
$mailboxId = (int)($message['MAILBOX_ID'] ?? 0);
$pageSize = (int)($arParams['PAGE_SIZE'] ?? 0);
$isCrmEnabled = ($arResult['CRM_ENABLE'] ?? null) === 'Y';
$isAjaxBody = !empty($message['IS_AJAX_BODY_SANITIZE']);

$messageControlElementId = "mail-msg-view-control-{$messageId}";
$bodyElementId = "mail_msg_{$messageId}_body";
$bodyHostElementId = "mail-msg-view-body-host-{$messageId}";
$fastReplyElementId = "mail-msg-fast-reply-{$messageId}";
$bodyLoaderElementId = "mail-msg-body-loader-{$messageId}";
$warningWaitElementId = "mail-msg-warning-top-wait-{$messageId}";
$warningFailElementId = "mail-msg-warning-top-fail-{$messageId}";
$fileRefreshButtonId = "mail_msg_{$messageId}_refresh_files_button";
$formId = sprintf('mail_msg_reply_%u_form', $messageId);
$formQuoteFieldName = 'data[message]';
$ajaxAttachmentElementId = '';
if (empty($message['__files']) && !empty($message['OPTIONS']['attachments']))
{
	$ajaxAttachmentElementId = 'bx-mail-message-ajax-attachment-' . $messageId;
}

$vueContainerId = "mail-message-view-vue-{$messageId}";
$actionsHostId = "mail-message-view-actions-host-{$messageId}";
$labelsHostId = "mail-message-view-labels-host-{$messageId}";
$attachmentsHostId = "mail-message-view-attachments-host-{$messageId}";
$composeHostId = "mail-message-view-compose-host-{$messageId}";
$iCalHostId = "mail-message-view-ical-host-{$messageId}";

$componentAjaxUrl = sprintf(
	'/bitrix/services/main/ajax.php?c=%s&mode=class',
	rawurlencode($this->__component->getName())
);
$pathNew = (string)(new Uri($arParams['~PATH_TO_MAIL_MSG_NEW']))->addParams($urlParams);
$pathList = (string)\CComponentEngine::makePathFromTemplate(
	$arParams['~PATH_TO_MAIL_MSG_LIST'],
	[
		'id' => $mailboxId,
	]
);
$bodyDownloadLink = (string)UrlManager::getInstance()
	->createByBitrixComponent($this->getComponent(), 'downloadHtmlBody', ['id' => $messageId])
;

$datetimeFormat = \Bitrix\Main\Loader::includeModule('intranet')
	? \CIntranetUtils::getCurrentDatetimeFormat()
	: false
;
$messageDate = $message['INTERNALDATE'] ?? $message['FIELD_DATE'] ?? null;
$messageTimestamp = (
	is_object($messageDate)
	&& method_exists($messageDate, 'getTimestamp')
)
	? (int)$messageDate->getTimestamp()
	: 0
;
$datetimeFormatted = $messageTimestamp > 0
	? \CComponentUtil::getDateTimeFormatted(
		$messageTimestamp + \CTimeZone::getOffset(),
		$datetimeFormat,
		\CTimeZone::getOffset()
	)
	: ''
;
$readDatetime = $message['READ_CONFIRMED'] ?? null;
$readDatetimeFormatted = (
	is_object($readDatetime)
	&& method_exists($readDatetime, 'getTimestamp')
)
	? \CComponentUtil::getDateTimeFormatted(
		$readDatetime->getTimestamp() + \CTimeZone::getOffset(),
		$datetimeFormat,
		\CTimeZone::getOffset()
	)
	: null
;
$deliveryFormatted = (string)Loc::getMessage(
	!empty($message['__is_outcome']) ? 'MAIL_MESSAGE_SENT' : 'MAIL_MESSAGE_RECEIVED',
	['#DATETIME#' => $datetimeFormatted]
);
$readConfirmedFormatted = null;
if (!empty($message['__is_outcome']) && !empty($message['OPTIONS']['trackable']))
{
	$readConfirmedFormatted = (string)Loc::getMessage(
		$readDatetimeFormatted !== null ? 'MAIL_MESSAGE_READ_CONFIRMED' : 'MAIL_MESSAGE_READ_AWAITING',
		['#DATETIME#' => (string)$readDatetimeFormatted]
	);
}
$sentLabel = trim((string)Loc::getMessage('MAIL_MESSAGE_SENT', ['#DATETIME#' => '']));
$receivedLabel = trim((string)Loc::getMessage('MAIL_MESSAGE_RECEIVED', ['#DATETIME#' => '']));
$mailboxAvatar = (array)($arResult['MAILBOX_AVATAR'] ?? []);
$mailboxAvatarUrl = (
	(int)($mailboxAvatar['mailboxId'] ?? 0) === $mailboxId
	&& is_string($mailboxAvatar['url'] ?? null)
	&& $mailboxAvatar['url'] !== ''
)
	? $mailboxAvatar['url']
	: null
;

$createAddressViewModel = static function (
	$addressSource,
	array $avatarParams = [],
	bool $preferContactName = false,
	bool $representsMailbox = false
) use ($message, $arResult, $mailboxAvatarUrl): array
{
	$name = '';
	$email = '';

	if (is_array($addressSource))
	{
		$name = (string)($addressSource['name'] ?? $addressSource['NAME'] ?? '');
		$email = trim((string)($addressSource['email'] ?? $addressSource['EMAIL'] ?? ''));
	}
	else
	{
		$address = new \Bitrix\Main\Mail\Address((string)$addressSource);
		if ($address->validate())
		{
			$name = \Bitrix\Mail\Message::stripQuotes($address->getName());
			$email = trim($address->getEmail());
		}
		else
		{
			$name = (string)$addressSource;
		}
	}

	if ($email !== '' && empty($avatarParams))
	{
		$avatarParams = (array)($arResult['avatarParams'][$email] ?? []);
	}
	$contactName = trim((string)($avatarParams['name'] ?? ''));
	if (
		$preferContactName
		&& $contactName !== ''
		&& ($name === '' || strcasecmp($name, $email) === 0)
	)
	{
		$name = $contactName;
	}
	if ($name === '')
	{
		$name = $email;
	}

	$mailContact = (array)($avatarParams['mailContact'] ?? []);
	$icon = (array)($mailContact['ICON'] ?? []);
	$fileId = (int)($mailContact['FILE_ID'] ?? 0);
	$initials = (string)($icon['INITIALS'] ?? '');
	$color = (string)($icon['COLOR'] ?? '');
	if ($fileId <= 0 && ($initials === '' || $color === ''))
	{
		$fallbackIcon = Helper\MailContact::getIconData($email, $name);
		$initials = $initials !== '' ? $initials : (string)($fallbackIcon['INITIALS'] ?? '');
		$color = $color !== '' ? $color : (string)($fallbackIcon['COLOR'] ?? '');
	}

	// The avatar belongs to the address of the mailbox, so an outgoing letter sent through a personal
	// identity of another address keeps the avatar of that identity.
	$representsMailbox = $representsMailbox
		&& $email !== ''
		&& strcasecmp($email, (string)($message['__email'] ?? '')) === 0
	;
	$image = $representsMailbox ? (string)$mailboxAvatarUrl : '';
	if ($image === '' && $email !== '' && strcasecmp($email, (string)($message['__email'] ?? '')) === 0)
	{
		$image = (string)($arResult['USER_IMAGE'] ?? '');
	}
	if ($image === '')
	{
		$image = (string)($avatarParams['imageUrl'] ?? '');
	}
	if ($image === '' && $fileId > 0)
	{
		$avatarSize = max(1, (int)($avatarParams['avatarSize'] ?? 23));
		$resizedImage = \CFile::resizeImageGet(
			$fileId,
			['width' => $avatarSize, 'height' => $avatarSize],
			BX_RESIZE_IMAGE_EXACT,
			false
		);
		$image = is_array($resizedImage) ? (string)($resizedImage['src'] ?? '') : '';
	}

	return [
		'name' => $name,
		'email' => $email,
		'href' => $email !== '' ? sprintf('mailto:%s', $email) : null,
		'title' => $email !== '' ? $email : $name,
		'isCurrentUser' => $email !== '' && strcasecmp($email, (string)($message['__email'] ?? '')) === 0,
		'avatar' => [
			'image' => $image !== '' ? $image : null,
			'initials' => $initials,
			'color' => $color !== '' ? $color : null,
		],
	];
};

$createAddressListFromField = static function (
	$field,
	bool $containsMailbox
) use ($createAddressViewModel): array
{
	$result = [];
	foreach (Helper\Message::parseAddressList((string)$field) as $item)
	{
		$result[] = $createAddressViewModel($item, [], true, $containsMailbox);
	}

	return $result;
};

$messageFrom = (array)($message['__from'] ?? []);
$sender = reset($messageFrom);
if (!is_array($sender))
{
	$sender = [
		'name' => (string)($message['SENDER_NAME'] ?? ''),
		'email' => (string)($message['SENDER_EMAIL'] ?? ''),
	];
}
$senderEmail = (string)($sender['email'] ?? $message['SENDER_EMAIL'] ?? '');
$senderAvatarParams = (array)($arResult['avatarParams'][$senderEmail] ?? []);
$senderAvatarParams['avatarSize'] = 40;
$senderRepresentsMailbox = !empty($message['__is_outcome']);
$senderAvatar = Feature::isSenderAvatarAvailable()
	? (array)($senderAvatarParams['senderAvatarByMessageId'][$messageId] ?? [])
	: []
;
// The shared photo occupies the single avatar slot, so the level under that slot travels with the model
// whether or not the photo is there yet: a photo deleted or broken in the browser — including one added
// in the same session — leaves what the next build would show, not the initials.
$senderViewModel = $createAddressViewModel($sender, $senderAvatarParams, false, $senderRepresentsMailbox);
$coveredImage = $senderViewModel['avatar']['image'];
if (!empty($senderAvatar['IMAGE_URL']))
{
	$senderAvatarParams['imageUrl'] = (string)$senderAvatar['IMAGE_URL'];
	$senderViewModel = $createAddressViewModel($sender, $senderAvatarParams, false, $senderRepresentsMailbox);
}
$senderViewModel['avatar']['fallbackImage'] = $coveredImage;
if (!empty($senderAvatar['MANAGEMENT']))
{
	$senderViewModel['avatar']['management'] = $senderAvatar['MANAGEMENT'];
}
$hasAttachments = !empty($message['__files']) || !empty($message['OPTIONS']['attachments']);
$logBefore = (array)($arResult['LOG']['B'] ?? []);
$logAfter = (array)($arResult['LOG']['A'] ?? []);
$threadLabelFallbacks = [
	'load' => (string)Loc::getMessage('MAIL_MESSAGE_LOG_MORE'),
	'error' => (string)Loc::getMessage('MAIL_MESSAGE_AJAX_ERROR'),
	'collapse' => (string)Loc::getMessage('MAIL_MESSAGE_COLLAPSE'),
];

$bootstrap = [
	'screen' => [
		'id' => "mail-message-view-{$messageId}",
		'title' => $displaySubject,
		'pageSize' => $pageSize,
		'source' => $openedSource,
		'paths' => [
			'ajaxUrl' => $componentAjaxUrl,
			'messageList' => $pathList,
			'messageNew' => $pathNew,
			'htmlBodyDownload' => $bodyDownloadLink,
		],
		'analytics' => !empty($arResult['ANALYTICS']['SOURCE'])
			? ['source' => (string)$arResult['ANALYTICS']['SOURCE']]
			: null,
	],
	'currentMessage' => [
		'id' => $messageId,
		'mailboxId' => $mailboxId,
		'uidKey' => (string)($arResult['MESSAGE_UID_KEY'] ?? ''),
		'subject' => $displaySubject,
		'sendError' => $sendError instanceof \Bitrix\Main\Error ? $sendError->getMessage() : null,
		'direction' => !empty($message['__is_outcome']) ? 'outgoing' : 'incoming',
		'sender' => $senderViewModel,
		'recipients' => [
			'to' => $createAddressListFromField($message['FIELD_TO'] ?? '', empty($message['__is_outcome'])),
			'cc' => $createAddressListFromField($message['FIELD_CC'] ?? '', empty($message['__is_outcome'])),
			'bcc' => $createAddressListFromField($message['FIELD_BCC'] ?? '', empty($message['__is_outcome'])),
			'replyTo' => $createAddressListFromField($message['FIELD_REPLY_TO'] ?? '', false),
		],
		'labels' => [
			'sender' => (string)Loc::getMessage('MAIL_MESSAGE_NEW_FROM'),
			'to' => (string)Loc::getMessage('MAIL_MESSAGE_RCPT'),
			'cc' => (string)Loc::getMessage('MAIL_MESSAGE_RCPT_CC'),
			'bcc' => (string)Loc::getMessage('MAIL_MESSAGE_RCPT_BCC'),
			'moreRecipients' => (string)Loc::getMessage(
				'MAIL_MESSAGE_RCPT_MORE',
				['#NUM#' => '#NUM#']
			),
			'syncError' => (string)Loc::getMessage('MAIL_MESSAGE_WARNING_SYNC_ERROR'),
			'syncMailbox' => (string)Loc::getMessage(
				'MAIL_MESSAGE_WARNING_GO_TO_MAILBOX',
				['#LINK#' => '#LINK#']
			),
			'senderAvatar' => $senderAvatar['MANAGEMENT']['labels'] ?? null,
		],
		'senderAvatarErrors' => $senderAvatar['MANAGEMENT']['errorMessages'] ?? null,
		'date' => [
			'timestamp' => $messageTimestamp,
			'formatted' => $deliveryFormatted,
			'readConfirmedFormatted' => $readConfirmedFormatted,
		],
		'flags' => [
			'isSpam' => !empty($message['isSpam']),
			'isTrash' => !empty($message['isTrash']),
			'isSyncError' => !empty($message['isSyncError']),
			'isTrackable' => !empty($message['OPTIONS']['trackable']),
			'hideMailControlPanel' => !empty($message['hideMailControlPanel']),
			'hideFastReplyPanel' => !empty($message['hideFastReplyPanel']),
		],
		'mailbox' => isset($message['MAILBOX']['URI'], $message['MAILBOX']['HOST'])
			? [
				'uri' => (string)$message['MAILBOX']['URI'],
				'host' => (string)$message['MAILBOX']['HOST'],
			]
			: null,
	],
	'thread' => [
		'currentMessageId' => $messageId,
		'pageSize' => $pageSize,
		'before' => [
			'code' => 'before',
			'hasMore' => $pageSize > 0 && count($logBefore) >= $pageSize,
			'loadedCount' => count($logBefore),
		],
		'after' => [
			'code' => 'after',
			'hasMore' => $pageSize > 0 && count($logAfter) >= $pageSize,
			'loadedCount' => count($logAfter),
		],
	],
	'capabilities' => [
		'reply' => empty($message['hideMailControlPanel']),
		'replyAll' => empty($message['hideMailControlPanel']),
		'forward' => empty($message['hideMailControlPanel']),
		'more' => empty($message['hideMailControlPanel']),
		'discussInChat' => empty($message['hideMailControlPanel']),
		'assignLabels' => $renderLabelControl,
		'unbind' => ($message['__access_level'] ?? null) === 'full'
			&& $isCrmEnabled
			&& (bool)preg_grep('/CRM_ACTIVITY-\d+/', (array)($message['BIND'] ?? [])),
		'markSpam' => ($message['__access_level'] ?? null) === 'full'
			&& empty($message['__is_outcome'])
			&& empty($message['isSpam']),
		'delete' => ($message['__access_level'] ?? null) === 'full'
			&& $hasAccessToMessageDelete,
		'quickReply' => empty($message['hideFastReplyPanel']),
		'refreshAttachments' => !empty($message['OPTIONS']['attachments']),
		'downloadHtmlBody' => $isAjaxBody,
		'pageSwapper' => true,
		'iCal' => isset($arResult['iCalEvent']),
	],
	'hosts' => [
		'messageBody' => [
			'id' => $bodyHostElementId,
			'enabled' => true,
			'useAjax' => $isAjaxBody,
			'loaderId' => $bodyLoaderElementId,
			'warningWaitId' => $isAjaxBody ? $warningWaitElementId : null,
			'warningFailId' => $isAjaxBody ? $warningFailElementId : null,
			'title' => (string)Loc::getMessage('MAIL_MESSAGE_BODY_TITLE', [
				'#SENDER#' => (string)($sender['name'] ?? $sender['email'] ?? ''),
			]),
			'titleTemplate' => (string)Loc::getMessage('MAIL_MESSAGE_BODY_TITLE'),
			'loaderMaxTime' => (int)(ini_get('max_execution_time') ?: 60),
		],
		'attachments' => [
			'id' => $attachmentsHostId,
			'enabled' => $hasAttachments,
			'ajaxContainerId' => $ajaxAttachmentElementId !== '' ? $ajaxAttachmentElementId : null,
			'refreshButtonId' => $fileRefreshButtonId,
			'hasDeferredContent' => $ajaxAttachmentElementId !== '',
		],
		'actions' => [
			'id' => $actionsHostId,
			'enabled' => empty($message['hideMailControlPanel']),
		],
		'labels' => [
			'id' => $labelsHostId,
			'enabled' => $renderLabelControl || !empty($message['BIND_LINKS']),
		],
		'compose' => [
			'id' => $composeHostId,
			'enabled' => empty($message['hideFastReplyPanel']),
			'formId' => $composeHostId,
			'quickReplyButtonId' => empty($message['hideFastReplyPanel']) ? $fastReplyElementId : null,
			'quoteFieldName' => $formQuoteFieldName,
		],
		'pageSwapper' => [
			'id' => 'header-page-swapper-container',
			'enabled' => true,
		],
		'iCal' => [
			'id' => $iCalHostId,
			'enabled' => isset($arResult['iCalEvent']),
		],
	],
	'domContracts' => [
		'messageUidKey' => (string)($arResult['MESSAGE_UID_KEY'] ?? ''),
		'ids' => [
			'pageTitle' => 'pagetitle',
			'root' => "mail-message-view-root-{$messageId}",
			'currentDetails' => "mail-msg-view-details-{$messageId}",
			'body' => $bodyElementId,
			'navigation' => 'header-page-swapper-container',
			'actions' => $messageControlElementId,
			'quickReply' => $fastReplyElementId,
		],
		'testIds' => [
			'header' => 'mail-message-view-header',
			'title' => 'mail-message-view-title',
			'navigation' => 'mail-message-view-navigation',
			'scrollArea' => 'mail-message-view-scroll-area',
			'root' => 'mail-message-view-root',
			'senderName' => 'mail-message-view-sender-name',
			'senderEmail' => 'mail-message-view-sender-email',
			'recipient' => 'mail-message-view-recipient',
			'recipientEmail' => 'mail-message-view-recipient-email',
			'body' => 'mail-message-view-body',
			'attachment' => 'mail-message-view-attachment',
			'quickReply' => 'mail-message-view-quick-reply',
		],
	],
];

$legacySeedConfig = [
	'messageControlElementId' => $messageControlElementId,
	'bodyElementId' => $bodyElementId,
	'bodyHostElementId' => $bodyHostElementId,
	'fastReplyElementId' => $fastReplyElementId,
	'warningWaitElementId' => $warningWaitElementId,
	'warningFailElementId' => $warningFailElementId,
	'ajaxAttachmentElementId' => $ajaxAttachmentElementId,
	'attachmentsHostId' => $attachmentsHostId,
	'actionsHostId' => $actionsHostId,
	'labelsHostId' => $labelsHostId,
	'composeHostId' => $composeHostId,
	'formId' => $formId,
];

	?>

	<div id="<?= htmlspecialcharsbx($vueContainerId) ?>" class="mail-message-view-container">
	<script>
	BX.ready(function ()
	{
		const containerId = '<?= \CUtil::JSEscape($vueContainerId) ?>';
		const bootstrap = <?= \CUtil::PhpToJSObject($bootstrap) ?>;
		const legacySeeds = <?= \CUtil::PhpToJSObject($legacySeedConfig) ?>;
		const container = document.getElementById(containerId);

		if (!container)
		{
			return;
		}

		const createSeed = function (hostId)
		{
			const seed = document.createElement('div');
			seed.hidden = true;
			seed.setAttribute('data-mail-message-view-seed', hostId);
			container.appendChild(seed);

			return seed;
		};
		const moveNodeToSeed = function (node, hostId)
		{
			if (!node || !hostId)
			{
				return;
			}

			createSeed(hostId).appendChild(node);
		};
		const moveChildrenToSeed = function (node, hostId)
		{
			if (!node || !hostId)
			{
				return;
			}

			const seed = createSeed(hostId);
			while (node.firstChild)
			{
				seed.appendChild(node.firstChild);
			}
		};
		const prepareLegacySeeds = function ()
		{
			const source = container.querySelector('[data-mail-message-view-legacy-source]');
			if (!source)
			{
				return;
			}

			moveNodeToSeed(source.querySelector(`#${legacySeeds.messageControlElementId}`), legacySeeds.actionsHostId);
			moveNodeToSeed(source.querySelector('#mail-msg-additional-block'), legacySeeds.labelsHostId);
			moveNodeToSeed(source.querySelector(`#${legacySeeds.formId}`), legacySeeds.composeHostId);
			moveChildrenToSeed(
				source.querySelector(`#${legacySeeds.fastReplyElementId}`),
				legacySeeds.fastReplyElementId,
			);
			moveChildrenToSeed(
				source.querySelector(`#${legacySeeds.warningWaitElementId}`),
				legacySeeds.warningWaitElementId,
			);
			moveChildrenToSeed(
				source.querySelector(`#${legacySeeds.warningFailElementId}`),
				legacySeeds.warningFailElementId,
			);
			moveNodeToSeed(source.querySelector(`#${legacySeeds.bodyElementId}`), legacySeeds.bodyHostElementId);

			const attachmentBlock = source.querySelector('.mail-msg-view-file-block');
			if (attachmentBlock)
			{
				if (legacySeeds.ajaxAttachmentElementId)
				{
					moveNodeToSeed(
						attachmentBlock.querySelector('.mail-msg-view-file-text'),
						legacySeeds.attachmentsHostId,
					);
					moveChildrenToSeed(
						attachmentBlock.querySelector('.mail-msg-view-file-inner'),
						legacySeeds.ajaxAttachmentElementId,
					);
				}
				else
				{
					moveChildrenToSeed(attachmentBlock, legacySeeds.attachmentsHostId);
				}
			}

			source.remove();
		};
		prepareLegacySeeds();
		const threadLabelFallbacks = <?= \CUtil::PhpToJSObject($threadLabelFallbacks) ?>;
		const getThreadLabel = function (key, fallback)
		{
			const value = BX.message(key);

			return typeof value === 'string' && value !== '' ? value : fallback;
		};
		const threadLabels = {
			beforeSeparator: threadLabelFallbacks.load,
			afterSeparator: threadLabelFallbacks.load,
			loadBefore: threadLabelFallbacks.load,
			loadAfter: threadLabelFallbacks.load,
			loadingBefore: getThreadLabel('JS_CORE_LOADING', threadLabelFallbacks.load),
			loadingAfter: getThreadLabel('JS_CORE_LOADING', threadLabelFallbacks.load),
			errorBefore: threadLabelFallbacks.error,
			errorAfter: threadLabelFallbacks.error,
			retryBefore: getThreadLabel('JS_CORE_RETRY', threadLabelFallbacks.load),
			retryAfter: getThreadLabel('JS_CORE_RETRY', threadLabelFallbacks.load),
			expandItem: threadLabelFallbacks.load,
			collapseItem: threadLabelFallbacks.collapse,
			loadingItem: getThreadLabel('JS_CORE_LOADING', threadLabelFallbacks.load),
			errorItem: threadLabelFallbacks.error,
			retryItem: getThreadLabel('JS_CORE_RETRY', threadLabelFallbacks.load),
		};
		new BX.Mail.Client.MessageView.MessageView({
			containerId,
			bootstrap,
			threadLabels,
			mailUfMessageToken: <?= \CUtil::PhpToJSObject(
				(string)($_REQUEST['mail_uf_message_token'] ?? '')
			) ?>,
		}).start();

		const root = container.querySelector('[data-testid="mail-message-view-root"]');
		if (root)
		{
			root.dataset.sentLabel = '<?= \CUtil::JSEscape($sentLabel) ?>';
			root.dataset.receivedLabel = '<?= \CUtil::JSEscape($receivedLabel) ?>';
		}

		const quickReply = document.getElementById(legacySeeds.fastReplyElementId);
		if (quickReply)
		{
			BX.addClass(quickReply, 'js-msg-view-reply-panel');
			<?php if ($isAjaxBody): ?>
			quickReply.style.display = 'none';
			<?php endif ?>
		}

		BXMailMessageController.init({
			messageId: <?= $messageId ?>,
			ajaxUrl: '<?= \CUtil::JSEscape($componentAjaxUrl) ?>',
			pageSize: <?= $pageSize ?>,
			<? if (isset($_REQUEST['mail_uf_message_token']) && is_string($_REQUEST['mail_uf_message_token'])): ?>
				mail_uf_message_token: '<?=\CUtil::jsEscape($_REQUEST['mail_uf_message_token']) ?>',
			<? endif ?>
			pathNew: '<?= \CUtil::jsEscape($pathNew) ?>',
			pathList: '<?= \CUtil::jsEscape($pathList) ?>',
			scrollable: document.querySelector('.mail-msg-view-scroll-area')
		});

	<?php if (!empty($arResult['LABELS_ENABLED'])): ?>
	BX.Mail.Label.ViewButton.ViewLabelButton.init();
	<?php endif; ?>

	});
	</script>

	<div hidden data-mail-message-view-thread-source="before">
		<?php
		$list = array_reverse($logBefore);
		include dirname(__DIR__) . '/.default/__log.php';
		?>
	</div>

	<div hidden data-mail-message-view-seed="<?= htmlspecialcharsbx($actionsHostId) ?>">
		<?php
		$APPLICATION->includeComponent(
			'bitrix:mail.message.actions',
			'',
			[
				'MESSAGE' => $message,
				'PATH_TO_USER_TASKS_TASK' => $arParams['PATH_TO_USER_TASKS_TASK'],
				'RENDER_TARGET' => 'inline',
			]
		);
		?>
	</div>

	<?php if (isset($arResult['iCalEvent'])): ?>
		<div hidden data-mail-message-view-seed="<?= htmlspecialcharsbx($iCalHostId) ?>">
			<div class="mail-msg-view-header-set ical-event-container">
				<div class="mail-msg-view-header-set-info">
					<div class="mail-msg-view-header-set-icon"></div>
					<div class="mail-msg-view-header-set-param">
						<div class="mail-msg-view-header-set-title">
							<?= Loc::getMessage('MAIL_MESSAGE_ICAL_INVITATION') ?>:
							<?= htmlspecialcharsbx((string)$arResult['iCalEvent']['NAME']) ?>
						</div>
						<div class="mail-msg-view-header-set-prev">
							<?php echo FormatDateFromDB($arResult['iCalEvent']['DATE_FROM'], 'D, d F Y'); ?>
						</div>
					</div>
				</div>
				<div
					class="mail-msg-view-header-set-controls ical-event-control"
					data-messageid="<?= $messageId ?>"
				>
				</div>
			</div>
		</div>
	<?php endif ?>

	<div hidden data-mail-message-view-legacy-source>
		<?php
		$renderVueLegacySeeds = true;
		include __DIR__ . '/__body.php';
		unset($renderVueLegacySeeds);
		?>
	</div>

	<div hidden data-mail-message-view-thread-source="after">
		<?php
		$list = array_reverse($logAfter);
		include dirname(__DIR__) . '/.default/__log.php';
		?>
	</div>
	</div>

<script>

	<?php if (!empty($arResult['ANALYTICS'])): ?>
	(() => {
		const analyticsData = {
			tool: 'mail',
			category: 'mail_operations',
			event: 'mail_view',
			type: 'mail',
			c_section: '<?= \CUtil::JSEscape($arResult['ANALYTICS']['SOURCE']) ?>',
		}

		if (analyticsData.c_section === 'mail')
		{
			const slider = BX.SidePanel.Instance.getTopSlider();
			if (slider)
			{
				const c_sub_section = slider.getData().get('analytics')?.source_dir || null;
				if (c_sub_section)
				{
					analyticsData.c_sub_section = c_sub_section.toLowerCase();
				}
			}
		}

		BX.UI.Analytics.sendData(analyticsData);
	})();
	<?php endif;?>

BX.message({
	EMAILS_LIMIT_TO_SEND_MESSAGE: '<?=$emailsLimitToSendMessage?>',
	// Read by the three entry points into a reply: with the redesign on they open the compose panel
	// instead of the form built into this screen.
	MAIL_COMPOSE_REDESIGN_ENABLED: <?=Helper\Config\Feature::isComposeRedesignAvailable() ? 'true' : 'false' ?>,
	MAIL_MESSAGE_AJAX_ERROR: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_AJAX_ERROR')) ?>',
	MAIL_MESSAGE_NEW_TARIFF_RESTRICTION: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_NEW_TARIFF_RESTRICTION', ['#COUNT#'=> $emailsLimitToSendMessage])) ?>',
	MAIL_MESSAGE_NEW_EMPTY_RCPT: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_NEW_EMPTY_RCPT')) ?>',
	MAIL_MESSAGE_NEW_UPLOADING: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_NEW_UPLOADING')) ?>',
	MAIL_MESSAGE_MAX_SIZE: <?=Helper\Message::getMaxAttachedFilesSize() ?>,
	MAIL_MESSAGE_MAX_SIZE_EXCEED: '<?=\CUtil::jsEscape(Loc::getMessage(
		'MAIL_MESSAGE_MAX_SIZE_EXCEED',
		['#SIZE#' => \CFile::formatSize(Helper\Message::getMaxAttachedFilesSizeAfterEncoding(),1)]
	)) ?>',
	MAIL_MESSAGE_READ_CONFIRMED_SHORT: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_READ_CONFIRMED_SHORT')) ?>',
	MAIL_MESSAGE_DELETE_CONFIRM: '<?=\CUtil::jsEscape(Loc::getMessage('CRM_ACT_EMAIL_DELETE_CONFIRM')) ?>',
	MAIL_MESSAGE_SPAM_CONFIRM: '<?=\CUtil::jsEscape(Loc::getMessage('CRM_ACT_EMAIL_SPAM_CONFIRM')) ?>',
	MAIL_MESSAGE_LIST_CONFIRM_DELETE: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE')) ?>',
	MAIL_MESSAGE_LIST_CONFIRM_DELETE_BTN: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_DELETE_BTN')) ?>',
	MAIL_MESSAGE_LIST_CONFIRM_TITLE: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_TITLE')) ?>',
	MAIL_MESSAGE_LIST_CONFIRM_CANCEL_BTN: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_CONFIRM_CANCEL_BTN')) ?>',
	MAIL_MESSAGE_SEND_SUCCESS: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_SEND_SUCCESS')) ?>',
	MAIL_MESSAGE_LIST_NOTIFY_ADDED_TO_CRM: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADDED_TO_CRM')) ?>',
	MAIL_MESSAGE_LIST_NOTIFY_ADD_TO_CRM_ERROR: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_ADD_TO_CRM_ERROR')) ?>',
	MAIL_MESSAGE_LIST_NOTIFY_EXCLUDED_FROM_CRM: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_LIST_NOTIFY_EXCLUDED_FROM_CRM')) ?>',
	MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT')) ?>',
	MAIL_MESSAGE_ICAL_NOTIFY_REJECT: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ICAL_NOTIFY_REJECT')) ?>',
	MAIL_MESSAGE_ICAL_NOTIFY_ERROR: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_ICAL_NOTIFY_ERROR')) ?>'
});

BX.bindDelegate(document.body, 'click', {className: 'ical-event-control-button'}, function ()
{
	var messageId = this.parentNode.dataset.messageid;
	var action = this.dataset.action;
	var button = this;

	button.classList.add('ui-btn-wait');

	BX.ajax.runComponentAction('bitrix:mail.client', 'ical', {
		mode: 'ajax',
		data: {messageId, action}
	}).then(
		function ()
		{
			button.classList.remove('ui-btn-wait');
			notify(BX.message(action === 'cancelled' ? 'MAIL_MESSAGE_ICAL_NOTIFY_REJECT' : 'MAIL_MESSAGE_ICAL_NOTIFY_ACCEPT'));
		},
		function ()
		{
			button.classList.remove('ui-btn-wait');
			notify(BX.message('MAIL_MESSAGE_ICAL_NOTIFY_ERROR'));
		}
	);
});

function notify(message)
{
	top.BX.UI.Notification.Center.notify({
		autoHideDelay: 2000,
		content: message
	});
}

</script>
