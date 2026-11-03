<?php

if (!defined('NO_KEEP_STATISTIC'))
{
	define("NO_KEEP_STATISTIC", true);
}

define("BX_STATISTIC_BUFFER_USED", false);
define("NO_LANG_FILES", true);
define("NOT_CHECK_PERMISSIONS", true);
define("BX_PUBLIC_TOOLS", true);
define("ADMIN_SECTION", true); // mantiss: 52059

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/bx_root.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

if (!CModule::IncludeModule("calendar") || !class_exists("CCalendar"))
{
	return;
}

use Bitrix\Calendar\Core\Event\Tools\Dictionary;
use Bitrix\Calendar\Core\Mappers\Factory;
use Bitrix\Calendar\Internals\Helper\Analytics;
use Bitrix\Calendar\Util;
use Bitrix\Main\Analytics\AnalyticsEvent;
use Bitrix\Main\DI\ServiceLocator;

$event_feed_action = $_REQUEST["event_feed_action"];
if (!empty($event_feed_action) && check_bitrix_sessid())
{
	$GLOBALS["APPLICATION"]->ShowAjaxHead();
	$userId = $GLOBALS["USER"]->GetId();
	$eventId = (int)$_REQUEST['event_id'] ?? null;

	if ($event_feed_action === 'delete_event')
	{
		$res = CCalendar::DeleteEvent($eventId);
		if ($res)
		{
			echo '#EVENT_FEED_RESULT_OK#';
		}
	}
	else
	{
		$status = false;
		if ($event_feed_action === 'decline')
		{
			$status = 'N';
		}
		elseif($event_feed_action === 'accept')
		{
			$status = 'Y';
		}

		if ($status && $eventId)
		{
			$meetingStatusResult = CCalendarEvent::SetMeetingStatusEx([
				'attendeeId' => $userId,
				'eventId' => $eventId,
				'parentId' => (int)($_REQUEST['parent_id'] ?? null),
				'status' => $status,
				'reccurentMode' => in_array($_REQUEST['reccurent_mode'] ?? null, ['this', 'next', 'all'])
					? $_REQUEST['reccurent_mode']
					: false
				,
				'currentDateFrom' => CCalendar::Date(CCalendar::Timestamp($_REQUEST['current_date_from'] ?? null), false)
			]);

			if ($meetingStatusResult === false)
			{
				return;
			}

			/** @var Factory $mapperFactory */
			$mapperFactory = ServiceLocator::getInstance()->get('calendar.service.mappers.factory');
			$calendarEvent = $mapperFactory->getEvent()->getById($eventId);
			$section = $calendarEvent?->getSection();
			$isGroupSection = $section?->getType() === Dictionary::CALENDAR_TYPE['group'];
			$groupId = $isGroupSection ? $section?->getOwnerId() : null;

			if ($groupId)
			{
				$userType = match (true)
				{
					Util::isCollabUser((int)$userId) => Analytics::USER_TYPES['collaber'],
					Util::isExtranetUser((int)$userId) => Analytics::USER_TYPES['extranet'],
					default => Analytics::USER_TYPES['intranet'],
				};

				if ($status === 'Y')
				{
					Analytics::getInstance()->onEventAccept(
						eventId: $eventId,
						userId: $userId,
						groupId: $groupId,
						subSection: Analytics::SUB_SECTION['stream'],
						userType: $userType,
						status: AnalyticsEvent::STATUS_SUCCESS,
					);
				}
				elseif ($status === 'N')
				{
					Analytics::getInstance()->onEventDecline(
						eventId: $eventId,
						userId: $userId,
						groupId: $groupId,
						subSection: Analytics::SUB_SECTION['stream'],
						userType: $userType,
						status: AnalyticsEvent::STATUS_SUCCESS,
					);
				}
			}

			$events = CCalendarEvent::GetList([
				'arFilter' => [
					"ID" => $eventId,
					"DELETED" => "N"
				],
				'parseRecursion' => false,
				'fetchAttendees' => true,
				'checkPermissions' => true,
				'setDefaultLimit' => false
			]);

			if ($events && is_array($events[0]) && $events[0]['IS_MEETING'])
			{
				$ajaxParams = $_REQUEST['ajax_params'];

				if (isset($ajaxParams["MOBILE"]) && $ajaxParams["MOBILE"] === "Y")
				{
					$result = ['ACCEPTED_ATTENDEES_COUNT' => 0,'DECLINED_ATTENDEES_COUNT' => 0];

					if (!empty($events[0]['ATTENDEE_LIST']) && is_array($events[0]['ATTENDEE_LIST']))
					{
						foreach($events[0]['ATTENDEE_LIST'] as $i => $attendee)
						{
							if ($attendee['status'] === "Y" || $attendee['status'] === 'H')
							{
								$result['ACCEPTED_ATTENDEES_COUNT']++;
							}
							elseif ($attendee['STATUS'] === "N")
							{
								$result['DECLINED_ATTENDEES_COUNT']++;
							}
						}
					}

					if ($result['ACCEPTED_ATTENDEES_COUNT'] > 0)
					{
						$result['ACCEPTED_ATTENDEES_MESSAGE'] = CCalendar::GetAttendeesMessage($result['ACCEPTED_ATTENDEES_COUNT']);
					}
					if ($result['DECLINED_ATTENDEES_COUNT'] > 0)
					{
						$result['DECLINED_ATTENDEES_MESSAGE'] = CCalendar::GetAttendeesMessage($result['DECLINED_ATTENDEES_COUNT']);
					}
				}
				else
				{
					$result = [
						'ACCEPTED_ATTENDEES' => [],
						'DECLINED_ATTENDEES' => [],
						'ACCEPTED_PARAMS' => ["prefix" => "y"],
						'DECLIINED_PARAMS' => ["prefix" => "n"],
					];

					if (!empty($events[0]['ATTENDEE_LIST']) && is_array($events[0]['ATTENDEE_LIST']))
					{
						$userIndex = CCalendarEvent::getUserIndex();
						foreach($events[0]['ATTENDEE_LIST'] as $i => $attendee)
						{
							if (isset($userIndex[$attendee["id"]]))
							{
								if ($attendee['status'] === "Y" || $attendee['status'] === 'H')
								{
									$result['ACCEPTED_ATTENDEES'][] = $userIndex[$attendee["id"]];
								}
								elseif ($attendee['status'] === "N")
								{
									$result['DECLINED_ATTENDEES'][] = $userIndex[$attendee["id"]];
								}
							}
						}
					}
					$moreCountAcc = count($result['ACCEPTED_ATTENDEES']) - $ajaxParams['ATTENDEES_SHOWN_COUNT'];
					$moreCountDec = count($result['DECLINED_ATTENDEES']) - $ajaxParams['ATTENDEES_SHOWN_COUNT'];

					if ($moreCountAcc > 0)
					{
						$result['ACCEPTED_PARAMS']['MORE_MESSAGE'] = CCalendar::GetMoreAttendeesMessage($moreCountAcc);
					}
					if ($moreCountDec > 0)
					{
						$result['DECLINED_PARAMS']['MORE_MESSAGE'] = CCalendar::GetMoreAttendeesMessage($moreCountDec);
					}
				}

				?>
				<script>
					window.ViewEventManager.requestResult = <?=CUtil::PhpToJSObject($result)?>;
				</script>
				<?
			}
			echo '#EVENT_FEED_RESULT_OK#';
		}
	}
	CMain::FinalActions();
	die();
}
?>