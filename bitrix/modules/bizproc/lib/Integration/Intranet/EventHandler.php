<?php

namespace Bitrix\Bizproc\Integration\Intranet;

use Bitrix\Bizproc\Integration;
use Bitrix\Bizproc\Internal\Service\Feature\BpDesignerFeature;
use Bitrix\Bizproc\Public\Activity\Trigger\ContextFields\AbsenceBaseTrigger;
use Bitrix\Bizproc\Starter\Dto\ContextDto;
use Bitrix\Bizproc\Starter\Enum\Scenario;
use Bitrix\Bizproc\Starter\Starter;
use Bitrix\Intranet\Entity\User;
use Bitrix\Main;
use Bitrix\Main\Event;
use Bitrix\Main\Loader;
use Bitrix\Main\Type\DateTime;

/**
 * Event handlers for module Intranet
 */
class EventHandler
{
	/**
	 * @param Event $event
	 * @return void
	 */
	public static function onSettingsProvidersCollect(Main\Event $event): void
	{
		$providers = $event->getParameter('providers');
		$provider = new Integration\Intranet\Settings\AutomationSettingsPageProvider();

		$employeeProvider = array_values(
			array_filter(
				$providers ?? [],
				fn($item) => $item->getType() === 'employee'
			)
		)[0] ?? null;

		if ($employeeProvider)
		{
			$provider->setSort($employeeProvider->getSort() + 5);
		}

		$providers[$provider->getType()] = $provider;

		$event->addResult(new Main\EventResult(Main\EventResult::SUCCESS, ['providers' => $providers]));
	}

	public static function onAddAbsence(Main\Event $event)
	{
		if (!Loader::includeModule('timeman'))
		{
			return;
		}

		$absenceType = (string)$event->getParameter('absenceType');
		$fields = [
			AbsenceBaseTrigger::FIELD_USER_ID => (int)$event->getParameter('userId'),
			AbsenceBaseTrigger::FIELD_ACTIVE_FROM => (string)$event->getParameter('activeFrom'),
			AbsenceBaseTrigger::FIELD_ACTIVE_TO => (string)$event->getParameter('activeTo'),
			AbsenceBaseTrigger::FIELD_ABSENCE_TYPE => $absenceType,
			'initiatorUserId' => (int)$event->getParameter('initiatorUserId'),
		];

		switch ($absenceType)
		{
			case 'LEAVESICK':
				$triggerName = 'AbsenceLeaveSickTrigger';
				break;
			case 'VACATION':
				$triggerName = 'AbsenceVacationTrigger';
				break;
			default:
				return;
		}

		Starter::getByScenario(Scenario::onEvent)
			->setContext(new ContextDto('timeman'))
			->addEvent($triggerName, [], $fields)
			->start()
		;
	}

	public static function onAfterUserFire(Event $event): void
	{
		$user = $event->getParameter('user');
		if (!$user instanceof User)
		{
			return;
		}

		$userId = (int)$user->getId();
		if ($userId <= 0)
		{
			return;
		}

		$fields = [
			'userId' => $userId,
			'firedAt' => (new DateTime())->getTimestamp(),
			'name' => (string)($user->getName() ?? ''),
			'lastName' => (string)($user->getLastName() ?? ''),
		];

		try
		{
			$startResult = static::withoutTariffRefusal(
				Starter::getByScenario(Scenario::onEvent)
					->setContext(new ContextDto('bizproc'))
					->addEvent('EmployeeDismissalTrigger', [], $fields)
					->setDelay(0)
					->start()
			);

			if (!$startResult->isSuccess())
			{
				static::logEmployeeDismissalTriggerStartErrors($userId, $startResult->getErrors());
			}
		}
		catch (\Throwable $exception)
		{
			static::logEmployeeDismissalTriggerException($userId, $exception);
		}
	}

	private static function logEmployeeDismissalTriggerStartErrors(int $userId, array $errors): void
	{
		$errorCodes = [];
		foreach ($errors as $error)
		{
			if ($error instanceof Main\Error)
			{
				$errorCodes[] = (string)$error->getCode();
			}
		}

		$errorCodes = array_values(array_unique(array_filter(
			$errorCodes,
			static fn(string $code): bool => $code !== '',
		)));
		if (empty($errorCodes))
		{
			$errorCodes = ['NO_CODE'];
		}

		Main\Application::getInstance()->getExceptionHandler()->writeToLog(new Main\SystemException(
			'Bizproc employee dismissal trigger start failed: userId=' . $userId
			. '; errorCodes=' . implode(',', $errorCodes),
		));
	}

	private static function logEmployeeDismissalTriggerException(int $userId, \Throwable $exception): void
	{
		Main\Application::getInstance()->getExceptionHandler()->writeToLog(new Main\SystemException(
			'Bizproc employee dismissal trigger exception: userId=' . $userId
			. '; exceptionClass=' . $exception::class,
		));
	}

	private static function withoutTariffRefusal(Main\Result $startResult): Main\Result
	{
		$tariffErrorCode = (new BpDesignerFeature())->getErrorCode();
		$result = new Main\Result();

		foreach ($startResult->getErrors() as $error)
		{
			if ((string)$error->getCode() !== $tariffErrorCode)
			{
				$result->addError($error);
			}
		}

		return $result;
	}
}
