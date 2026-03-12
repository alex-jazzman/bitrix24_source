<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Calendar\Core\Event\Tools\Dictionary;
use Bitrix\Calendar\Util;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\Web\Json;
use Bitrix\Forum\TopicTable;
use Bitrix\Forum\MessageTable;
use Bitrix\Im\Model\ChatTable;

class CBPCalendarGetInform extends BaseActivity implements IBPConfigurableActivity
{
	private const CALENDAR_TYPE_USER = 'user';
	private const CALENDAR_USER = 'CalendarUser';
	private const CALENDAR_FROM = 'CalendarFrom';
	private const CALENDAR_TO = 'CalendarTo';
	private const RETURN_PARAM_JSON = 'ResultJson';
	private const RETURN_PARAM_AI = 'ResultJsonAi';
	private const RETURN_EVENTS_COUNT = 'EventsCount';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			self::CALENDAR_USER => '',
			self::CALENDAR_FROM => '',
			self::CALENDAR_TO => '',
			self::RETURN_PARAM_JSON => '',
			self::RETURN_PARAM_AI => '',
			self::RETURN_EVENTS_COUNT => '',
		];

		$this->setPropertiesTypes(
			[
				self::CALENDAR_USER => ['Type' => FieldType::USER,],
				self::CALENDAR_FROM => ['Type' => FieldType::DATETIME,],
				self::CALENDAR_TO => ['Type' => FieldType::DATETIME,],
				self::RETURN_PARAM_JSON  => ['Type' => FieldType::STRING],
				self::RETURN_PARAM_AI => ['Type' => FieldType::STRING],
				self::RETURN_EVENTS_COUNT => ['Type' => FieldType::INT],
			],
		);
	}

	protected function reInitialize(): void
	{
		$this->{self::RETURN_PARAM_JSON} = null;
		$this->{self::RETURN_PARAM_AI} = null;
		$this->{self::RETURN_EVENTS_COUNT} = null;

		parent::reInitialize();
	}

	public function execute(): int
	{
		$user = CBPHelper::extractFirstUser($this->{self::CALENDAR_USER}, $this->getDocumentId());

		$fromTs = CBPHelper::makeTimestamp($this->{self::CALENDAR_FROM});
		$toTs = CBPHelper::makeTimestamp($this->{self::CALENDAR_TO});

		$maxDuration = 31 * 24 * 3600;
		if (($toTs - $fromTs) > $maxDuration)
		{
			$toTs = $fromTs + $maxDuration;
		}

		$results = $this->fetchEventsForUser($user, $fromTs, $toTs);

		$this->{self::RETURN_PARAM_JSON} = Json::encode($results);
		$this->{self::RETURN_PARAM_AI} = Json::encode($this->prepareResultsForAi($results));
		$this->{self::RETURN_EVENTS_COUNT} = count($results);

		return CBPActivityExecutionStatus::Closed;
	}

	public static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::CALENDAR_USER => [
				'Name' => Loc::getMessage('BPSNMA_PD_CUSER'),
				'FieldName' => self::CALENDAR_USER,
				'Type' => FieldType::USER,
				'Required' => true,
			],
			self::CALENDAR_FROM => [
				'Name' => Loc::getMessage('BPSNMA_PD_CFROM'),
				'FieldName' => self::CALENDAR_FROM,
				'Type' => FieldType::DATETIME,
				'Required' => true,
			],
			self::CALENDAR_TO => [
				'Name' => Loc::getMessage('BPSNMA_PD_CTO'),
				'FieldName' => self::CALENDAR_TO,
				'Type' => FieldType::DATETIME,
				'Required' => true,
			],
		];
	}

	public static function getPropertiesDialogMap(?PropertiesDialog $dialog = null): array
	{
		return static::getPropertiesMap([]);
	}

	public static function getPropertiesDialogValues(
		$documentType,
		$activityName,
		&$workflowTemplate,
		&$workflowParameters,
		&$workflowVariables,
		$currentValues,
		&$errors,
	): bool
	{
		$properties = [];
		$errors = [];

		$documentService = CBPRuntime::getRuntime()->getDocumentService();
		foreach (static::getPropertiesMap($documentType) as $id => $property)
		{
			$value = $documentService->getFieldInputValue(
				$documentType,
				$property,
				$property['FieldName'],
				$currentValues,
				$errors,
			);

			if (!empty($errors))
			{
				return false;
			}

			$properties[$id] = $value;
		}

		$errors = self::validateProperties(
			$properties,
			new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser),
		);

		if ($errors)
		{
			return false;
		}

		$currentActivity = &CBPWorkflowTemplateLoader::findActivityByName($workflowTemplate, $activityName);
		$currentActivity['Properties'] = $properties;

		return true;
	}
	private function fetchEventsForUser(int $userId, int $fromTs, int $toTs): array
	{
		if (!Loader::includeModule('calendar'))
		{
			return [];
		}

		$dateFrom = Util::formatDateTimeTimestampUTC($fromTs);
		$dateTo = Util::formatDateTimeTimestampUTC($toTs);

		$events = \CCalendarEvent::GetList(
			[
				'arFilter' => [
					'FROM_LIMIT' => $dateFrom,
					'TO_LIMIT' => $dateTo,
					'CAL_TYPE' => [Dictionary::CALENDAR_TYPE[self::CALENDAR_TYPE_USER]],
					'OWNER_ID' => [$userId],
					'ACTIVE_SECTION' => 'Y',
				],
				'parseRecursion' => true,
				'fetchAttendees' => true,
				'fetchSection' => true,
				'setDefaultLimit' => false,
				'checkPermissions' => false,
			],
		);

		$uniqueEvents = [];
		foreach ($events as $event)
		{
			$key = $event['ID'] . '|' . ($event['DATE_FROM'] ?? '');
			if (!isset($uniqueEvents[$key]))
			{
				$uniqueEvents[$key] = $event;
			}
		}
		$events = array_values($uniqueEvents);
		$events = array_filter($events, fn(array $event) => !$this->isDeclinedMeeting($event));

		return $this->formatEvents($events);
	}

	private function formatEvents(array $events): array
	{
		$result = [];

		$eventsAttendees = $this->formatAttendees($events);
		$eventsComments = $this->fetchCommentsForEvents($events);
		$eventsChats = $this->fetchChatsForEvents($events);

		foreach ($events as $key => $event)
		{
			$result[] = [
				'id' => $event['ID'],
				'name' => $event['NAME'],
				'description' => $event['DESCRIPTION'] ?? null,
				'location' => $event['LOCATION'] ?? null,
				'dateFrom' => $event['DATE_FROM'] ?? null,
				'dateTo' => $event['DATE_TO'] ?? null,
				'ownerId' => $event['OWNER_ID'] ?? null,
				'isMeeting' => (bool)($event['IS_MEETING'] ?? false),
				'meetingStatus' => $event['MEETING_STATUS'] ?? null,
				'attendees' => $eventsAttendees[$key] ?? [],
				'comments' => $eventsComments[$event['ID']] ?? [],
				'chat' => $eventsChats[$event['ID']] ?? null,
			];
		}

		return $result;
	}

	private function isDeclinedMeeting(array $event): bool
	{
		return !empty($event['IS_MEETING']) && ($event['MEETING_STATUS'] ?? '') === 'N';
	}

	private function formatAttendees(array $events): array
	{
		$attendeeIds = $this->getUniqueAttendeeIds($events);

		$userNames = $this->getUserNames($attendeeIds);

		return $this->formatEventAttendees($events, $userNames);
	}

	private function getUniqueAttendeeIds(array $events): array
	{
		$attendeeIds = [];
		foreach ($events as $event)
		{
			if (isset($event['ATTENDEE_LIST']) && is_array($event['ATTENDEE_LIST']))
			{
				foreach ($event['ATTENDEE_LIST'] as $attendee)
				{
					if (isset($attendee['id']))
					{
						$attendeeIds[] = (int)$attendee['id'];
					}
				}
			}
		}

		return array_unique($attendeeIds);
	}

	private function formatEventAttendees(array $events, array $userNames): array
	{
		$result = [];

		$participationStatus = [
			'H' => 'Host',
			'Q' => 'Invited',
			'Y' => 'Accepted',
			'N' => 'Declined',
		];

		foreach ($events as $key => $event)
		{
			$attendees = [];
			$attendeeList = $event['ATTENDEE_LIST'] ?? [];

			if (is_array($attendeeList))
			{
				foreach ($attendeeList as $attendee)
				{
					$attendees[] = [
						'id' => $attendee['id'] ?? null,
						'name' => $userNames[$attendee['id']] ?? null,
						'participationStatus' => !empty($attendee['status'])
							? $participationStatus[$attendee['status']] : null,
					];
				}
			}
			$result[$key] = $attendees;
		}

		return $result;
	}

	private function fetchCommentsForEvents(array $events): array
	{
		if (!Loader::includeModule('forum'))
		{
			return [];
		}

		$forumId = (int)(\CCalendar::GetSettings()['forum_id'] ?? null);
		if (!$forumId)
		{
			return [];
		}

		$eventMap = $this->getEventXmlIds($events);
		if (empty($eventMap))
		{
			return [];
		}

		$topics = $this->fetchTopics($forumId, $eventMap);
		if (empty($topics))
		{
			return [];
		}

		$topicMap = array_column($topics, 'XML_ID', 'ID');
		if (empty($topicMap))
		{
			return [];
		}

		$messages = $this->fetchMessages($forumId, array_keys($topicMap));
		if (empty($messages))
		{
			return [];
		}

		return $this->mapMessagesToEvents($messages, $topicMap, $eventMap);
	}

	private function getEventXmlIds(array $events): array
	{
		$eventMap = [];
		foreach ($events as $event)
		{
			$xmlId = !empty($event['RELATIONS']['COMMENT_XML_ID'])
				? $event['RELATIONS']['COMMENT_XML_ID']
				: 'EVENT_' . ($event['PARENT_ID'] ? : $event['ID']);

			if ($xmlId)
			{
				$eventMap[$event['ID']] = $xmlId;
			}
		}

		return $eventMap;
	}

	private function fetchTopics(int $forumId, array $xmlIds): array
	{
		return TopicTable::query()
			->setSelect(['ID', 'XML_ID'])
			->where('FORUM_ID', $forumId)
			->whereIn('XML_ID', array_values($xmlIds))
			->exec()
			->fetchAll()
		;
	}

	private function fetchMessages(int $forumId, array $topicIds): array
	{
		return MessageTable::query()
			->setSelect(['ID', 'TOPIC_ID', 'AUTHOR_ID', 'AUTHOR_NAME', 'POST_MESSAGE', 'POST_DATE'])
			->where('FORUM_ID', $forumId)
			->whereIn('TOPIC_ID', $topicIds)
			->whereNotNull('AUTHOR_ID')
			->setOrder(['ID' => 'ASC'])
			->exec()
			->fetchAll()
		;
	}

	private function mapMessagesToEvents(array $messages, array $topicMap, array $eventMap): array
	{
		$commentsByXmlId = [];
		foreach ($messages as $message)
		{
			$xmlId = $topicMap[$message['TOPIC_ID']] ?? null;
			if (!$xmlId)
			{
				continue;
			}

			$postDate = $message['POST_DATE'];
			if ($postDate instanceof DateTime)
			{
				$postDate = $postDate->toString();
			}

			$commentsByXmlId[$xmlId][] = [
				'id' => $message['ID'],
				'authorId' => $message['AUTHOR_ID'],
				'authorName' => $message['AUTHOR_NAME'],
				'postMessage' => $message['POST_MESSAGE'],
				'postDate' => $postDate,
			];
		}

		$result = [];
		foreach ($eventMap as $eventId => $xmlId)
		{
			if (isset($commentsByXmlId[$xmlId]))
			{
				$result[$eventId] = $commentsByXmlId[$xmlId];
			}
		}

		return $result;
	}

	private function fetchChatsForEvents(array $events): array
	{
		if (!Loader::includeModule('im'))
		{
			return [];
		}

		$chatIds = $this->getEventChatIds($events);
		if (empty($chatIds))
		{
			return [];
		}

		$chatsData = $this->fetchChats(array_unique(array_values($chatIds)));

		return $this->mapChatsToEvents($chatIds, $chatsData);
	}

	private function getEventChatIds(array $events): array
	{
		$chatIds = [];
		foreach ($events as $event)
		{
			if (!empty($event['MEETING']['CHAT_ID']))
			{
				$chatIds[$event['ID']] = (int)$event['MEETING']['CHAT_ID'];
			}
		}

		return $chatIds;
	}

	private function fetchChats(array $chatIds): array
	{
		$chatsData = [];

		$chats = ChatTable::query()
			->setSelect(['ID', 'TITLE', 'TYPE', 'AUTHOR_ID'])
			->whereIn('ID', $chatIds)
			->exec()
			->fetchAll()
		;

		foreach ($chats as $chat)
		{
			$chatsData[$chat['ID']] = [
				'chatId' => (int)$chat['ID'],
				'title' => $chat['TITLE'],
				'type' => $chat['TYPE'],
				'ownerId' => (int)$chat['AUTHOR_ID'],
			];
		}

		return $chatsData;
	}

	private function mapChatsToEvents(array $chatIds, array $chatsData): array
	{
		$result = [];
		foreach ($chatIds as $eventId => $chatId)
		{
			if (isset($chatsData[$chatId]))
			{
				$result[$eventId] = $chatsData[$chatId];
			}
			else
			{
				$result[$eventId] = ['chatId' => $chatId];
			}
		}

		return $result;
	}

	private function prepareResultsForAi(array $results): array
	{
		if (empty($results))
		{
			return [];
		}

		$cleanResults = [];

		foreach ($results as $event)
		{
			$cleanResults[] = $this->cleanEventForAi($event);
		}

		return $cleanResults;
	}

	private function getUserNames(array $userIds): array
	{
		if (empty($userIds))
		{
			return [];
		}

		$names = [];
		$res = \Bitrix\Main\UserTable::query()
			->setSelect(['ID', 'NAME', 'LAST_NAME'])
			->whereIn('ID', $userIds)
			->exec()
		;

		while ($user = $res->fetch())
		{
			$names[$user['ID']] = \CUser::FormatName(\CSite::GetNameFormat(), $user, true, false);
		}

		return $names;
	}

	private function cleanEventForAi(array $event): array
	{
		$cleanEvent = [
			'name' => $event['name'],
			'description' => $event['description'],
			'location' => $event['location'],
			'dateFrom' => $event['dateFrom'],
			'dateTo' => $event['dateTo'],
			'isMeeting' => $event['isMeeting'],
			'meetingStatus' => $event['meetingStatus'],
		];

		if (!empty($event['attendees']))
		{
			foreach ($event['attendees'] as $attendee)
			{
				$cleanEvent['attendees'][] = [
					'name' => $attendee['name'],
					'participationStatus' => $attendee['participationStatus'],
				];
			}
		}

		if (!empty($event['comments']))
		{
			foreach ($event['comments'] as $comment)
			{
				$cleanEvent['comments'][] = [
					'authorName' => $comment['authorName'],
					'postMessage' => $comment['postMessage'],
					'postDate' => $comment['postDate'],
				];
			}
		}

		if (!empty($event['chat']))
		{
			$cleanEvent['chat'] = [
				'title' => $event['chat']['title'] ?? null,
				'type' => $event['chat']['type'] ?? null,
			];
		}

		return $cleanEvent;
	}

	protected static function getFileName(): string
	{
		return __FILE__;
	}
}
