<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Bitrix24\MailCounter;
use Bitrix\Mail;
use Bitrix\Mail\Helper\MailboxAccess;
use Bitrix\Mail\Helper\Message;
use Bitrix\Mail\Integration\Calendar\ICal\ICalMailManager;
use Bitrix\Mail\Integration\Intranet\Secretary;
use Bitrix\Mail\Internal\Service\MailTemplate\ComposedMessageTemplateSaver;
use Bitrix\Mail\Internal\Service\Signature\Image\SignatureImageSendPreparation;
use Bitrix\Mail\Internal\Service\SourceGeneration\MigrationActionGuard;
use Bitrix\Mail\Internals\MessageAccessTable;
use Bitrix\Mail\MailboxTable;
use Bitrix\Mail\MailMessageTable;
use Bitrix\Mail\Public\Service\LargeAttachment\Dto\SendContractResult;
use Bitrix\Mail\Public\Service\LargeAttachment\SendContractValidator;
use Bitrix\Mail\Service\Message\AttachmentContentId;
use Bitrix\Mail\Service\Message\SendFailure;
use Bitrix\Mail\Service\Message\SendMessageCommand;
use Bitrix\Mail\Service\Message\SendMessageService;
use Bitrix\Main;
use Bitrix\Main\Context;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Mail\Helper;
use Bitrix\Main\Mail\Sender;
use Bitrix\Main\Mail\SenderSendCounter;

Loader::includeModule('mail');
Loc::loadLanguageFile(__FILE__);
Loc::loadMessages(__DIR__ . '/../mail.client/class.php');

class CMailClientAjaxController extends \Bitrix\Main\Engine\Controller
{
	/** @var bool */
	private $isCrmEnable = false;
	private const CRM_TYPES = [
		'contact',
		'company',
		'lead',
	];
	public const ERROR_LARGE_ATTACHMENT_INVALID_SEND_CONTRACT = SendContractValidator::ERROR_INVALID_SEND_CONTRACT;
	public const ERROR_LARGE_ATTACHMENT_LINK_MISSING = SendContractValidator::ERROR_LINK_MISSING;

	/**
	 * Phrase for every refusal owned by the send service. Errors received from a transport already carry
	 * user-facing messages and pass through unchanged.
	 */
	private const SEND_ERROR_PHRASE = [
		SendMessageService::ERROR_INVALID_AUTHOR => 'MAIL_MESSAGE_SEND_INVALID_AUTHOR',
		SendMessageService::ERROR_INVALID_SENDER => 'MAIL_MESSAGE_BAD_SENDER',
		SendMessageService::ERROR_EMPTY_RECIPIENTS => 'MAIL_MESSAGE_EMPTY_RCPT',
		SendMessageService::ERROR_TOO_MANY_RECIPIENTS => 'MAIL_MESSAGE_TO_MANY_RECIPIENTS',
		SendMessageService::ERROR_INVALID_HEADER => 'MAIL_MESSAGE_SEND_INVALID_HEADER',
		SendMessageService::ERROR_SEND_FAILED => 'MAIL_MESSAGE_SEND_ERROR',
	];
	/**
	 * Initializes controller.
	 * @return void
	 */
	protected function init()
	{
		parent::init();

		$this->isCrmEnable = MailboxAccess::hasCurrentUserAccessToEditMailboxIntegrationCrm();
	}


