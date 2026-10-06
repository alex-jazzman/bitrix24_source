<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Mail\Helper;
use Bitrix\Mail\Message;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @global \CMain $APPLICATION */
/** @global \CUser $USER */
/** @var \CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var \CMailClientMessageNewComponent $component */

\Bitrix\Main\Loader::includeModule('ui');
\Bitrix\UI\Toolbar\Facade\Toolbar::deleteFavoriteStar();

\Bitrix\Main\UI\Extension::load([
	'ui.design-tokens',
	'ui.fonts.opensans',
	'ui.notification',
	'pull.client',
	'mail.migration-state',
]);
if ($arResult['LARGE_ATTACHMENT_LOCAL_FEATURE_AVAILABLE'])
{
	\Bitrix\Main\UI\Extension::load('mail.client.large-attachment');
}

if ($arResult['DRAFT_AVAILABLE'])
{
	\Bitrix\Main\UI\Extension::load('mail.draft');
}

if ($arResult['TO_PLUG_EXTENSION_SALES_LETTER_TEMPLATE'])
{
	\Bitrix\Main\UI\Extension::load('mail.saleslettertemplate');
}

$APPLICATION->setTitle(Loc::getMessage('MAIL_NEW_MESSAGE_TITLE'));
\Bitrix\UI\Toolbar\Facade\Toolbar::addBeforeTitleHtml('
	<div class="mail-message-new-head">
		<span class="mail-msg-title-icon mail-msg-title-icon-outcome"></span>
	</div>'
);

$emailsLimitToSendMessage = Helper\LicenseManager::getEmailsLimitToSendMessage();
$message = $arResult['MESSAGE'];
$mailboxId = (int)($message['MAILBOX_ID'] ?? 0);
$migrationWatchMailboxIds = [];
// SenderProvider survives a main without getUserAvailableSenderIdentities() by falling back
// to the legacy sender list; a direct call here was a fatal on such portals.
$currentUserId = (int)\Bitrix\Main\Engine\CurrentUser::get()->getId();
foreach (\Bitrix\Mail\Integration\Main\SenderProvider::getAvailableSenders($currentUserId) as $sender)
{
	$senderMailboxId = (int)($sender['mailboxId'] ?? 0);
	if ($senderMailboxId > 0)
	{
		$migrationWatchMailboxIds[$senderMailboxId] = $senderMailboxId;
	}
}

if ($mailboxId > 0)
{
	$migrationWatchMailboxIds[$mailboxId] = $mailboxId;
}

if ($migrationWatchMailboxIds !== [] && \Bitrix\Main\Loader::includeModule('pull'))
{
	global $USER;
	foreach ($migrationWatchMailboxIds as $watchMailboxId)
	{
		\CPullWatch::add((int)$USER->getId(), 'mail_mailbox_' . $watchMailboxId);
	}
}

$analyticsElement = 'compose_button';
if (isset($message['__type']))
{
	if ($message['__type'] === 'forward')
	{
		$analyticsElement = 'forward';
	}
	elseif ($message['__type'] === 'reply')
	{
		$analyticsElement = 'reply';
	}
}
?>

