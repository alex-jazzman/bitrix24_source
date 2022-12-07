<?php

namespace Bitrix\Calendar\Core\Event;

use Bitrix\Calendar\Core\Base\Date;
use Bitrix\Calendar\Core\Event\Tools\UidGenerator;
use Bitrix\Calendar\ICal\MailInvitation;
use Bitrix\Calendar\ICal\MailInvitation\MailInvitationManager;
use Bitrix\Calendar\ICal\MailInvitation\SenderEditInvitation;
use Bitrix\Calendar\Integration\Bitrix24Manager;
use Bitrix\Calendar\UserSettings;
use Bitrix\Calendar\Internals;
use Bitrix\Calendar\Util;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\ObjectException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\SystemException;
use Bitrix\Main\UserTable;
use CCacheManager;
use CCalendar;
use CCalendarEvent;
use CCalendarSync;
use CIMChat;

class ChildCreator
{
	private CCacheManager $cacheManager;
	/**
	 * @var false
	 */
	private bool $isIncreaseMailLimit;

	public function __construct()
	{
		global $CACHE_MANAGER;
		$this->cacheManager = $CACHE_MANAGER;
	}

	public function createChildEvents(int $parentId, array $arFields, array $params = [], array $changeFields = [])
	{
		global $DB;

		// определ€ем флаги
		$isNewEvent = !isset($arFields['ID']) || $arFields['ID'] <= 0;
		$isMailAvailable = Loader::includeModule("mail");
		$isCalDavEnabled = CCalendar::IsCalDAVEnabled();
		$isPastEvent = $arFields['DATE_TO_TS_UTC'] < (time() - $arFields['TZ_OFFSET_TO']);
		$this->isIncreaseMailLimit = false;

		// определ€ем исходные данные

		unset($params['dontSyncParent']);
		$userId = $params['userId'];

		$attendees = $this->prepareAttendees($arFields, $userId);
		$involvedAttendees = $this->prepareInvolvedAttendees($attendees);

		$eventManagersCollection = [];
		$attaches = [];

		[
			$currentAttendeesIndex,
			$deletedAttendees,
			$involvedAttendees
		] = $this->prepareAttendees2($arFields, $parentId, $involvedAttendees, $isNewEvent);

		[$chatId, $chat] = $this->prepareChatData($arFields, $userId);

		$meetingInfo = unserialize($arFields['MEETING'], ['allowed_classes' => false]);

		$userIndex = $this->getUserIndex($involvedAttendees, $arFields['MEETING_HOST']);

		foreach($attendees as $userKey)
		{
			$clonedParams = $params;
			$attendeeId = (int)$userKey;
			$isNewAttendee = $clonedParams['currentEvent']
				&& is_array($clonedParams['currentEvent']['ATTENDEE_LIST'])
				&& CCalendarEvent::isNewAttendee($clonedParams['currentEvent']['ATTENDEE_LIST'], $attendeeId)
			;
			$this->getCacheManager()->ClearByTag('calendar_user_'.$attendeeId);

			// Skip creation of child event if it's event inside his own user calendar
			if (
				$attendeeId
				&& ($arFields['CAL_TYPE'] !== 'user' || (int)$arFields['OWNER_ID'] !== $attendeeId)
			)
			{
				$childParams = $this->getChildParams($clonedParams, $parentId, $attendeeId, $arFields, $isNewEvent);

				if (!$this->checkExternalMailUserLimit($userIndex[$attendeeId], $isNewEvent))
				{
					continue;
				}

				$childParams= $this->davProcess(
					$currentAttendeesIndex[$attendeeId] ?? [],
					$attendeeId,
					$childParams,
					$arFields['~MEETING']['REINVITE'] ?? false,
					$clonedParams
				);

				if ($isNewAttendee && $childParams['arFields']['RECURRENCE_ID'])
				{
					$childParams['arFields']['RECURRENCE_ID'] = '';
				}

				$curEvent = null;
				if (!empty($childParams['arFields']['ID']))
				{
					$curEvent = $this->getEvent($childParams['arFields']['ID'], $userId);
				}

				$id = CCalendarEvent::Edit($childParams);

				[
					$userIndex,
					$isChangeFiles,
					$sender,
					$email,
					$additionalChildArFields,
					$eventManagersCollection
				] = $this->processMailUser($userIndex, $attendeeId, $clonedParams, $changeFields, $isPastEvent, $attaches,
					$arFields, $parentId, $childParams['arFields'], $id, $attendees, $eventManagersCollection,
					$currentAttendeesIndex[$attendeeId], $meetingInfo);

				if (
					$chatId > 0
					&& $chat
					&& $userIndex[$attendeeId]
					&& $userIndex[$attendeeId]['EXTERNAL_AUTH_ID'] !== 'email'
					&& $childParams['arFields']['MEETING_STATUS'] !== 'N'
				)
				{
					$chat->AddUser($chatId, $attendeeId, $hideHistory = true, $skipMessage = false);
				}

				if ($id)
				{
					CCalendar::syncChange($id, $childParams['arFields'], $clonedParams, $curEvent);
				}

				unset($deletedAttendees[$attendeeId]);
			}
		}

		if (!empty($eventManagersCollection))
		{
			MailInvitationManager::createAgentSent($eventManagersCollection);
			$eventManagersCollection = [];
		}

		// Delete
		$delIdStr = '';
		if (!$isNewEvent && count($deletedAttendees) > 0)
		{
			$mailAttendeesIndex = [];
			foreach ($attendees as $attendee)
			{
				if (!in_array($attendee['USER_ID'], $deletedAttendees))
				{
					$mailAttendeesIndex[$attendee['USER_ID']] = [
						'ID' => $attendee['USER_ID'],
						'NAME' => $attendee['NAME'],
						'LAST_NAME' => $attendee['LAST_NAME'],
						'EMAIL' => $attendee['EMAIL'],
					];
				}
			}

			foreach($deletedAttendees as $attendeeId)
			{
				if($chatId > 0 && $chat)
				{
					$chat->DeleteUser($chatId, $attendeeId, false);
				}

				$att = $currentAttendeesIndex[$attendeeId];
				if ($params['sendInvitations'] !== false && $att['STATUS'] === 'Y' && !$isPastEvent)
				{
					$CACHE_MANAGER->ClearByTag('calendar_user_'.$att["USER_ID"]);
					$fromTo = CCalendarEvent::GetEventFromToForUser($arFields, $att["USER_ID"]);
					CCalendarNotify::Send(array(
						"mode" => 'cancel',
						"name" => $arFields['NAME'],
						"from" => $fromTo['DATE_FROM'],
						"to" => $fromTo['DATE_TO'],
						"location" => CCalendar::GetTextLocation($arFields["LOCATION"]),
						"guestId" => $att["USER_ID"],
						"eventId" => $parentId,
						"userId" => $arFields['MEETING_HOST'],
						"fields" => $arFields
					));
				}
				$delIdStr .= ','.(int)$att['EVENT_ID'];

				$isExchangeEnabled = CCalendar::IsExchangeEnabled($attendeeId);
				if ($isExchangeEnabled || $isCalDavEnabled)
				{
					$currentEvent = CCalendarEvent::GetList(
						array(
							'arFilter' => array(
								"PARENT_ID" => $parentId,
								"OWNER_ID" => $attendeeId,
								"IS_MEETING" => 1,
								"DELETED" => "N"
							),
							'parseRecursion' => false,
							'fetchAttendees' => true,
							'fetchMeetings' => true,
							'checkPermissions' => false,
							'setDefaultLimit' => false
						)
					);
					$currentEvent = $currentEvent[0];

					if ($currentEvent)
					{
						CCalendarSync::DoDeleteToDav([
							'bCalDav' => $isCalDavEnabled,
							'bExchangeEnabled' => $isExchangeEnabled,
							'sectionId' => $currentEvent['SECT_ID']
						], $currentEvent);
					}
				}

				if ($att['EXTERNAL_AUTH_ID'] === 'email' && !$isPastEvent)
				{
					$declinedUser = $receiver = $userIndex[$attendeeId];
					if (empty($receiver['EMAIL']))
					{
						continue;
					}

					$sender = CCalendarEvent::getSenderForIcal($currentAttendeesIndex, $arFields['MEETING_HOST']);
					if ($email = CCalendarEvent::getSenderEmailForIcal($arFields['MEETING']))
					{
						$sender['EMAIL'] = $email;
					}
					else
					{
						$meetingHostSettings = UserSettings::get($arFields['MEETING_HOST']);
						$sender['EMAIL'] = $meetingHostSettings['sendFromEmail'];
					}
					if (!$sender['ID'] && isset($sender['USER_ID']))
					{
						$sender['ID'] = (int)$sender['USER_ID'];
					}

					//					$sender = $currentAttendeesIndex[$arFields['MEETING_HOST']];

					$declinedUser['STATUS'] = 'declined';
					$additionalChildArFields['ICAL_ORGANIZER'] = CCalendarEvent::getOrganizerForIcal($currentAttendeesIndex, (int)$arFields['MEETING_HOST'], $sender['EMAIL']);
					$additionalChildArFields['ICAL_ATTENDEES'] = CCalendarEvent::createMailAttendeesCollection([$declinedUser['ID'] => $declinedUser], false);

					if (count($eventManagersCollection) <= 3)
					{
						$eventManagersCollection[] = SenderCancelInvitation::createInstance(
							array_merge(CCalendarEvent::prepareChildParamsForIcalInvitation($arFields), $additionalChildArFields),
							IcalMailContext::createInstance(CCalendarEvent::getMailAddresser($sender, $meetingInfo['MAIL_FROM']), CCalendarEvent::getMailReceiver($receiver))
						);
					}
					else
					{
						MailInvitationManager::createAgentSent($eventManagersCollection);
					}
				}
			}

			if (!empty($eventManagersCollection))
			{
				MailInvitationManager::createAgentSent($eventManagersCollection);
			}
		}

		$delIdStr = trim($delIdStr, ', ');

		if ($delIdStr !== '')
		{
			$strSql =
				"UPDATE b_calendar_event SET ".
				$DB->PrepareUpdate("b_calendar_event", ["DELETED" => "Y"]).
				" WHERE PARENT_ID=". (int)$parentId ." AND ID IN (" . $delIdStr . ")";

			$DB->Query($strSql, false, "FILE: ".__FILE__."<br> LINE: ".__LINE__);
		}

		if (count($involvedAttendees) > 0)
		{
			$involvedAttendees = array_unique($involvedAttendees);
			CCalendar::UpdateCounter($involvedAttendees);
		}
	}