	/**
	 * Common operations before process action.
	 *
	 * @param \Bitrix\Main\Engine\Action $action Action.
	 *
	 * @return bool If method will return false, then action will not execute.
	 * @throws Main\LoaderException
	 */
	protected function processBeforeAction(\Bitrix\Main\Engine\Action $action)
	{
		if (parent::processBeforeAction($action))
		{
			if ($action->getName() === 'sendMessage')
			{
				$data = $this->request->getPost('data');
				if (empty($data))
				{
					$this->addError(new Error('Source data are not found'));
				}
			}
		}

		return (count($this->getErrors()) === 0);
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::moveToFolderAction
	 */
	public function moveToFolderAction($ids, $folder)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::moveToFolder($ids, $folder, $this->getCurrentUser()->getId());

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::markAsSpamAction
	 */
	public function markAsUnseenAction(array $ids)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::markAsUnseen($ids);

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::markAsSpamAction
	 */
	public function markAsSeenAction($ids)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::markAsSeen($ids);

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::markAsSpamAction
	 */
	public function restoreFromSpamAction($ids)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::markAsSpam($ids, $this->getCurrentUser()->getId());

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::markAsSpamAction
	 */
	public function markAsSpamAction($ids)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::markAsSpam($ids, $this->getCurrentUser()->getId());

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::deleteAction
	 */
	public function deleteAction($ids, $deleteImmediately = false)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::delete($ids, $deleteImmediately);

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * Generates message Id.
	 * @param string $hostname
	 *
	 * @return string
	 */
	private function generateMessageId($hostname)
	{
		// @TODO: more entropy
		return sprintf(
			'<bx.mail.%x.%x@%s>',
			time(),
			rand(0, 0xffffff),
			$hostname
		);
	}

	/**
	 * Gets host name.
	 *
	 * @return string
	 */
	private function getHostname()
	{
		static $hostname;
		if (empty($hostname))
		{
			$hostname = \COption::getOptionString('main', 'server_name', '') ?: 'localhost';
			if (defined('BX24_HOST_NAME') && BX24_HOST_NAME != '')
			{
				$hostname = BX24_HOST_NAME;
			}
			elseif (defined('SITE_SERVER_NAME') && SITE_SERVER_NAME != '')
			{
				$hostname = SITE_SERVER_NAME;
			}
		}

		return $hostname;
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\MailboxConnecting::syncMailbox
	 */
	public function syncMailboxAction($id, $dir = null, $onlySyncCurrent = false)
	{
		if (!MailboxAccess::hasCurrentUserAnyAccessToMailbox((int)$id))
		{
			$this->addError(new Error('Access to the mailbox is denied', 403));

			return [];
		}

		$guard = (new MigrationActionGuard())->check((int)$id);
		if (!$guard->isSuccess())
		{
			$this->addErrors($guard->getErrors());

			return [];
		}

		$result = \Bitrix\Mail\Helper\Mailbox::quickSync($id, $dir, $onlySyncCurrent);
		$this->errorCollection = $result->getErrorCollection();

		return $result->getData();
	}

	/**
	 * Sends email.
	 *
	 * @param array $data
	 *
	 * @return array|null
	 *
	 * @throws Exception
	 * @throws Main\NotImplementedException
	 * @throws Main\SystemException
	 */
	public function sendMessageAction($data)
	{
		$userId = (int)$this->getCurrentUser()?->getId();
		if (!$userId)
		{
			$this->addError(new Error('Current user is not found'));

			return;
		}

		$contextMailboxId = (int)($data['MAILBOX_ID'] ?? 0);
		if ($contextMailboxId > 0)
		{
			$guard = (new MigrationActionGuard())->check($contextMailboxId);
			if (!$guard->isSuccess())
			{
				$this->addErrors($guard->getErrors());

				return;
			}
		}

		$rawData = (array) \Bitrix\Main\Application::getInstance()->getContext()->getRequest()->getPostList()->getRaw('data');

		$decodedData = $rawData;

		$hostname = $this->getHostname();

		$fromEmail = $decodedData['from'];
		$fromAddress = new \Bitrix\Main\Mail\Address($fromEmail);
		$responsibleId = $this->getCurrentUser()->getId();

		if ($fromAddress->validate())
		{
			$fromEmail = $fromAddress->getEmail();

			\CBitrixComponent::includeComponentClass('bitrix:main.mail.confirm');
			$availableSenders = \MainMailConfirmComponent::prepareMailboxes();
			if (!in_array($fromEmail, array_column($availableSenders, 'email')))
			{
				$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_MESSAGE_BAD_SENDER'));

				return;
			}

			if ($fromAddress->getName())
			{
				$fromEncoded = sprintf(
					'%s <%s>',
					sprintf('=?%s?B?%s?=', SITE_CHARSET, base64_encode($fromAddress->getName())),
					$fromEmail
				);
			}
		}
		else
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage(
				empty($fromEmail) ? 'MAIL_MESSAGE_EMPTY_SENDER' : 'MAIL_MESSAGE_BAD_SENDER'
			));

			return;
		}

		$to  = array();
		$cc  = array();
		$bcc = array();
		$toEncoded = array();
		$ccEncoded = array();
		$bccEncoded = array();

		if ($this->isCrmEnable)
		{
			$crmCommunication = array();
		}

		foreach (array('to', 'cc', 'bcc') as $field)
		{
			if (!empty($rawData[$field]) && is_array($rawData[$field]))
			{
				$addressList = array();
				foreach ($rawData[$field] as $item)
				{
					try
					{
						$item = \Bitrix\Main\Web\Json::decode($item);

						$address = new Bitrix\Main\Mail\Address();
						$address->setEmail($item['email']);
						$address->setName(htmlspecialcharsBack($item['name']));

						if ($address->validate())
						{
							$fieldEncoded = $field.'Encoded';

							if ($address->getName())
							{
								${$field}[] = $address->get();
								${$fieldEncoded}[] = $address->getEncoded();
							}
							else
							{
								${$field}[] = $address->getEmail();
								${$fieldEncoded}[] = $address->getEmail();
							}

							$addressList[] = $address;

							if ($this->isCrmEnable)
							{
								if (isset($item['entityType']))
								{
									if (in_array($item['entityType'], self::CRM_TYPES, true))
									{
										$crmCommunication[] = $item;
									}
								}
							}
						}
					}
					catch (\Exception $e)
					{
					}
				}

				if (count($addressList) > 0)
				{
					$this->appendMailContacts($addressList, $field);
				}
			}
		}

		$to  = array_unique($to);
		$cc  = array_unique($cc);
		$bcc = array_unique($bcc);
		$toEncoded = array_unique($toEncoded);
		$ccEncoded = array_unique($ccEncoded);
		$bccEncoded = array_unique($bccEncoded);

		$emailsLimitToSendMessage = Helper\LicenseManager::getEmailsLimitToSendMessage();

		if($emailsLimitToSendMessage !== -1 && (count($to) > $emailsLimitToSendMessage || count($cc) > $emailsLimitToSendMessage || count($bcc) > $emailsLimitToSendMessage))
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_MESSAGE_NEW_TARIFF_RESTRICTION', ['#COUNT#'=> $emailsLimitToSendMessage]));
			return;
		}