<div class="mail-msg-view-wrapper">
	<div data-id="<?=intval($message['ID'])?>" id="mail-msg-view-details-<?=intval($message['ID'])?>">
		<?

		$formId = 'mail_msg_new_form';
		// main.mail.form (included below) registers the disk uploader control under 'main_mail_form_' . FORM_ID.
		$uploaderControlId = 'main_mail_form_' . $formId;
		$actionUrl = '/bitrix/services/main/ajax.php?c=bitrix%3Amail.client&action=sendMessage&mode=ajax';

		?>
		<form
			id="<?=htmlspecialcharsbx($formId)?>"
			action="<?=$actionUrl?>"
			method="POST"
			data-testid="mail-large-attachment-form"
		>
			<?=bitrix_sessid_post()?>
			<input
				type="hidden"
				name="data[draftId]"
				value="<?= (int)$arResult['DRAFT_ID'] ?>"
				data-role="mail-draft-id"
			>
			<input
				type="hidden"
				name="data[draftRevision]"
				value=""
				data-role="mail-draft-revision"
			>
			<? if ('reply' == $message['__type'] && $message['__parent'] > 0): ?>
				<input type="hidden" name="data[IN_REPLY_TO]" value="<?=htmlspecialcharsbx($message['MSG_ID'])?>">
				<input type="hidden" name="data[MAILBOX_ID]" value="<?=$message['MAILBOX_ID']?>">
			<? endif ?>
			<?

			$messageSanitized = true;
			if ($message['__parent'] > 0 && trim($message['BODY_HTML']))
			{
				$messageHtml = (new Bitrix\Mail\Helper\Cache\SanitizedBodyCache())->get($message['__parent']);
				if (!$messageHtml)
				{
					$messageHtml = $message['BODY_HTML'];
					$messageSanitized = false;
				}
			}
			else
			{
				$messageHtml = preg_replace('/(\s*(\r\n|\n|\r))+/', '<br>', htmlspecialcharsbx($message['BODY']));
			}

			$inlineFiles = [];
			preg_replace_callback(
				'#(\?|&)__bxacid=(n?\d+)#i',
				function($matches) use (&$inlineFiles) {
					$inlineFiles[] = $matches[2];

					return $matches[0];
				},
				$messageHtml
			);
			$messageQuote = Message::wrapTheMessageWithAQuote(
				$messageHtml,
				$message['ORIGINAL_SUBJECT'] ?? $message['SUBJECT'],
				$message['INTERNALDATE'] ?? $message['FIELD_DATE'],
				$message['__from'],
				$message['__to'],
				$message['__cc'],
				$messageSanitized,
			);

			$attachedFiles = [];
			foreach ((array)$message['__files'] as $item)
			{
				if (preg_match('/^n\d+$/i', $item['id']))
				{
					$attachedFiles[] = $item['id'];
				}
			}

			if ('reply' == $message['__type'] && $message['__parent'] > 0)
			{
				$attachedFiles = array_intersect($attachedFiles, $inlineFiles);
			}

			$APPLICATION->includeComponent(
				'bitrix:main.mail.form',
				'',
				[
					'VERSION' => 2,
					'FORM_ID' => $formId,
					'LAYOUT_ONLY' => true,
					'SUBMIT_AJAX' => true,
					'FOLD_QUOTE' => !empty($message['MSG_ID']),
					'FOLD_FILES' => !empty($message['MSG_ID']),
					'EDITOR_TOOLBAR' => true,
					'USE_SIGNATURES' => true,
					'USE_CALENDAR_SHARING' => true,
					'COPILOT_PARAMS' => $arResult['COPILOT_PARAMS'],
					'CONTEXT_NAME' => 'MAIL',
					'DRAFT_CLIENT_ID' => $arResult['DRAFT_CLIENT_ID'],
					'DRAFT_MODE' => $arResult['DRAFT_MODE'],
					'DRAFT_PARENT_MESSAGE_ID' => $arResult['DRAFT_PARENT_MESSAGE_ID'],
					'DRAFT_LOADING' => $arResult['DRAFT_ID'] > 0,
					'SELECTED_RECIPIENTS_JSON' => Message::getSelectedRecipientsForDialog($message['__rcpt'], true)->toJsObject(),
					'FIELDS' => [
						[
							'name' => 'data[from]',
							'senderIdName' => 'data[SENDER_ID]',
							'mailboxIdName' => 'data[SENDER_MAILBOX_ID]',
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_FROM'),
							'type' => 'from',
							'value' => $message['__email'],
							'mailboxId' => (int)($message['MAILBOX_ID'] ?? 0) ?: null,
							'isFormatted' => true,
							'required' => true,
						],
						[
							'type' => 'separator',
						],
						[
							'name' => 'data[to]',
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_TO'),
							'placeholder' => Loc::getMessage('MAIL_MESSAGE_NEW_ADD_RCPT'),
							'type' => 'rcpt',
							'required' => true,
						],
						[
							'name' => 'data[cc]',
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_CC'),
							'placeholder' => Loc::getMessage('MAIL_MESSAGE_NEW_ADD_RCPT'),
							'type' => 'rcpt',
							'folded' => false,
						],
						[
							'name' => 'data[bcc]',
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_BCC'),
							'placeholder' => Loc::getMessage('MAIL_MESSAGE_NEW_ADD_RCPT'),
							'type' => 'rcpt',
							'folded' => true,
						],
						[
							'name' => 'data[subject]',
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_SUBJECT'),
							'placeholder' => Loc::getMessage('MAIL_MESSAGE_NEW_SUBJECT_PH'),
							'value' => $message['SUBJECT'],
						],
						[
							'name' => 'data[message]',
							'type' => 'editor',
							'value' => !empty($message['MSG_ID']) ? $messageQuote : '',
						],
						[
							'name' => 'data[__diskfiles]',
							'type' => 'files',
							'value' => $attachedFiles,
						],
					],
					'BUTTONS' => [
						'submit' => [
							'class' => 'ui-btn-primary',
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_SEND'),
						],
						'cancel' => [
							'title' => Loc::getMessage('MAIL_MESSAGE_NEW_CANCEL'),
						],
					],
				]
			);

			?>

		</form>

	</div>