	/**
	 * @param array $involvedAttendees
	 * @param $meetingHost
	 *
	 * @return array
	 *
	 * @throws LoaderException
	 * @throws ArgumentException
	 * @throws ObjectPropertyException
	 * @throws SystemException
	 */
	private function getUserIndex(array $involvedAttendees, $meetingHost): array
	{
		$userIndex = [];
		if (Loader::includeModule("mail"))
		{
			// Here we are collecting information about EXTERNAL_AUTH_ID to
			// know if some of the users are external
			$orm = UserTable::getList([
				'filter' => [
					'=ID' => $involvedAttendees,
					'=ACTIVE' => 'Y'
				],
				'select' => [
					'ID',
					'EXTERNAL_AUTH_ID',
					'NAME',
					'LAST_NAME',
					'SECOND_NAME',
					'LOGIN',
					'EMAIL',
					'TITLE',
					'UF_DEPARTMENT',
				]
			]);

			while ($user = $orm->fetch())
			{
				if ($user['ID'] === $meetingHost)
				{
					$user['STATUS'] = 'accepted';
				}
				else
				{
					$user['STATUS'] = 'needs_action';
				}

				$userIndex[$user['ID']] = $user;
			}
		}
		return $userIndex;
	}

	/**
	 * @return CCacheManager
	 */
	private function getCacheManager(): CCacheManager
	{
		return $this->cacheManager;
	}

