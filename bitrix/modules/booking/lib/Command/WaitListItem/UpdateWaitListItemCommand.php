<?php

namespace Bitrix\Booking\Command\WaitListItem;

use Bitrix\Booking\Command\AbstractCommand;
use Bitrix\Booking\Entity\WaitListItem\WaitListItem;
use Bitrix\Booking\Internals\Exception\ErrorBuilder;
use Bitrix\Booking\Internals\Exception\Exception;
use Bitrix\Main\Result;

/** @method WaitListItemResult run() */
class UpdateWaitListItemCommand extends AbstractCommand
{
	public function __construct(
		public readonly int $updatedBy,
		public readonly WaitListItem $waitListItem,
	)
	{
	}

	public function toArray(): array
	{
		return [
			'updatedBy' => $this->updatedBy,
			'waitListItem' => $this->waitListItem->toArray(),
		];
	}

	public static function mapFromArray(array $array): self
	{
		return new self(
			updatedBy: $array['updatedBy'],
			waitListItem: WaitListItem::mapFromArray($array['waitListItem']),
		);
	}

	protected function execute(): Result
	{
		try
		{
			return new WaitListItemResult(
				waitListItem: (new UpdateWaitListItemCommandHandler())($this),
			);
		}
		catch (Exception $waitListItemException)
		{
			return (new Result())->addError(ErrorBuilder::buildFromException($waitListItemException));
		}
	}
}
