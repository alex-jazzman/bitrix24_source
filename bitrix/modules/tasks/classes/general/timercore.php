<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage tasks
 * @copyright 2001-2013 Bitrix
 */

use Bitrix\Main\Application;

/**
 * This class is for internal use only, it can be changed any way without
 * notifications. Use CTaskTimerManager instead.
 *
 * @access private
 */
final class CTaskTimerCore
{
	/**
	 * @deprecated
	 * @TasksV2
	 * @internal
	 * @use \Bitrix\Tasks\V2\Internals\Service\Task\TimerService
	 */
	public static function start($userId, $taskId)
	{
		if ($taskId < 1)
		{
			CTaskAssert::logError('[0xf119fc40] invalid taskId: ' . $taskId);
			CTaskAssert::assert(false);
		}

		if (\Bitrix\Tasks\V2\FormV2Feature::isOn('timer'))
		{
			$service = \Bitrix\Tasks\V2\Internals\Container::getInstance()->getTimerService();

			$timer = $service->start((int)$userId, (int)$taskId);

			return [
				'TASK_ID' => $timer->taskId,
				'USER_ID' => $timer->userId,
				'TIMER_STARTED_AT' => $timer->startedAtTs,
				'TIMER_ACCUMULATOR' => $timer->seconds,
			];
		}

		global $DB;

		$userId = (int) $userId;
		$taskId = (int) $taskId;

		$ts = time();
		if ($ts < 1)
		{
			CTaskAssert::logError('[0x574ed9ab] current unix timestamp is in past, check system time');
			CTaskAssert::assert(false);
		}

		$DB->query(
			"UPDATE b_tasks_timer 
			SET TASK_ID = $taskId, TIMER_STARTED_AT = $ts, TIMER_ACCUMULATOR = 0
			WHERE USER_ID = $userId"
		);

		$arData = self::get($userId);
		if ($arData === false)		// there is no timer in DB?
		{
			// create it
			$sql = Application::getConnection()->getSqlHelper()->getInsertIgnore(
				'b_tasks_timer',
				' (USER_ID, TASK_ID, TIMER_STARTED_AT, TIMER_ACCUMULATOR)',
				" VALUES ({$userId}, {$taskId}, {$ts}, 0)"
			);
			$DB->query($sql);

			$arData = self::get($userId);
		}

		// Some other timer can be started between our queries, so check it.
		if ((int) $arData['TASK_ID'] !== $taskId)
			return (false);

		return ($arData);
	}


//	/**
//     * @param $userId
//     * @param $taskId
//	 * @return void
//	 */
//	private static function pause($userId, $taskId)
//	{
//        global $DB;
//
//		$ts = time();
//
//		$DB->query(
//			"UPDATE b_tasks_timer
//			SET TIMER_ACCUMULATOR = TIMER_ACCUMULATOR + ($ts - TIMER_STARTED_AT),
//				TIMER_STARTED_AT = 0
//			WHERE
//				USER_ID = " . (int) $userId . "
//				AND TASK_ID = " . (int) $taskId . "
//				AND TIMER_STARTED_AT != 0
//				AND TIMER_STARTED_AT <= $ts"
//		);
//	}


	/**
	 * @deprecated
	 * @TasksV2
	 * @internal
	 * @use \Bitrix\Tasks\V2\Internals\Service\Task\TimerService
	 */
	public static function stop($userId, $taskId = 0)
	{
		if (\Bitrix\Tasks\V2\FormV2Feature::isOn('timer'))
		{
			$service = \Bitrix\Tasks\V2\Internals\Container::getInstance()->getTimerService();

			$timer = $service->stop((int)$userId, (int)$taskId);
			if ($timer === null)
			{
				return false;
			}

			return [
				'TASK_ID' => $timer->taskId,
				'USER_ID' => $timer->userId,
				'TIMER_STARTED_AT' => $timer->startedAtTs,
				'TIMER_ACCUMULATOR' => $timer->seconds,
			];
		}

		global $DB;

		$ts = time();
		if ($ts < 1)
		{
			CTaskAssert::logError('[0x03ad8b00] current unix timestamp is in past, check system time');
			CTaskAssert::assert(false);
		}

		$arData = self::get($userId, $taskId);
		if (
			($arData !== false)
			&& (
				($arData['TIMER_STARTED_AT'] != 0)
				|| ($arData['TIMER_ACCUMULATOR'] != 0)
			)
		)
		{
			$DB->query(
				"UPDATE b_tasks_timer 
				SET TIMER_ACCUMULATOR = 0, TIMER_STARTED_AT = 0
				WHERE
					USER_ID = " . (int) $userId . "
					AND TASK_ID = " . (int) $arData['TASK_ID']
			);

			if (($arData['TIMER_STARTED_AT'] > 0) && ($ts > $arData['TIMER_STARTED_AT']))
				$arData['TIMER_ACCUMULATOR'] += ($ts - $arData['TIMER_STARTED_AT']);

			return ($arData);
		}
		else
			return (false);
	}

	/**
	 * @deprecated
	 * @TasksV2
	 * @internal
	 * @use \Bitrix\Tasks\V2\Internals\Repository\TimerRepositoryInterface
	 */
	public static function get($userId, $taskId = 0)
	{
		if (\Bitrix\Tasks\V2\FormV2Feature::isOn('timer'))
		{
			$repository = \Bitrix\Tasks\V2\Internals\Container::getInstance()->getTimerRepository();

			$timer = $repository->get((int)$userId, (int)$taskId);
			if ($timer === null)
			{
				return false;
			}

			return [
				'TASK_ID' => $timer->taskId,
				'USER_ID' => $timer->userId,
				'TIMER_STARTED_AT' => $timer->startedAtTs,
				'TIMER_ACCUMULATOR' => $timer->seconds,
			];
		}

		global $DB;

		$rs = $DB->query(
			"SELECT TASK_ID, USER_ID, TIMER_STARTED_AT, TIMER_ACCUMULATOR 
			FROM b_tasks_timer
			WHERE USER_ID = " . (int) $userId . " AND TASK_ID ".($taskId ? ' = '.intval($taskId) : ' != 0')
		);

		if ($ar = $rs->fetch())
			return ($ar);
		else
			return (false);
	}

	/**
	 * @deprecated
	 * Not in use and will be removed
	 */
	public static function getByTaskId($taskId)
	{
		global $DB;

		$rs = $DB->query(
			"SELECT TASK_ID, USER_ID, TIMER_STARTED_AT, TIMER_ACCUMULATOR 
			FROM b_tasks_timer
			WHERE TASK_ID = " . (int) $taskId
		);

		$arTimers = array();

		while ($arTimer = $rs->fetch())
			$arTimers[] = $arTimer;

		return ($arTimers);
	}
}