	/**
	 * @param array $arFields
	 *
	 * @return array
	 */
	private function prepareAttendees(array $arFields, $userId): array
	{
		$attendees = is_array($arFields['ATTENDEES']) ? $arFields['ATTENDEES'] : []; // List of attendees for event
		if (empty($attendees) && !($arFields['CAL_TYPE'] === 'user' && $arFields['OWNER_ID'] === $userId))
		{
			$attendees[] = (int)$arFields['CREATED_BY'];
		}

		return $attendees;
	}

	/**
	 * @param array $attendees
	 *
	 * @return array
	 */
	private function prepareInvolvedAttendees(array $attendees): array
	{
		$involvedAttendees = [];
		foreach($attendees as $userKey)
		{
			$involvedAttendees[] = (int)$userKey;
		}

		return $involvedAttendees;
	}

	/**
	 * @param array $arFields
	 * @param $userId
	 *
	 * @return array
	 * @throws LoaderException
	 */
	private function prepareChatData(array $arFields, $userId): array
	{
		$chatId = (int) ($arFields['~MEETING']['CHAT_ID'] ?? 0) ;
		if($chatId > 0 && Loader::includeModule('im'))
		{
			return [$chatId, new CIMChat($userId)];
		}
		else
		{
			return [$chatId, null];
		}
	}

