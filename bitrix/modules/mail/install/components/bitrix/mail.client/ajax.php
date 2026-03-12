<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Bitrix24\MailCounter;
use Bitrix\Mail;
use Bitrix\Mail\Helper\MailboxAccess;
use Bitrix\Mail\Helper\Message;
use Bitrix\Mail\Integration\Calendar\ICal\ICalMailManager;
use Bitrix\Mail\Integration\Intranet\Secretary;
use Bitrix\Mail\Internals\MessageAccessTable;
use Bitrix\Mail\MailboxTable;
use Bitrix\Mail\MailMessageTable;
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
		$result = \Bitrix\Mail\Helper\Mailbox::quickSync($id, $dir, $onlySyncCurrent);
		$this->errorCollection = $result->getErrorCollection();

		return $result->getData();
	}

	/**
	 * Sends email.
	 *
	 * @param array $data
	 *
	 * @return void
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
			if (!in_array($fromEmail, array_column(\MainMailConfirmComponent::prepareMailboxes(), 'email')))
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

		if (count($to) + count($cc) + count($bcc) > 10)
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_MESSAGE_TO_MANY_RECIPIENTS'));
			return;
		}

		if (empty($to))
		{
			$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_MESSAGE_EMPTY_RCPT'));
			return;
		}

		$totalRecipientsCount = count($to) + count($cc) + count($bcc);

		if ($this->isSenderLimitReached((string)$fromEmail, $totalRecipientsCount))
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
		if (!empty($messageBody))
		{
			$messageBody = preg_replace('/<!--.*?-->/is', '', $messageBody);
			$messageBody = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $messageBody);
			$messageBody = preg_replace('/<title[^>]*>.*?<\/title>/is', '', $messageBody);

			$sanitizer = new \CBXSanitizer();
			$sanitizer->setLevel(\CBXSanitizer::SECURE_LEVEL_LOW);
			$sanitizer->applyDoubleEncode(false);
			$sanitizer->addTags(Helper\Message::getWhitelistTagAttributes());

			$messageBody = $sanitizer->sanitizeHtml($messageBody);
			$messageBodyHtml = $messageBody;
			$messageBody = preg_replace('/https?:\/\/bxacid:(n?\d+)/i', 'bxacid:\1', $messageBody);
		}

		$outgoingBody = $messageBody;

		$totalSize = 0;
		$attachments = array();
		$attachmentIds = array();
		if (!empty($data['__diskfiles']) && is_array($data['__diskfiles']) && Loader::includeModule('disk'))
		{
			foreach ($data['__diskfiles'] as $item)
			{
				if (!preg_match('/n\d+/i', $item))
				{
					continue;
				}

				$id = ltrim($item, 'n');

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

				$contentId = sprintf(
					'bxacid.%s@%s.mail',
					hash('crc32b', $file['external_id'].$file['size'].$file['name']),
					hash('crc32b', $hostname)
				);

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

		$mailboxHelper = Mail\Helper\Mailbox::findBy($data['MAILBOX_ID'], $fromEmail);

		$mailboxOwnerId = null;

		if (!empty($mailboxHelper))
		{
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
			'SUBJECT'      => $data['subject'],
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

		$messageBindings = array();

		// crm activity
		if ($this->isCrmEnable && count($crmCommunication) > 0)
		{
			$messageFields = array_merge(
				$outgoingParams,
				array(
					'BODY' => $messageBodyHtml,
					'FROM' => $fromEmail,
					'TO' => $to,
					'CC' => $cc,
					'BCC' => $bcc,
					'IMPORTANT' => !empty($data['important']),
					'STORAGE_TYPE_ID' => \Bitrix\Crm\Integration\StorageType::Disk,
					'STORAGE_ELEMENT_IDS' => $attachmentIds,
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
				if (!empty($activityFields['ERROR_TEXT']))
				{
					$this->errorCollection[] = new \Bitrix\Main\Error($activityFields['ERROR_TEXT']);
				}
				elseif (!empty($activityFields['ERROR_CODE']))
				{
					$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_CLIENT_' . $activityFields['ERROR_CODE']));
				}
				else
				{
					$this->errorCollection[] = new \Bitrix\Main\Error(Loc::getMessage('MAIL_CLIENT_ACTIVITY_CREATE_ERROR'));
				}

				return;
			}

			$messageBindings[] = Mail\Internals\MessageAccessTable::ENTITY_TYPE_CRM_ACTIVITY;

			//$activityId = $activityFields['ID'];
			//$urn = $messageFields['URN'];
			$messageId = $messageFields['MSG_ID'];
		}
		else
		{
			$messageId = $this->generateMessageId($hostname);
		}

		$outgoingParams['HEADER']['Message-Id'] = $messageId;

		if (empty($mailboxHelper))
		{
			$context = new Main\Mail\Context();
			$context->setCategory(Main\Mail\Context::CAT_EXTERNAL);
			$context->setPriority(
				isset($addressList) && count($addressList) > 2
				? Main\Mail\Context::PRIORITY_LOW
				: Main\Mail\Context::PRIORITY_NORMAL
			);

			$result = Main\Mail\Mail::send(array_merge(
				$outgoingParams,
				array(
					'CONTEXT' => $context,
				)
			));
		}
		else
		{
			$eventKey = Main\EventManager::getInstance()->addEventHandler(
				'mail',
				'onBeforeUserFieldSave',
				function (\Bitrix\Main\Event $event) use (&$messageBindings)
				{
					$params = $event->getParameters();
					$messageBindings[] = $params['entity_type'];
				}
			);

			$mailboxHelper->mail(array_merge(
				$outgoingParams,
				array(
					'HEADER' => array_merge(
						$outgoingParams['HEADER'],
						array(
							'To' => $outgoingParams['TO'],
							'Subject' => $outgoingParams['SUBJECT'],
						)
					),
				)
			));

			Main\EventManager::getInstance()->removeEventHandler('mail', 'onBeforeUserFieldSave', $eventKey);
		}

		addEventToStatFile(
			'mail',
			(empty($data['IN_REPLY_TO']) ? 'send_message' : 'send_reply'),
			join(',', array_unique(array_filter($messageBindings))),
			trim(trim($messageId), '<>')
		);

		return;
	}

	private function isSenderLimitReached(string $fromEmail, int $recipientsCount): bool
	{
		$emailDailyLimit = Sender::getEmailLimit($fromEmail);
		if ($emailDailyLimit <= 0)
		{
			return false;
		}

		$emailCounter = new SenderSendCounter();
		$limit = $emailCounter->get($fromEmail);

		return ($limit + $recipientsCount) > $emailDailyLimit;
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
