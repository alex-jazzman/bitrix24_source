<?php

namespace Bitrix\Voximplant\Integration\Report\Handler\CallDuration;

use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\ORM\Query\Join;
use Bitrix\Main\ORM\Query\Query;
use Bitrix\Main\Type\DateTime;
use Bitrix\Voximplant\Integration\Report\CallType;
use Bitrix\Voximplant\Integration\Report\Handler\Base;
use Bitrix\Voximplant\StatisticTable;

/**
 * Class CallDuration
 * @package Bitrix\Voximplant\Integration\Report\Handler\CallDuration
 */
abstract class CallDuration extends Base
{
	/**
	 * Prepares report data.
	 *
	 * @return array|mixed
	 */
	public function prepare()
	{
		if (!$this->isCurrentUserHasAccess())
		{
			return [];
		}

		$filterParameters = $this->getFilterParameters();

		$startDate = DateTime::createFromUserTime($filterParameters['TIME_PERIOD_from']);
		$finishDate = DateTime::createFromUserTime($filterParameters['TIME_PERIOD_to']);

		$previousPeriod = $this->getPreviousPeriod($startDate, $finishDate);
		$previousStartDate = $previousPeriod['from'];
		$previousFinishDate = $previousPeriod['to'];

		$report = $this->getQueryForReport(
			$startDate,
			$finishDate,
			$previousStartDate,
			$previousFinishDate,
			$filterParameters
		)->exec()->fetchAll();

		return [
			'startDate' => $filterParameters['TIME_PERIOD_from'],
			'finishDate' => $filterParameters['TIME_PERIOD_to'],
			'report' => $report
		];
	}

	/**
	 * Creates a query to select data based on a filter.
	 *
	 * @param $startDate
	 * @param $finishDate
	 * @param $previousStartDate
	 * @param $previousFinishDate
	 * @param $filterParameters
	 *
	 * @return Query
	 */
	protected function getQueryForReport($startDate, $finishDate, $previousStartDate, $previousFinishDate, $filterParameters): Query
	{
		$subQuery = $this->getBaseQuery($previousStartDate, $previousFinishDate, $filterParameters);
		$query = $this->getBaseQuery($startDate, $finishDate, $filterParameters);

		$query->registerRuntimeField(new ReferenceField(
			'previous',
			\Bitrix\Main\Entity\Base::getInstanceByQuery($subQuery),
			Join::on('this.PORTAL_USER_ID', 'ref.PORTAL_USER_ID')
		));

		$this->addCallDurationCompareField($query, 'INCOMING_DURATION');
		$this->addCallDurationCompareField($query, 'OUTGOING_DURATION');

		return $query;
	}

	/**
	 * Creates a basic query to sample the workload of employees.
	 *
	 * @param $startDate
	 * @param $finishDate
	 * @param $filterParameters
	 *
	 * @return Query
	 */
	protected function getBaseQuery($startDate, $finishDate, $filterParameters): Query
	{
		$query = StatisticTable::query();
		$query->addSelect('PORTAL_USER_ID');

		$this->addToQueryFilterCase($query, $filterParameters);
		$this->addCallDurationField($query, CallType::INCOMING, 'INCOMING_DURATION');
		$this->addCallDurationField($query, CallType::OUTGOING, 'OUTGOING_DURATION');
		$query->whereBetween('CALL_START_DATE', $startDate, $finishDate);

		return $query;
	}

	/**
	 * Add a field to query for counting the number of calls depending on the type of call.
	 *
	 * @param Query $query
	 * @param $callType
	 * @param string $columnName
	 * @param bool $isMainQuery
	 */
	protected function addCallDurationField(Query $query, $callType, string $columnName, bool $isMainQuery = false): void
	{
		switch ($callType)
		{
			case CallType::INCOMING:
				$expression = 'SUM(CASE WHEN %s = 2 and %s = 200 THEN %s ELSE null END)';
				$buildFrom = ['INCOMING', 'CALL_FAILED_CODE', 'CALL_DURATION'];
				break;
			case CallType::OUTGOING:
				$expression = 'SUM(CASE WHEN %s = 1 and %s = 200 THEN %s ELSE null END)';
				$buildFrom = ['INCOMING', 'CALL_FAILED_CODE', 'CALL_DURATION'];
				break;
			case CallType::MISSED:
				$expression = 'SUM(CASE WHEN %s = 2 and %s <> 200 THEN %s ELSE null END)';
				$buildFrom = ['INCOMING', 'CALL_FAILED_CODE', 'CALL_DURATION'];
				break;
			case CallType::CALLBACK:
				$expression = 'SUM(CASE WHEN %s = 4 THEN %s ELSE null END)';
				$buildFrom = ['INCOMING', 'CALL_DURATION'];
				break;
			default:
				$expression = 'SUM(%s)';
				$buildFrom = ['CALL_DURATION'];
				break;
		}

		if ($isMainQuery)
		{
			$query->addSelect( 'previous.' . $columnName, 'PREVIOUS_' . $columnName);
		}

		$query->addSelect($columnName);
		$query->registerRuntimeField(new ExpressionField(
			$columnName,
			$expression,
			$buildFrom
		));
	}

	/**
	 * Adds a field comparison with the previous period to the query.
	 *
	 * @param Query $query
	 * @param string $columnName
	 */
	protected function addCallDurationCompareField(Query $query, string $columnName): void
	{
		$query->addSelect($columnName . '_COMPARE');
		$query->registerRuntimeField(new ExpressionField(
			$columnName . '_COMPARE',
			'CASE WHEN %1$s = 0 THEN null ELSE round((%1$s - %2$s) / %2$s * 100, 1) END',
			[$columnName, 'previous.'.$columnName]
		));
	}
}