	/**
	 * @param array $arFields
	 * @param int $parentId
	 * @param array $involvedAttendees
	 * @param bool $isNewEvent
	 *
	 * @return array
	 */
	private function prepareAttendees2(array $arFields, int $parentId, array $involvedAttendees, bool $isNewEvent): array
	{
		$currentAttendeesIndex = [];
		$deletedAttendees = [];

		if (!$isNewEvent)
		{
			$curAttendees = CCalendarEvent::GetAttendees($parentId);
			$curAttendees = is_array($curAttendees[$parentId]) ? $curAttendees[$parentId] : [];
			foreach($curAttendees as $user)
			{
				$currentAttendeesIndex[$user['USER_ID']] = $user;
				if (
					$user['USER_ID'] !== $arFields['MEETING_HOST'] &&
					($user['USER_ID'] !== $arFields['OWNER_ID'] || $arFields['CAL_TYPE'] !== 'user')
				)
				{
					$deletedAttendees[$user['USER_ID']] = $user['USER_ID'];
					$involvedAttendees[] = $user['USER_ID'];
				}
			}
			$involvedAttendees = array_unique($involvedAttendees);
		}

		return [$currentAttendeesIndex, $deletedAttendees, $involvedAttendees];
	}

	/**
	 * @param array $clonedParams
	 * @param array $arFields
	 * @param bool $isExchangeEnabled
	 * @param bool $isCalDavEnabled
	 */
	public function saveToDav(
		array $clonedParams,
		array &$arFields, // is needed to receive it by link?
		bool $isExchangeEnabled,
		bool $isCalDavEnabled
	): void
	{
		if ($isExchangeEnabled || $isCalDavEnabled)
		{
			$this->prepareArFieldBeforeSyncEvent($arFields);

			$currentEvent = CCalendarEvent::GetById($arFields['ID'], false);
			CCalendarSync::DoSaveToDav([
				'bCalDav' => $isCalDavEnabled,
				'bExchange' => $isExchangeEnabled,
				'sectionId' => (int)$currentEvent['SECTION_ID'],
				'modeSync' => $clonedParams['modeSync'],
				'editInstance' => $clonedParams['editInstance'],
				'originalDavXmlId' => $currentEvent['G_EVENT_ID'],
				'instanceTz' => $currentEvent['TZ_FROM'],
				'editParentEvents' => $clonedParams['editParentEvents'],
				'editNextEvents' => $clonedParams['editNextEvents'],
				'syncCaldav' => $clonedParams['syncCaldav'],
				'parentDateFrom' => $currentEvent['DATE_FROM'],
				'parentDateTo' => $currentEvent['DATE_TO'],
			], $arFields, $currentEvent);
		}
	}

	/**
	 * @param array $arFields
	 *
	 * @return void
	 */
	private function prepareArFieldBeforeSyncEvent(array &$arFields): void
	{
		if (is_string($arFields['MEETING']))
		{
			$arFields['MEETING'] = unserialize($arFields['MEETING'], ['allowed_classes' => false]);
		}

		$arFields['MEETING']['LANGUAGE_ID'] = CCalendar::getUserLanguageId((int)$arFields['OWNER_ID']);
	}

