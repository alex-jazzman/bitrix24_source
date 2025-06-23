<?php

namespace Bitrix\Crm\RepeatSale\Service\Handler;

use Bitrix\Crm\RepeatSale\Segment\Collector\SegmentData;

final class Result extends \Bitrix\Main\Result
{
	private bool $isFinalQueueIteration = false;
	private ?SegmentData $segmentData = null;

	public function isFinalQueueIteration(): bool
	{
		return $this->isFinalQueueIteration;
	}

	public function setIsFinalQueueIteration(bool $isFinalQueueIteration): Result
	{
		$this->isFinalQueueIteration = $isFinalQueueIteration;

		return $this;
	}

	public function getSegmentData(): ?SegmentData
	{
		return $this->segmentData;
	}

	public function setSegmentData(?SegmentData $segmentData): Result
	{
		$this->segmentData = $segmentData;

		return $this;
	}
}
