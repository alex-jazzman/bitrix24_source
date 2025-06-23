<?php

namespace Bitrix\Crm\Controller\RepeatSale;

use Bitrix\Crm\Controller\ErrorCode;
use Bitrix\Crm\RepeatSale\Log\Controller\RepeatSaleLogController;
use Bitrix\Crm\RepeatSale\Segment\Controller\RepeatSaleSegmentController;
use Bitrix\Crm\RepeatSale\Statistics\DataProvider;
use Bitrix\Crm\RepeatSale\Statistics\PeriodType;
use Bitrix\Crm\Service\Container;
use Bitrix\Main\Engine\AutoWire\ExactParameter;
use Bitrix\Main\Error;

final class Statistics extends Base
{
	// region actions
	public function getInitDataAction(): array
	{
		$availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();
		$logController = RepeatSaleLogController::getInstance();
		if (
			!$availabilityChecker->isEnablePending()
			&& $logController->getList()->isEmpty()
		)
		{
			return [
				'isFlowStarted' => true,
			];
		}

		$result = [
			'count' => 0,
		];

		$segmentsCollection = RepeatSaleSegmentController::getInstance()->getList([
			'order' => [
				'ID' => 'ASC',
			],
		]);

		if ($segmentsCollection->isEmpty())
		{
			return $result;
		}

		/*
		 * @var $segment Segment
		 */
		foreach ($segmentsCollection as $segment)
		{
			$count = $segment->getClientFound();
			if ($count <= 0)
			{
				continue;
			}

			$result['count'] = $count;

			break;
		}

		return $result;
	}

	public function getDataAction(?PeriodType $periodType = null): array
	{
		$availabilityChecker = Container::getInstance()->getRepeatSaleAvailabilityChecker();
		if (
			!$availabilityChecker->isAvailable()
			|| !$availabilityChecker->hasPermission()
			|| !Container::getInstance()->getUserPermissions()->repeatSale()->canRead()
		)
		{
			$this->addError(ErrorCode::getAccessDeniedError());

			return [];
		}

		if ($periodType === null)
		{
			$this->addError(new Error('Unknown statistics period'));

			return [];
		}

		return (new DataProvider(RepeatSaleLogController::getInstance()))->getData($periodType);
	}
	// endregion

	public function getAutoWiredParameters(): array
	{
		return [
			new ExactParameter(
				PeriodType::class,
				'periodType',
				static fn($className, $periodTypeId) => PeriodType::tryFrom($periodTypeId) ?? PeriodType::Day30,
			),
		];
	}
}