	/**
	 * @param array $clonedParams
	 * @param int $parentId
	 * @param int $attendeeId
	 * @param array $arFields
	 * @param bool $isNewEvent
	 *
	 * @return array
	 */
	private function getChildParams(
		array $clonedParams,
		int $parentId,
		int $attendeeId,
		array $arFields,
		bool $isNewEvent
	): array
	{
		$childParams = $clonedParams;
		$childParams['arFields']['CAL_TYPE'] = 'user';
		$childParams['arFields']['PARENT_ID'] = $parentId;
		$childParams['arFields']['OWNER_ID'] = $attendeeId;
		$childParams['arFields']['CREATED_BY'] = $attendeeId;
		$childParams['arFields']['CREATED'] = $arFields['DATE_CREATE'];
		$childParams['arFields']['MODIFIED'] = $arFields['TIMESTAMP_X'];
		$childParams['arFields']['ACCESSIBILITY'] = $arFields['ACCESSIBILITY'];
		$childParams['arFields']['MEETING'] = $arFields['~MEETING'];
		$childParams['arFields']['TEXT_LOCATION'] = CCalendar::GetTextLocation($arFields["LOCATION"]);
		$childParams['arFields']['MEETING_STATUS'] = 'Q';
		$childParams['sendInvitations'] = $clonedParams['sendInvitations'];

		if ((int)$arFields['CREATED_BY'] === $attendeeId)
		{
			$childParams['arFields']['MEETING_STATUS'] = 'Y';
		}
		elseif ($isNewEvent && (int)$arFields['~MEETING']['MEETING_CREATOR'] === $attendeeId)
		{
			$childParams['arFields']['MEETING_STATUS'] = 'Y';
		}
		elseif (
			$clonedParams['saveAttendeesStatus']
			&& $clonedParams['currentEvent']
			&& is_array($clonedParams['currentEvent']['ATTENDEE_LIST'])
		)
		{
			foreach($clonedParams['currentEvent']['ATTENDEE_LIST'] as $currentAttendee)
			{
				if ((int)$currentAttendee['id'] === $attendeeId)
				{
					$childParams['arFields']['MEETING_STATUS'] = $currentAttendee['status'];
					break;
				}
			}
		}
		else
		{
			$childParams['arFields']['MEETING_STATUS'] = 'Q';
		}

		unset(
			$childParams['arFields']['SECTIONS'],
			$childParams['arFields']['SECTION_ID'],
			$childParams['currentEvent'],
			$childParams['arFields']['ID'],
			$childParams['arFields']['DAV_XML_ID'],
			$childParams['arFields']['G_EVENT_ID'],
			$childParams['arFields']['SYNC_STATUS']
		);


		return $childParams;
	}

	/**
	 * @param array $arFields
	 *
	 * @return string
	 *
	 * @throws ObjectException
	 */
	private function generateEventUid(array $arFields): string
	{
		UidGenerator::createInstance()
			->setPortalName(Util::getServerName())
			->setDate(new Date(Util::getDateObject(
				$arFields['DATE_FROM'],
				false,
				$arFields['TZ_FROM'] ?: null
			)))
			->setUserId((int)$arFields['OWNER_ID'])
			->getUidWithDate();
	}

