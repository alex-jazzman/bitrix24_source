<?php

namespace Bitrix\Booking\Command\WaitListItem;

use Bitrix\Booking\Command\AbstractCommand;
use Bitrix\Booking\Entity\WaitListItem\WaitListItem;
use Bitrix\Booking\Internals\Exception\ErrorBuilder;
use Bitrix\Booking\Internals\Exception\Exception;
use Bitrix\Main\Result;

/** @method WaitListItemResult run() */
class AddWaitListItemCommand extends AbstractCommand
{
	public function __construct(
		public readonly int $createdBy,
		public readonly WaitListItem $waitListItem,
	)
	{
	}

	public function toArray(): array
	{
		return [
			'createdBy' => $this->createdBy,
			'waitListItem' => $this->waitListItem->toArray(),
		];
	}

	public static function mapFromArray(array $array): self
	{
		return new self(
			createdBy: $array['createdBy'],
			waitListItem: WaitListItem::mapFromArray($array['waitListItem']),
		);
	}

	protected function execute(): Result
	{
		try
		{
			return new WaitListItemResult(
				waitListItem: (new AddWaitListItemCommandHandler())($this),
			);
		}
		catch (Exception $waitListItemException)
		{
			return (new Result())->addError(ErrorBuilder::buildFromException($waitListItemException));
		}
	}
}