		$recipientsTotalLimit = Helper\LicenseManager::getMessageRecipientsTotalLimit();
		if (count($to) + count($cc) + count($bcc) > $recipientsTotalLimit)
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(
				Loc::getMessage(
					'MAIL_MESSAGE_TO_MANY_RECIPIENTS',
					['#COUNT#' => $recipientsTotalLimit],
				),
				'recipient_limit',
			);
			return;
		}

		if (empty($to))
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_MESSAGE_EMPTY_RCPT'));
			return;
		}

		$totalRecipientsCount = count($to) + count($cc) + count($bcc);
		$hasExactSenderSelection = array_key_exists('SENDER_ID', $data)
			|| array_key_exists('SENDER_MAILBOX_ID', $data)
		;
		$exactAvailableSenders = $availableSenders;
		// The identities API may be absent on an older main; without it the exact-selection
		// refinement is skipped and the identity below resolves the guarded way.
		if (
			$hasExactSenderSelection
			&& method_exists(Sender\UserSenderDataProvider::class, 'getUserAvailableSenderIdentities')
		)
		{
			$normalizedFromEmail = mb_strtolower((string)$fromEmail);
			$exactAvailableSenders = array_values(array_filter(
				Sender\UserSenderDataProvider::getUserAvailableSenderIdentities($userId),
				static fn(array $sender): bool =>
					mb_strtolower((string)($sender['email'] ?? '')) === $normalizedFromEmail,
			));
		}

		$senderIdentity = $this->resolveSenderIdentity(
			(int)($data['MAILBOX_ID'] ?? 0),
			array_key_exists('SENDER_ID', $data) ? (int)$data['SENDER_ID'] : null,
			$exactAvailableSenders,
			(string)$fromEmail,
			$this->getAvailableMailboxSenders($userId, (string)$fromEmail),
			array_key_exists('SENDER_MAILBOX_ID', $data) ? (int)$data['SENDER_MAILBOX_ID'] : null,
		);
		if (
			class_exists(Sender\Identity::class)
			&& $hasExactSenderSelection
			&& $senderIdentity === null
		)
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_MESSAGE_BAD_SENDER'));

			return;
		}

		$senderAddressMismatch = $this->findSenderAddressMismatch((string)$fromEmail, $senderIdentity);
		if ($senderAddressMismatch !== null)
		{
			$this->errorCollection[] = $senderAddressMismatch;

			return;
		}

		if ($this->isSenderLimitReached((string)$fromEmail, $totalRecipientsCount, $senderIdentity))
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_CLIENT_DAILY_SENDER_LIMIT_REACHED'));

			return;
		}

		if ($this->isDailyPortalLimitReached($totalRecipientsCount))
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_CLIENT_DAILY_PORTAL_LIMIT_REACHED'));

			return;
		}

		if ($this->isMonthPortalLimitReached($totalRecipientsCount))
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_CLIENT_MONTH_PORTAL_LIMIT_REACHED'));

			return;
		}


		$messageBody = (string) $decodedData['message'];
		$messageBodyHtml = '';
		$signatureImagePreparation = new SignatureImageSendPreparation();
		if (!empty($messageBody))
		{
			$messageBody = $signatureImagePreparation->sanitizeHtml($messageBody);
			$messageBodyHtml = $messageBody;
		}

		$signatureImageResult = $signatureImagePreparation->prepare(
			$messageBodyHtml,
			$userId,
			$hostname,
		);
		if (!$signatureImageResult->isSuccess())
		{
			foreach ($signatureImageResult->getErrors() as $error)
			{
				$this->errorCollection[] = new Error(
					(string)Loc::getMessage('MAIL_MESSAGE_SEND_ERROR'),
					$error->getCode(),
				);
			}

			return;
		}

		/*
		 * The body a template keeps is the letter as its author wrote it: below, the transport turns the
		 * images of the signature into `cid:` parts, and those mean nothing outside the sent letter — a
		 * template built on them would show an empty frame instead of the picture.
		 */
		$templateBodyHtml = $this->normalizeInlineAttachmentLinks($messageBodyHtml);

		$signatureImageSnapshot = $signatureImageResult->getData();
		$messageBodyHtml = (string)$signatureImageSnapshot['html'];
		$messageBody = $this->normalizeInlineAttachmentLinks($messageBodyHtml);

		$outgoingSubject = Helper\Message::getOutgoingSubject(
			(string)($data['subject'] ?? ''),
			$messageBodyHtml,
		);

		$outgoingBody = $messageBody;

		$totalSize = (int)$signatureImageSnapshot['totalSize'];
		$attachments = (array)$signatureImageSnapshot['attachments'];
		$attachmentIds = array();

		$largeAttachmentResult = $this->resolveLargeAttachmentsForSend(
			$userId,
			(array)($data['__largeAttachments'] ?? []),
			(array)($data['__diskfiles'] ?? []),
			$outgoingBody,
		);
		if (!$largeAttachmentResult->isSuccess())
		{
			foreach ($largeAttachmentResult->getErrors() as $error)
			{
				$this->errorCollection[] = new Error(
					(string)Loc::getMessage('MAIL_MESSAGE_SEND_ERROR'),
					$error->getCode(),
				);
			}

			return;
		}

		$sendContract = $largeAttachmentResult->getData()[SendContractValidator::RESULT_KEY] ?? null;
		if (!$sendContract instanceof SendContractResult)
		{
			$this->errorCollection[] = new Error(
				'Large attachment validator returned an invalid result.',
				SendContractValidator::ERROR_INVALID_SEND_RESULT,
			);

			return;
		}

		$convertedFileIds = array_fill_keys($sendContract->fileIds, true);
		$externalLinkIds = $sendContract->externalLinkIds;

		if (!empty($data['__diskfiles']) && is_array($data['__diskfiles']) && Loader::includeModule('disk'))
		{
			foreach ($data['__diskfiles'] as $item)
			{
				if (!preg_match('/n\d+/i', $item))
				{
					continue;
				}

				$id = ltrim($item, 'n');

				if (isset($convertedFileIds[(int)$id]))
				{
					continue;
				}

				if (!($diskFile = \Bitrix\Disk\File::loadById($id)))
				{
					continue;
				}

				$canRead = $diskFile->canRead($diskFile->getStorage()->getSecurityContext($userId));
				if (!$canRead)
				{
					continue;
				}

				if (!($file = \CFile::makeFileArray($diskFile->getFileId())))
				{
					continue;
				}

				$totalSize += $diskFile->getSize();

				$attachmentIds[] = $id;

				$contentId = AttachmentContentId::build($file, $hostname);

				$attachments[] = array(
					'ID'           => $contentId,
					'NAME'         => $diskFile->getName(),
					'PATH'         => $file['tmp_name'],
					'CONTENT_TYPE' => $file['type'],
				);

				$outgoingBody = preg_replace(
					sprintf('/(https?:\/\/)?bxacid:n?%u/i', $id),
					sprintf('cid:%s', $contentId),
					$outgoingBody
				);
			}
		}

		$maxSize = Helper\Message::getMaxAttachedFilesSize();

		if ($maxSize > 0 && $maxSize <= ceil($totalSize / 3) * 4) // base64 coef.
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage(
				'MAIL_MESSAGE_MAX_SIZE_EXCEED',
				['#SIZE#' => \CFile::formatSize(Helper\Message::getMaxAttachedFilesSizeAfterEncoding(),1)]
			));
			return;
		}

		$outgoingMailboxId = $this->resolveOutgoingMailboxId(
			$senderIdentity,
			(int)($data['MAILBOX_ID'] ?? 0),
			$hasExactSenderSelection,
		);
		if ($outgoingMailboxId !== null)
		{
			$guard = (new MigrationActionGuard())->check($outgoingMailboxId);
			if (!$guard->isSuccess())
			{
				$this->addErrors($guard->getErrors());

				return;
			}
		}
		$mailboxHelper = $outgoingMailboxId !== null
			? Mail\Helper\Mailbox::findBy($outgoingMailboxId, $fromEmail)
			: null
		;

		$mailboxOwnerId = null;

		if (!empty($mailboxHelper))
		{
			$guard = (new MigrationActionGuard())->check($mailboxHelper->getMailboxId());
			if (!$guard->isSuccess())
			{
				$this->addErrors($guard->getErrors());

				return;
			}

			$mailboxOwnerId = $mailboxHelper->getMailboxOwnerId();
			if (!$mailboxHelper->isAuthenticated())
			{
				$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_IMAP_ERR_AUTH'));
				return;
			}
		}

		$outgoingParams = [
			'CHARSET'      => SITE_CHARSET,
			'CONTENT_TYPE' => 'html',
			'ATTACHMENT'   => $attachments,
			'TO'           => implode(', ', $toEncoded),
			'SUBJECT'      => $outgoingSubject,
			'BODY'         => $outgoingBody,
			'HEADER'       => [
				'From'       => $fromEncoded ?: $fromEmail,
				'Reply-To'   => $fromEncoded ?: $fromEmail,
				'Cc'         => implode(', ', $ccEncoded),
				'Bcc'        => implode(', ', $bccEncoded),
			],
		];

		if(isset($data['IN_REPLY_TO']))
		{
			$outgoingParams['HEADER']['In-Reply-To']=sprintf('<%s>', $data['IN_REPLY_TO']);
		}

		$sendService = new SendMessageService();
		$sendCommandArguments = [
			'authorId' => $userId,
			'mailbox' => $mailboxHelper,
			'sender' => $fromEncoded ?: $fromEmail,
			'recipients' => $toEncoded,
			'cc' => $ccEncoded,
			'bcc' => $bccEncoded,
			'subject' => $outgoingSubject,
			'body' => $outgoingBody,
			'attachments' => $attachments,
			'messageId' => '',
			'inReplyTo' => isset($data['IN_REPLY_TO']) ? (string)$data['IN_REPLY_TO'] : null,
			'externalLinkIds' => $externalLinkIds,
			'senderIdentity' => $senderIdentity,
		];
		$validationResult = $sendService->validate(new SendMessageCommand(...$sendCommandArguments));
		if (!$validationResult->isSuccess())
		{
			foreach ($validationResult->getErrors() as $error)
			{
				$this->errorCollection[] = $this->localizeSendError($error);
			}

			return;
		}

		$messageBindings = array();
		$createdCrmActivityId = 0;

		// crm activity
		if ($this->isCrmEnable && count($crmCommunication) > 0)
		{
			$crmAttachmentIds = $attachmentIds;
			$createdCrmAttachmentIds = [];
			$crmAttachmentIdMap = [];
			if ($this->canCopyDraftAttachmentsForCrmActivity(
				$userId,
				$attachmentIds,
				$data['draftId'] ?? null,
				$data['draftRevision'] ?? null,
			))
			{
				$crmAttachmentIds = $this->copyDraftAttachmentsForCrmActivity(
					$userId,
					$attachmentIds,
					$createdCrmAttachmentIds,
					$crmAttachmentIdMap,
				);
				if ($crmAttachmentIds === null)
				{
					$this->errorCollection[] = new \Bitrix\Main\Error(
						Loc::getMessage('MAIL_CLIENT_ACTIVITY_CREATE_ERROR'),
					);

					return;
				}
			}
			$crmMessageBody = $messageBodyHtml;
			foreach ($crmAttachmentIdMap as $sourceId => $copyId)
			{
				$crmMessageBody = preg_replace(

					'/bxacid:n?' . preg_quote((string)$sourceId, '/') . '(?!\d)/i',
					'bxacid:n' . $copyId,
					$crmMessageBody,
				);
			}

			$messageFields = array_merge(
				$outgoingParams,
				array(
					'BODY' => $crmMessageBody,
					'FROM' => $fromEmail,
					'TO' => $to,
					'CC' => $cc,
					'BCC' => $bcc,
					'IMPORTANT' => !empty($data['important']),
					'STORAGE_TYPE_ID' => \Bitrix\Crm\Integration\StorageType::Disk,
					'STORAGE_ELEMENT_IDS' => $crmAttachmentIds,
				)
			);

			$activityFields = [
				'RESPONSIBLE_ID' => $responsibleId,
				'EDITOR_ID' => $responsibleId,
				'AUTHOR_ID' => $mailboxOwnerId,
				'COMMUNICATIONS' => $crmCommunication,
			];

			if (\CCrmEMail::createOutgoingMessageActivity($messageFields, $activityFields) !== true)
			{
				foreach ($createdCrmAttachmentIds as $attachmentId)
				{
					\Bitrix\Crm\Integration\StorageManager::deleteFile(
						$attachmentId,
						\Bitrix\Crm\Integration\StorageType::Disk,
					);
				}

				$this->errorCollection[] = new \Bitrix\Main\Error($this->getCrmActivityErrorText($activityFields));

				return;
			}

			$messageBindings[] = Mail\Internals\MessageAccessTable::ENTITY_TYPE_CRM_ACTIVITY;
			$createdCrmActivityId = (int)($activityFields['ID'] ?? 0);

			//$activityId = $activityFields['ID'];
			//$urn = $messageFields['URN'];
			$messageId = $messageFields['MSG_ID'];
		}
		else
		{
			$messageId = $this->generateMessageId($hostname);
		}

		$outgoingParams['HEADER']['Message-Id'] = $messageId;

		$sendCommandArguments['messageId'] = $messageId;
		$sendResult = $sendService->send(new SendMessageCommand(...$sendCommandArguments));
		if (!$sendResult->isSuccess())
		{
			if ($createdCrmActivityId > 0 && $this->hasControlledSenderError($sendResult))
			{
				\CCrmActivity::delete(
					$createdCrmActivityId,
					false,
					false,
					['CURRENT_USER' => $userId, 'RECYCLE_BIN_FORCE_USER_ID' => $userId],
				);
			}

			foreach ($sendResult->getErrors() as $error)
			{
				$this->errorCollection[] = $this->localizeSendError($error);
			}

			return;
		}

		/*
		 * The files a template should keep are asked about before the send closes the draft: the copies of a
		 * draft are released only while it is still active, and a template built on the copies would lose
		 * its attachments to the cleanup of the drafts.
		 */
		$templateSaver = $this->createComposedMessageTemplateSaver();
		$templateDiskObjectIds = $templateSaver->resolveAuthorObjectIds(
			$userId,
			isset($data['draftId']) ? (int)$data['draftId'] : null,
			isset($data['draftRevision']) ? (int)$data['draftRevision'] : null,
			array_map('intval', $attachmentIds),
		);

		$messageBindings = array_merge(
			$messageBindings,
			(array)($sendResult->getData()['messageBindings'] ?? []),
		);

		\Bitrix\Mail\Internal\Service\Draft\DraftCompletion::afterSuccessfulSend(
			userId: $userId,
			draftId: $data['draftId'] ?? null,
			contextType: \Bitrix\Mail\Internals\DraftTable::CONTEXT_MAIL,
			expectedRevision: $data['draftRevision'] ?? null,
		);

		$templateSaveWarning = $this->isTemplateSaveRequested($data)
			&& !$templateSaver->save(
				userId: $userId,
				subject: $outgoingSubject,
				bodyHtml: $templateBodyHtml,
				emailFrom: $fromEmail,
				diskObjectIds: $templateDiskObjectIds,
			)
		;

		addEventToStatFile(
			'mail',
			(empty($data['IN_REPLY_TO']) ? 'send_message' : 'send_reply'),
			join(',', array_unique(array_filter($messageBindings))),
			trim(trim($messageId), '<>')
		);

		return ['templateSaveWarning' => $templateSaveWarning];
	}

	protected function isTemplateSaveRequested(array $data): bool
	{
		return in_array($data['saveAsTemplate'] ?? null, [true, 1, '1'], true);
	}

	protected function createComposedMessageTemplateSaver(): ComposedMessageTemplateSaver
	{
		return new ComposedMessageTemplateSaver();
	}

	/**
	 * Links of the attachments of the editor come from the browser as absolute ones; everything downstream —
	 * the outgoing letter and the catalog of the templates alike — reads the short form.
	 */
	protected function normalizeInlineAttachmentLinks(string $html): string
	{
		return (string)preg_replace('/https?:\/\/bxacid:(n?\d+)/i', 'bxacid:\1', $html);
	}

	private function hasControlledSenderError(Main\Result $result): bool
	{
		if (SendFailure::getControlledError($result) !== null)
		{
			return true;
		}

		foreach ($result->getErrors() as $error)
		{
			if (in_array(
				(string)$error->getCode(),
				[
					SendMessageService::ERROR_INVALID_AUTHOR,
					SendMessageService::ERROR_INVALID_SENDER,
				],
				true,
			))
			{
				return true;
			}
		}

		return false;
	}

	/** An error code of crm without a phrase of its own falls back to the general one instead of an empty banner. */
	private function getCrmActivityErrorText(array $activityFields): string
	{
		$text = trim((string)($activityFields['ERROR_TEXT'] ?? ''));
		if ($text !== '')
		{
			return $text;
		}

		$code = (string)($activityFields['ERROR_CODE'] ?? '');
		if ($code !== '')
		{
			$text = trim((string)Loc::getMessage('MAIL_CLIENT_' . $code));
			if ($text !== '')
			{
				return $text;
			}
		}

		return (string)Loc::getMessage('MAIL_CLIENT_ACTIVITY_CREATE_ERROR');
	}

	/** Keeps the machine-readable code of the service and replaces its English diagnostic with a user phrase. */
	private function localizeSendError(Error $error): Error
	{
		$phrase = self::SEND_ERROR_PHRASE[(string)$error->getCode()] ?? null;
		if ($phrase === null)
		{
			return $error;
		}

		return new Error((string)Loc::getMessage($phrase), $error->getCode());
	}

	/**
	 * @param int[] $attachmentIds
	 * @param int[] $createdAttachmentIds
	 * @param array<int, int> $attachmentIdMap
	 *
	 * @return int[]|null
	 */
	private function copyDraftAttachmentsForCrmActivity(
		int $userId,
		array $attachmentIds,
		array &$createdAttachmentIds,
		array &$attachmentIdMap,
	): ?array
	{
		$createdAttachmentIds = [];
		$attachmentIdMap = [];
		foreach ($attachmentIds as $attachmentId)
		{
			$file = \Bitrix\Crm\Integration\StorageManager::makeFileArray(
				(int)$attachmentId,
				\Bitrix\Crm\Integration\StorageType::Disk,
			);
			if (!is_array($file))
			{
				break;
			}

			$copyId = \Bitrix\Crm\Integration\StorageManager::saveEmailAttachment(
				$file,
				\Bitrix\Crm\Integration\StorageType::Disk,
				'',
				['USER_ID' => $userId],
			);
			if ((int)$copyId <= 0)
			{
				break;
			}

			$createdAttachmentIds[] = (int)$copyId;
			$attachmentIdMap[(int)$attachmentId] = (int)$copyId;
		}

		if (count($createdAttachmentIds) === count($attachmentIds))
		{
			return $createdAttachmentIds;
		}

		foreach ($createdAttachmentIds as $attachmentId)
		{
			\Bitrix\Crm\Integration\StorageManager::deleteFile(
				$attachmentId,
				\Bitrix\Crm\Integration\StorageType::Disk,
			);
		}
		$createdAttachmentIds = [];
		$attachmentIdMap = [];

		return null;
	}

	private function canCopyDraftAttachmentsForCrmActivity(
		int $userId,
		array $attachmentIds,
		mixed $draftId,
		mixed $draftRevision,
	): bool
	{
		if (
			!\Bitrix\Mail\Helper\Config\Feature::isInternalDraftsAvailable()
			|| !is_numeric($draftId)
			|| !is_numeric($draftRevision)
			|| (int)$draftId <= 0
			|| (int)$draftRevision <= 0
		)
		{
			return false;
		}

		$draft = (new \Bitrix\Mail\Internal\Repository\DraftRepository())->findActiveById(
			$userId,
			(int)$draftId,
			\Bitrix\Mail\Internals\DraftTable::CONTEXT_MAIL,
		);
		if ($draft === null || $draft->revision !== (int)$draftRevision)
		{
			return false;
		}

		$draftAttachmentIds = array_map(
			static fn(array $attachment): int => (int)$attachment['id'],
			$draft->attachments,
		);

		return array_diff(array_map('intval', $attachmentIds), $draftAttachmentIds) === [];
	}

	/**
	 * @param array<int, array{token?: mixed, fileIds?: mixed}> $contracts
	 * @param mixed[] $diskFileItems
	 */
	protected function resolveLargeAttachmentsForSend(
		int $userId,
		array $contracts,
		array $diskFileItems,
		string $messageBody,
	): Main\Result
	{
		return $this
			->createLargeAttachmentSendContractValidator()
			->validate($userId, $contracts, $diskFileItems, $messageBody)
		;
	}

	protected function createLargeAttachmentSendContractValidator(): SendContractValidator
	{
		return new SendContractValidator();
	}

	/**
	 * The limit belongs to the sender record the message goes through, the way the kernel reads it on
	 * send: an address-wide check would refuse the message because of the quota of another owner of
	 * the same address.
	 */
	private function isSenderLimitReached(
		string $fromEmail,
		int $recipientsCount,
		?Sender\Identity $identity,
	): bool
	{
		$emailDailyLimit = Sender::getEmailLimit($fromEmail, $identity);
		if ($emailDailyLimit <= 0)
		{
			return false;
		}

		$emailCounter = new SenderSendCounter();
		$limit = $emailCounter->get($fromEmail);

		return ($limit + $recipientsCount) > $emailDailyLimit;
	}

	/**
	 * A sender selected by the new form is exact and takes priority over the mailbox carried by a
	 * reply context. Calls without an exact coordinate keep the legacy mailbox/address fallback.
	 *
	 * @param array<int, array<string, mixed>> $availableSenders
	 * @param array<int, array<string, mixed>> $availableMailboxSenders
	 */
	private function resolveSenderIdentity(
		int $requestedMailboxId,
		?int $requestedSenderId,
		array $availableSenders,
		string $fromEmail,
		array $availableMailboxSenders = [],
		?int $selectedMailboxId = null,
	): ?Sender\Identity
	{
		if (!class_exists(Sender\Identity::class))
		{
			return null;
		}

		$email = mb_strtolower($fromEmail);
		if ($selectedMailboxId !== null)
		{
			if ($selectedMailboxId <= 0)
			{
				return null;
			}

			foreach ($availableSenders as $sender)
			{
				if (
					(int)($sender['mailboxId'] ?? 0) === $selectedMailboxId
					&& mb_strtolower((string)($sender['email'] ?? '')) === $email
				)
				{
					return Sender\Identity::fromMailbox($selectedMailboxId);
				}
			}

			return null;
		}

		if ($requestedSenderId !== null)
		{
			if ($requestedSenderId <= 0)
			{
				return null;
			}

			foreach ($availableSenders as $sender)
			{
				if (
					(int)($sender['id'] ?? 0) !== $requestedSenderId
					|| (int)($sender['mailboxId'] ?? 0) > 0
					|| mb_strtolower((string)($sender['email'] ?? '')) !== $email
				)
				{
					continue;
				}

				return Sender\Identity::fromSender($requestedSenderId);
			}

			return null;
		}

		if ($requestedMailboxId > 0)
		{
			foreach ($availableMailboxSenders as $sender)
			{
				$mailboxId = (int)($sender['mailboxId'] ?? 0);
				if (
					$mailboxId === $requestedMailboxId
					&& mb_strtolower((string)($sender['email'] ?? '')) === $email
				)
				{
					return Sender\Identity::fromMailbox($mailboxId);
				}
			}
		}

		return null;
	}

	/**
	 * A letter of a mailbox is sent later by the queue agent, and a refusal of the kernel does not reach the
	 * form from there. So the one refusal the kernel can already tell - the own SMTP record of the mailbox
	 * carries another address than From - is asked here, before the letter is queued.
	 */
	private function findSenderAddressMismatch(string $fromEmail, ?Sender\Identity $identity): ?Error
	{
		if ($identity === null || !$identity->hasMailboxRef())
		{
			return null;
		}

		$customSmtp = Sender::getCustomSmtp($fromEmail, $identity);
		if (!$customSmtp)
		{
			return null;
		}

		$senderEmail = (string)$customSmtp->getFrom();
		if ($senderEmail !== '' && strcasecmp($fromEmail, $senderEmail) === 0)
		{
			return null;
		}

		return SendFailure::createSenderAddressMismatchError();
	}

	private function resolveOutgoingMailboxId(
		?Sender\Identity $identity,
		int $legacyMailboxId,
		bool $hasExactSenderSelection,
	): ?int
	{
		if (!$hasExactSenderSelection)
		{
			return $legacyMailboxId;
		}

		return $identity?->hasMailboxRef() ? $identity->mailboxParentId : null;
	}

	/**
	 * The sender list used by the interface is deduplicated by formatted address. Mailbox access is
	 * checked against the complete server-side list, so a repeated address does not make a requested
	 * mailbox indistinguishable from its neighbour.
	 *
	 * @return array<int, array{mailboxId: int, email: string}>
	 */
	private function getAvailableMailboxSenders(int $userId, string $email): array
	{
		$normalizedEmail = mb_strtolower($email);
		$senders = [];
		foreach (MailboxTable::getUserMailboxes($userId) as $mailbox)
		{
			if (mb_strtolower((string)($mailbox['EMAIL'] ?? '')) !== $normalizedEmail)
			{
				continue;
			}

			$senders[] = [
				'mailboxId' => (int)$mailbox['ID'],
				'email' => (string)$mailbox['EMAIL'],
			];
		}

		return $senders;
	}

	/**
	 * Tells the kernel which sender the message goes through, so that the transport and the limit stay
	 * within the same record the pre-check read. Older kernels have no identity and keep selecting by
	 * the address.
	 */
	private function applySenderIdentity(Main\Mail\Context $context, ?Sender\Identity $identity): void
	{
		if ($identity !== null && method_exists($context, 'setSenderIdentity'))
		{
			$context->setSenderIdentity($identity);
		}
	}

	private function isDailyPortalLimitReached(int $recipientsCount): bool
	{
		if (!isModuleInstalled('bitrix24') || !Loader::includeModule('bitrix24'))
		{
			return false;
		}

		$counter = new MailCounter();
		$limit = $counter->getDailyLimit();

		return $limit > 0 && MailCounter::checkLimit($limit, $counter->get() + $recipientsCount);
	}

	private function isMonthPortalLimitReached(int $recipientsCount): bool
	{
		if (!isModuleInstalled('bitrix24') || !Loader::includeModule('bitrix24'))
		{
			return false;
		}

		$counter = new MailCounter();
		$limit = $counter->getLimit();

		return $limit > 0 && MailCounter::checkLimit($limit, $counter->getMonthly() + $recipientsCount);
	}

	/**
	 * @deprecated Use \Bitrix\Mail\Controller\Message::createCrmActivityAction
	 */
	public function createCrmActivityAction($messageId, $iteration = 1)
	{
		$result = \Bitrix\Mail\Helper\Message\MessageActions::createCrmActivity($messageId, $iteration);

		if (!$result->isSuccess())
		{
			$errors = $result->getErrors();
			$this->addError($errors[0]);
		}
	}

	/**
	 * Removes crm activity.
	 * @param string $messageId
	 *
	 * @return array|void
	 * @throws Main\ArgumentException
	 * @throws Main\DB\SqlQueryException
	 * @throws Main\LoaderException
	 * @throws Main\ObjectPropertyException
	 * @throws Main\SystemException
	 */
	public function removeCrmActivityAction($messageId)
	{
		global $USER;

		if (!Loader::includeModule('crm'))
		{
			$this->errorCollection[] = new Main\Error(Loc::getMessage('MAIL_CLIENT_AJAX_ERROR'));

			return;
		}

		if (!MailboxAccess::hasUserAccessToEditMailboxIntegrationCrm((int)$USER->getId()))
		{
			$this->errorCollection[] = new Main\Error(Loc::getMessage('MAIL_CLIENT_ELEMENT_DENIED'));

			return;
		}

		$message = Mail\MailMessageTable::getList(array(
			'select' => array(
				'*',
				'MAILBOX_EMAIL' => 'MAILBOX.EMAIL',
				'MAILBOX_NAME' => 'MAILBOX.NAME',
				'MAILBOX_LOGIN' => 'MAILBOX.LOGIN',
			),
			'filter' => array(
				'=ID' => $messageId,
			),
		))->fetch();

		if (empty($message))
		{
			$this->errorCollection[] = new Main\Error(Loc::getMessage('MAIL_CLIENT_ELEMENT_NOT_FOUND'));
			return;
		}

		$crmEntityIds = $this->getBindCrmEntityIds($message['MAILBOX_ID'], $messageId);
		if (empty($crmEntityIds))
		{
			$this->errorCollection[] = new Main\Error(Loc::getMessage('MAIL_CLIENT_ELEMENT_NOT_FOUND'));
			return;
		}

		$mailbox = MailboxTable::getUserMailbox($message['MAILBOX_ID']);

		if (empty($mailbox))
		{
			$this->errorCollection[] = new Main\Error(Loc::getMessage('MAIL_CLIENT_ELEMENT_DENIED'));
			return;
		}

		$result = array();

		Mail\Helper\Message::prepare($message);

		if (empty($message['__is_outcome']))
		{
			$exclusionAccess = new \Bitrix\Crm\Exclusion\Access($USER->getId());
			if ($exclusionAccess->canWrite())
			{
				foreach (array_merge($message['__from'], $message['__reply_to']) as $item)
				{
					if (!empty($item['email']))
					{
						\Bitrix\Crm\Exclusion\Store::add(\Bitrix\Crm\Communication\Type::EMAIL, $item['email']);
					}
				}
			}
		}

		foreach ($crmEntityIds as $item)
		{
			\CCrmActivity::delete($item);
		}

		return $result;
	}

	/**
	 * Append contact reference.
	 *
	 * @param \Bitrix\Main\Mail\Address[] $addressList Email address list.
	 * @param string $fromField Email field TO|CC|BCC.
	 *
	 * @return void
	 * @throws Main\ArgumentException
	 * @throws Main\Db\SqlQueryException
	 * @throws Main\ObjectPropertyException
	 * @throws Main\SystemException
	 */
	private function appendMailContacts($addressList, $fromField = '')
	{
		$fromField = mb_strtoupper($fromField);
		if (
			!in_array(
				$fromField,
				array(
					\Bitrix\Mail\Internals\MailContactTable::ADDED_TYPE_TO,
					\Bitrix\Mail\Internals\MailContactTable::ADDED_TYPE_CC,
					\Bitrix\Mail\Internals\MailContactTable::ADDED_TYPE_BCC,
				)
			)
		)
		{
			$fromField = \Bitrix\Mail\Internals\MailContactTable::ADDED_TYPE_TO;
		}

		$allEmails = array();
		$contactsData = array();

		/**
		 * @var \Bitrix\Main\Mail\Address $address
		 */
		foreach ($addressList as $address)
		{
			$allEmails[] = mb_strtolower($address->getEmail());
			$contactsData[] = array(
				'USER_ID' => $this->getCurrentUser()->getId(),
				'NAME' => $address->getName(),
				'ICON' => \Bitrix\Mail\Helper\MailContact::getIconData($address->getEmail(), $address->getName()),
				'EMAIL' => $address->getEmail(),
				'ADDED_FROM' => $fromField,
			);
		}

		\Bitrix\Mail\Internals\MailContactTable::addContactsBatch($contactsData);

		$mailContacts = \Bitrix\Mail\Internals\MailContactTable::query()
			->addSelect('ID')
			->where('USER_ID', $this->getCurrentUser()->getId())
			->whereIn('EMAIL', $allEmails)
			->exec();

		$lastRcpt = array();
		while ($contact = $mailContacts->fetch())
		{
			$lastRcpt[] = 'MC'. $contact['ID'];
		}

		if (count($lastRcpt) > 0)
		{
			\Bitrix\Main\FinderDestTable::merge(array(
				'USER_ID' => $this->getCurrentUser()->getId(),
				'CONTEXT' => 'MAIL_LAST_RCPT',
				'CODE' => $lastRcpt,
			));
		}
	}

	/**
	 * Get mail crm activity entity ids
	 *
	 * @param int $mailboxId Mailbox ID
	 * @param int $messageId Message ID
	 *
	 * @return array|int[]
	 */
	private function getBindCrmEntityIds(int $mailboxId, int $messageId): array
	{
		$binds = MessageAccessTable::query()
			->where('MAILBOX_ID', $mailboxId)
			->where('MESSAGE_ID', $messageId)
			->where('ENTITY_TYPE', 'CRM_ACTIVITY')
			->setDistinct()
			->addSelect('ENTITY_ID')
			->fetchAll();

		return array_column($binds, 'ENTITY_ID');
	}

	public function icalAction()
	{
		$request = Context::getCurrent()->getRequest();

		$messageId = (int)$request->getPost('messageId');
		$action = (string)$request->getPost('action');

		if (!$messageId || !$action)
		{
			$this->addError(new Error(Loc::getMessage('MAIL_CLIENT_FORM_ERROR')));

			return [];
		}

		$message = MailMessageTable::getList([
			'runtime' => [
				new Main\Entity\ReferenceField(
					'MAILBOX',
					'Bitrix\Mail\MailboxTable',
					[
						'=this.MAILBOX_ID' => 'ref.ID',
					],
					[
						'join_type' => 'INNER',
					]
				),
			],
			'select'  => [
				'ID',
				'FIELD_FROM',
				'FIELD_TO',
				'OPTIONS',
				'USER_ID' => 'MAILBOX.USER_ID',
			],
			'filter'  => [
				'=ID' => $messageId,
			],
		])->fetch();

		if (empty($message['OPTIONS']['iCal']))
		{
			return [];
		}

		$icalComponent = ICalMailManager::parseRequest($message['OPTIONS']['iCal']);

		if ($icalComponent instanceof \Bitrix\Calendar\ICal\Parser\Calendar
			&& $icalComponent->getMethod() === \Bitrix\Calendar\ICal\Parser\Dictionary::METHOD['request']
			&& $icalComponent->hasOneEvent()
		)
		{
			$handler = \Bitrix\Calendar\ICal\MailInvitation\IncomingInvitationRequestHandler::createInstance();
			$result = $handler->setDecision($action)
				->setIcalComponent($icalComponent)
				->setUserId((int)$message['USER_ID'])
				->setEmailFrom($message['FIELD_FROM'])
				->setEmailTo($message['FIELD_TO'])
				->handle()
			;

			$eventId = $handler->getEventId();

			if ($result && ($eventId > 0))
			{
				Secretary::provideAccessToMessage(
					$message['ID'],
					Message::ENTITY_TYPE_CALENDAR_EVENT,
					$eventId,
					$this->getCurrentUser()->getId()
				);
			}

			return [
				'eventId' => $eventId,
			];
		}

		return [];
	}
}