	/**
	 * process dav create and update
	 *
	 * @param array $currentAttendee
	 * @param int $attendeeId
	 * @param array $childParams
	 * @param bool $reinvite
	 * @param array $clonedParams
	 * @return array
	 *
	 * @throws ArgumentException
	 * @throws ObjectException
	 * @throws ObjectPropertyException
	 * @throws SystemException
	 */
	public function davProcess(
		array $currentAttendee = [],
		int $attendeeId,
		array $childParams,
		bool $reinvite,
		array &$clonedParams
	): array
	{
		$isExchangeEnabled = CCalendar::IsExchangeEnabled($attendeeId);
		$isCalDavEnabled = $this->isCalDavEnabled();
		if (!empty($currentAttendee))
		{
			$childParams['arFields']['ID'] = $currentAttendee['EVENT_ID'];

			// TODO: it's have to return part of logic to the core
			// for instance: $childParams values must be changed above
			if (!$reinvite)
			{
				$childParams['arFields']['MEETING_STATUS'] = $currentAttendee['STATUS'];

				$childParams['sendInvitations'] = $childParams['sendInvitations']
					&& $currentAttendee['STATUS']
					!== 'Q';
			}
			if (
				$clonedParams['sendInvitesToDeclined']
				&& $childParams['arFields']['MEETING_STATUS'] === 'N'
			)
			{
				$childParams['arFields']['MEETING_STATUS'] = 'Q';
				$childParams['sendInvitations'] = true;
			}
			// TODO: save existed event to dav
			$this->saveToDav($clonedParams, $childParams['arFields'], $isExchangeEnabled, $isCalDavEnabled);
		}
		else
		{
			$childSectId = CCalendar::GetMeetingSection($attendeeId, true);
			if ($childSectId)
			{
				$childParams['arFields']['SECTIONS'] = [$childSectId];
			}

			if (empty($childParams['arFields']['DAV_XML_ID']) && !$clonedParams['editInstance'])
			{
				$childParams['arFields']['DAV_XML_ID'] = CCalendarEvent::getUidForChildEvent($childParams['arFields']);
			}

			$parentEvent = Internals\EventTable::query()
				->where('PARENT_ID', (int)$childParams['arFields']['RECURRENCE_ID'])
				->where('OWNER_ID', (int)$childParams['arFields']['OWNER_ID'])
				->setSelect(['*'])
				->exec()
				->fetch() ?: [];

			if ($parentEvent)
			{
				$childParams['arFields']['DAV_XML_ID'] = $parentEvent['DAV_XML_ID'];
			}
			else
			{
				$childParams['arFields']['DAV_XML_ID'] = $this->generateEventUid($childParams['arFields']);
				unset(
					$childParams['arFields']['ORIGINAL_DATE_FROM'],
					$childParams['arFields']['RECURRENCE_ID'],
					$clonedParams['recursionEditMode']
				);
			}

			// TODO: save new event to dav
			// CalDav & Exchange
			if ($isExchangeEnabled || $isCalDavEnabled)
			{
				CCalendarSync::DoSaveToDav([
					'bCalDav' => $isCalDavEnabled,
					'bExchange' => $isExchangeEnabled,
					'sectionId' => $childSectId,
					'modeSync' => $clonedParams['modeSync'],
					'editInstance' => $clonedParams['editInstance'],
					'originalDavXmlId' => $parentEvent['G_EVENT_ID'],
					'instanceTz' => $parentEvent['TZ_FROM'],
					'editParentEvents' => $clonedParams['editParentEvents'],
					'editNextEvents' => $clonedParams['editNextEvents'],
					'syncCaldav' => $clonedParams['syncCaldav'],
					'parentDateFrom' => $parentEvent['DATE_FROM'],
					'parentDateTo' => $parentEvent['DATE_TO'],
				], $childParams['arFields']);
			}
		}

		return $childParams;
	}

	/**
	 * @return bool
	 */
	private function isCalDavEnabled(): bool
	{
		static $result = null;
		if ($result === null)
		{
			$result = CCalendar::IsCalDAVEnabled();
		}
		return $result;
	}

	/**
	 * @param int $eventId
	 * @param int $userId
	 * @return array|null
	 */
	private function getEvent(int $eventId, int $userId): ?array
	{
		$curEvent = CCalendarEvent::GetList(
			[
				'arFilter' => [
					"ID" => $eventId,
					"DELETED" => 'N',
				],
				'parseRecursion' => false,
				'fetchAttendees' => true,
				'fetchMeetings' => false,
				'userId' => $userId
			]
		);

		if ($curEvent)
		{
			return $curEvent[0];
		}
		return null;
	}