</div>

<script>

	BX.message({
		EMAILS_LIMIT_TO_SEND_MESSAGE: '<?=$emailsLimitToSendMessage?>',
		MAIL_MESSAGE_AJAX_ERROR: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_AJAX_ERROR')) ?>',
		MAIL_MESSAGE_NEW_EMPTY_RCPT: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_NEW_EMPTY_RCPT')) ?>',
		MAIL_MESSAGE_NEW_TARIFF_RESTRICTION: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_NEW_TARIFF_RESTRICTION', ['#COUNT#'=> $emailsLimitToSendMessage])) ?>',
		MAIL_MESSAGE_NEW_UPLOADING: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_NEW_UPLOADING')) ?>',
		MAIL_MESSAGE_MAX_SIZE: <?=Helper\Message::getMaxAttachedFilesSize()?>,
		MAIL_MESSAGE_MAX_SIZE_EXCEED: '<?=\CUtil::jsEscape(
			Loc::getMessage(
				'MAIL_MESSAGE_MAX_SIZE_EXCEED',
				['#SIZE#' => \CFile::formatSize(Helper\Message::getMaxAttachedFilesSizeAfterEncoding(),1)]
			)
		) ?>',
		MAIL_MESSAGE_SEND_SUCCESS: '<?=\CUtil::jsEscape(Loc::getMessage('MAIL_MESSAGE_SEND_SUCCESS')) ?>',
	});

	BX.ready(function() {
		BXMailMessageController.init({
			messageId: <?=intval($message['ID']) ?>,
			type: 'edit',
			pathList: '<?=\CUtil::jsEscape(
				\CComponentEngine::makePathFromTemplate(
					$message['MAILBOX_ID'] > 0 ? $arParams['~PATH_TO_MAIL_MSG_LIST'] : $arParams['~PATH_TO_MAIL_HOME'],
					[
						'id' => $message['MAILBOX_ID'],
					]
				)
			) ?>',
		});

		new BXMailMessage({
			messageId: <?=intval($message['ID']) ?>,
			formId: '<?=\CUtil::jsEscape($formId) ?>',
		});

		var mailForm = BXMainMailForm.getForm('<?=\CUtil::jsEscape($formId) ?>');
		mailForm.init();
		var draftBootstrapPromise = Promise.resolve();

		<?php if ($arResult['DRAFT_AVAILABLE']): ?>
		var draftIdNode = mailForm.htmlForm
			? mailForm.htmlForm.querySelector('[data-role="mail-draft-id"]')
			: null;
		var draftRevisionNode = mailForm.htmlForm
			? mailForm.htmlForm.querySelector('[data-role="mail-draft-revision"]')
			: null;
		draftBootstrapPromise = BX.Mail.Draft.bootstrapMailDraft({
			form: mailForm,
			clientId: '<?= \CUtil::JSEscape($arResult['DRAFT_CLIENT_ID']) ?>',
			draftId: <?= (int)$arResult['DRAFT_ID'] ?> || null,
			onDraftIdChange: function(draftId, revision)
			{
				if (draftIdNode)
				{
					draftIdNode.value = draftId;
				}
				if (draftRevisionNode)
				{
					draftRevisionNode.value = revision;
				}
			},
		}).then(function(coordinator)
		{
			mailForm.__draftCoordinator = coordinator;
		}).catch(function()
		{
			var wasRestoring = draftIdNode && parseInt(draftIdNode.value, 10) > 0;
			if (draftIdNode)
			{
				// keep submit from completing a draft whose content was never restored
				draftIdNode.value = '';
			}
			if (draftRevisionNode)
			{
				draftRevisionNode.value = '';
			}
			mailForm.showError(BX.Loc.getMessage(wasRestoring ? 'MAIL_DRAFT_RESTORE_ERROR' : 'MAIL_DRAFT_SAVE_ERROR'));
			if (wasRestoring)
			{
				mailForm.setDraftLoading(true);
			}
		});
		<?php endif ?>

		BX.message({
			MAIL_LARGE_ATTACHMENT_LOCAL_FEATURE_AVAILABLE:
				<?=$arResult['LARGE_ATTACHMENT_LOCAL_FEATURE_AVAILABLE'] ? 'true' : 'false' ?>,
		});
		<?php if ($arResult['LARGE_ATTACHMENT_LOCAL_FEATURE_AVAILABLE']): ?>
		draftBootstrapPromise.then(function()
		{
			BX.Mail.Client.LargeAttachment.init({
				formId: '<?=\CUtil::jsEscape($formId) ?>',
				uploaderControlId: '<?=\CUtil::jsEscape($uploaderControlId) ?>',
				messageId: <?=intval($message['ID']) ?>,
				mailboxId: <?=(int)($message['MAILBOX_ID'] ?? 0) > 0 ? (int)$message['MAILBOX_ID'] : 'null' ?>,
				featureAvailable: <?=$arResult['LARGE_ATTACHMENT_FEATURE_AVAILABLE'] ? 'true' : 'false' ?>,
				folderName: '',
				maxSize: Number(BX.message('MAIL_MESSAGE_MAX_SIZE')),
				showAha: <?=$arResult['LARGE_ATTACHMENT_SHOW_AHA'] ? 'true' : 'false' ?>,
				ahaOptionName: '<?=\CUtil::jsEscape($arResult['LARGE_ATTACHMENT_AHA_OPTION_NAME'] ?? '') ?>',
				postSendPromptSuppressed: <?=$arResult['LARGE_ATTACHMENT_POST_SEND_SUPPRESSED'] ? 'true' : 'false' ?>,
				postSendPromptOptionName: '<?=\CUtil::jsEscape($arResult['LARGE_ATTACHMENT_POST_SEND_OPTION_NAME'] ?? '') ?>',
				draftLargeAttachments: mailForm.__draftLargeAttachments || [],
			});
		});
		<?php endif ?>

		(function() {
			const formId = '<?= \CUtil::jsEscape($formId) ?>';
			const form = document.getElementById(formId);
			if (!form)
			{
				return;
			}

			const sendButton = form.querySelector('.main-mail-form-submit-button');

			if (sendButton)
			{
				const initiallyDisabled = sendButton.disabled === true;
				const initialTitle = sendButton.getAttribute('title');
				let migrationActive = false;
				let unsubscribeMigration = null;
				let selectionRevision = 0;
				const setMigrationActive = function(active)
				{
					migrationActive = active === true;
					sendButton.disabled = migrationActive || initiallyDisabled;
					if (migrationActive)
					{
						sendButton.setAttribute('title', BX.Loc.getMessage('MAIL_MIGRATION_SEND_UNAVAILABLE') || '');
					}
					else if (initialTitle === null)
					{
						sendButton.removeAttribute('title');
					}
					else
					{
						sendButton.setAttribute('title', initialTitle);
					}
				};

				const subscribeToSelectedMailbox = function()
				{
					selectionRevision++;
					const revision = selectionRevision;
					if (unsubscribeMigration)
					{
						unsubscribeMigration();
						unsubscribeMigration = null;
					}

					const mailboxInput = form.querySelector('[name="data[SENDER_MAILBOX_ID]"]');
					const mailboxId = Number(mailboxInput && !mailboxInput.disabled ? mailboxInput.value : 0);
					if (!Number.isInteger(mailboxId) || mailboxId <= 0)
					{
						setMigrationActive(false);

						return;
					}
					if (!BX.Mail || !BX.Mail.getMigrationState)
					{
						setMigrationActive(true);

						return;
					}

					// A local sender stays unavailable until its migration status is read successfully.
					setMigrationActive(true);
					const migrationState = BX.Mail.getMigrationState(mailboxId);
					unsubscribeMigration = migrationState.subscribe(function(change) {
						if (revision === selectionRevision)
						{
							setMigrationActive(change.active);
						}
					});
					migrationState.initialize().then(function() {
						if (revision === selectionRevision && migrationState.isInitialized())
						{
							setMigrationActive(migrationState.isActive());
						}
					});
				};

				BX.addCustomEvent(mailForm, 'MailForm::from::change', subscribeToSelectedMailbox);
				subscribeToSelectedMailbox();

				form.addEventListener('submit', function(event) {
					if (!migrationActive)
					{
						return;
					}

					event.preventDefault();
					event.stopImmediatePropagation();
					BX.UI.Notification.Center.notify({
						content: BX.Loc.getMessage('MAIL_MIGRATION_SEND_UNAVAILABLE'),
					});
				}, true);

				BX.bind(sendButton, 'click', function() {
					BX.UI.Analytics.sendData({
						tool: 'mail',
						event: 'mail_send',
						category: 'mail_operations',
						type: 'mail',
						c_section: '<?= \CUtil::JSEscape($arResult['ANALYTICS']['SOURCE'] ?? 'mail') ?>',
						c_element: '<?= \CUtil::JSEscape($analyticsElement) ?>'
					});
				});
			}
		})();

	});

</script>
