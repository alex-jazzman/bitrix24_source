<?php

use Bitrix\Mail\Helper\MailboxAccess;
use Bitrix\Mail\Integration\Tasks\TaskMailSourceService;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Mail;
use Bitrix\Mail\Internals\MessageAccessTable;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

Loc::loadMessages(__FILE__);

Main\Loader::includeModule('mail');

class CMailMessageActionsComponent extends CBitrixComponent
{

	public function executeComponent()
	{
		global $USER;

		$message = false;
		$mailMessageActionsAvailable = false;
		$sourceType = (string)($this->arParams['MAIL_SOURCE_TYPE'] ?? '');
		$sourceId = (int)($this->arParams['MAIL_SOURCE_ID'] ?? 0);
		$userId = (int)$USER->GetID();
		if (!$this->isCrmActivitySource($sourceType, $sourceId))
		{
			$sourceType = '';
			$sourceId = 0;
		}

		if (!empty($this->arParams['MESSAGE']))
		{
			$message = $this->arParams['MESSAGE'];
		}
		else if (!empty($this->arParams['MESSAGE_ID']))
		{
			$message = Mail\MailMessageTable::getConsistentById(
				(int) $this->arParams['MESSAGE_ID'],
				['ID', 'MAILBOX_ID', 'SUBJECT'],
			);

			if ($message !== null)
			{
				$message['BIND'] = MessageAccessTable::getBinds($message['MAILBOX_ID'], $message['ID']);
			}
		}

		if (!empty($message))
		{
			$accessModel = Mail\MessageAccess::createByMessageId($message['ID'], $userId);
			$mailMessageActionsAvailable = $accessModel->canModifyMessage() && Mail\Helper\Message::hasAccess($message);
		}

		if (!$mailMessageActionsAvailable && $this->isCrmActivitySource($sourceType, $sourceId))
		{
			$message = $this->getMessageByCrmActivitySource($sourceId, $userId);
		}

		if (empty($message) || (!$mailMessageActionsAvailable && !$this->isCrmActivitySource($sourceType, $sourceId)))
		{
			$this->includeComponentTemplate('disabled');
			return;
		}

		$this->arResult['MESSAGE'] = $message;
		$this->arResult['MAIL_MESSAGE_ACTIONS_AVAILABLE'] = $mailMessageActionsAvailable;
		$this->arResult['MAIL_SOURCE'] = [
			'TYPE' => $sourceType,
			'ID' => $sourceId,
		];
		$this->arResult['CONTROL_ID'] = $mailMessageActionsAvailable
			? (string)(int)$message['ID']
			: 'crm-activity-' . $sourceId
		;

		$userPage = Main\Config\Option::get('socialnetwork', 'user_page', '/company/personal/', SITE_ID);

		if (empty($this->arParams['PATH_TO_USER_TASKS_TASK']))
		{
			$this->arParams['PATH_TO_USER_TASKS_TASK'] = Main\Config\Option::get(
				'tasks',
				'paths_task_user_action',
				$userPage . 'user/#user_id#/tasks/task/#action#/#task_id#/',
				SITE_ID
			);
		}

		if (empty($this->arParams['PATH_TO_USER_BLOG_POST_EDIT']))
		{
			$this->arParams['PATH_TO_USER_BLOG_POST_EDIT'] = $userPage . 'user/#user_id#/blog/edit/post/#post_id#/';
		}

		$this->arParams['PATH_TO_USER_TASKS_TASK'] = \CComponentEngine::makePathFromTemplate(
			$this->arParams['PATH_TO_USER_TASKS_TASK'],
			array('user_id' => $USER->getId())
		);

		$this->arParams['PATH_TO_USER_BLOG_POST_EDIT'] = \CComponentEngine::makePathFromTemplate(
			$this->arParams['PATH_TO_USER_BLOG_POST_EDIT'],
			array('user_id' => $USER->getId())
		);

		$this->arParams['CRM_AVAILABLE'] = MailboxAccess::hasCurrentUserAccessToEditMailboxIntegrationCrm();

		$this->includeComponentTemplate();
	}

	private function isCrmActivitySource(string $sourceType, int $sourceId): bool
	{
		return $sourceType === TaskMailSourceService::SOURCE_TYPE_CRM_ACTIVITY && $sourceId > 0;
	}

	private function getMessageByCrmActivitySource(int $activityId, int $userId): ?array
	{
		$emailData = TaskMailSourceService::getEmailDataBySource(
			TaskMailSourceService::SOURCE_TYPE_CRM_ACTIVITY,
			$activityId,
			$userId,
			withBody: false,
		);

		if (!is_array($emailData))
		{
			return null;
		}

		return [
			'ID' => 0,
			'BIND' => [],
			'SUBJECT' => (string)($emailData['title'] ?? ''),
			'FIELD_FROM' => (string)($emailData['from'] ?? ''),
			'MAIL_DATE_TS' => (int)($emailData['dateTs'] ?? 0),
		];
	}

}