	private function checkExternalMailUserLimit(?array $attendee = null, $isNewEvent): bool
	{
		// TODO: there is checking of external user limits
		if (
			$attendee
			&& $attendee['EXTERNAL_AUTH_ID'] === 'email'
			&& $isNewEvent
			&& !$this->isIncreaseMailLimit
		)
		{
			if (Bitrix24Manager::isEventWithEmailGuestAllowed())
			{
				Bitrix24Manager::increaseEventWithEmailGuestAmount();
				$this->isIncreaseMailLimit = true;
			}
			else
			{
				// Just skip external emil users if they are not allowed
				// We will show warning on the client's side
				return false;
			}
		}

		return true;
	}/**
 * @param array $userIndex
 * @param int $attendeeId
 * @param array $clonedParams
 * @param array $changeFields
 * @param bool $isPastEvent
 * @param $attaches
 * @param array $arFields
 * @param int $parentId
 * @param $arFields1
 * @param $id
 * @param array $attendees
 * @param array $eventManagersCollection
 * @param $currentAttendeesIndex
 * @param $meetingInfo
 * @return array
 * @throws ArgumentException
 * @throws LoaderException
 * @throws ObjectPropertyException
 * @throws SystemException
 * @throws \Bitrix\Main\NotImplementedException
 *
 * // TODO: implement it (decrease params and set return type  bool)
 */
	public function processMailUser(array $userIndex, int $attendeeId, array $clonedParams, array $changeFields,
		bool $isPastEvent, $attaches, array $arFields, int $parentId, $arFields1, $id, array $attendees,
		array $eventManagersCollection, $currentAttendeesIndex, $meetingInfo): array
	{
		if (
			!empty($userIndex[$attendeeId])
			&& $userIndex[$attendeeId]['EXTERNAL_AUTH_ID'] === 'email'
			&& ((!$clonedParams['fromWebservice']) || !empty($changeFields))
			&& !$isPastEvent
		)
		{
			if (empty($attaches))
			{
				$isChangeFiles = false;
				$attaches = MailInvitation\Helper::getMailAttaches($clonedParams['UF'], $arFields['MEETING_HOST'],
					$parentId, $isChangeFiles);
				if ($isChangeFiles)
				{
					$changeFields[] = [
						'fieldKey' => 'FILES',
					];
				}
			}

			$sender = CCalendarEvent::getSenderForIcal($userIndex, $arFields1['MEETING_HOST']);

			if (empty($sender['ID']))
			{
				// TODO: return false
				// continue;
			}

			if (
				!empty($email = CCalendarEvent::getSenderEmailForIcal($arFields['MEETING']))
				&& !CCalendarEvent::$isAddIcalFailEmailError
			)
			{
				$sender['EMAIL'] = $email;
			}
			else
			{
				CCalendar::ThrowError(GetMessage("EC_ICAL_NOTICE_DO_NOT_SET_EMAIL"));
				CCalendarEvent::$isAddIcalFailEmailError = true;
				// TODO: return false
				// continue;
			}
			$additionalChildArFields['ATTACHES'] = $attaches;
			$additionalChildArFields['ID'] = $id;
			$additionalChildArFields['ICAL_ORGANIZER'] = CCalendarEvent::getOrganizerForIcal($userIndex,
				(int)$arFields1['MEETING_HOST'], $sender['EMAIL']);
			$additionalChildArFields['ICAL_ATTENDEES'] = CCalendarEvent::createMailAttendeesCollection(
				$userIndex,
				$arFields1['MEETING']['HIDE_GUESTS'] ?? true,
				[$attendeeId, $arFields1['MEETING_HOST']],
				$attendees
			);
			$additionalChildArFields['ICAL_ATTACHES'] = $attaches;

			if (count($eventManagersCollection) <= 3)
			{
				if ($currentAttendeesIndex)
				{
					if (
						count($changeFields) !== 1
						|| $changeFields[0]['fieldKey'] !== 'ATTENDEES'
						|| !$meetingInfo['HIDE_GUESTS']
					)
					{
						$eventManagersCollection[] = SenderEditInvitation::createInstance(
							array_merge(
								CCalendarEvent::prepareChildParamsForIcalInvitation($arFields1),
								$additionalChildArFields
							),
							IcalMailContext::createInstance(
								CCalendarEvent::getMailAddresser($sender, $meetingInfo['MAIL_FROM']),
								CCalendarEvent::getMailReceiver($userIndex[$attendeeId])
							)->setChangeFields($changeFields)
						);
					}
				}
				else
				{
					$eventManagersCollection[] = SenderRequestInvitation::createInstance(
						array_merge(
							CCalendarEvent::prepareChildParamsForIcalInvitation($arFields1),
							$additionalChildArFields
						),
						IcalMailContext::createInstance(
							CCalendarEvent::getMailAddresser($sender, $meetingInfo['MAIL_FROM']),
							CCalendarEvent::getMailReceiver($userIndex[$attendeeId])
						)
					);
				}
			}
			else
			{
				MailInvitationManager::createAgentSent($eventManagersCollection);
				$eventManagersCollection = [];
			}

			unset($additionalChildArFields);
		}
		return array($userIndex, $isChangeFiles, $sender, $email, $additionalChildArFields, $eventManagersCollection);
	}
}