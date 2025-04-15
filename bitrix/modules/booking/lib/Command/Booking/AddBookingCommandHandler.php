<?php

declare(strict_types=1);

namespace Bitrix\Booking\Command\Booking;

use Bitrix\Booking\Entity;
use Bitrix\Booking\Internals\Exception\Booking\CreateBookingException;
use Bitrix\Booking\Internals\Container;
use Bitrix\Booking\Internals\Repository\TransactionHandlerInterface;
use Bitrix\Booking\Internals\Service\BookingService;
use Bitrix\Booking\Internals\Service\Journal\JournalEvent;
use Bitrix\Booking\Internals\Service\Journal\JournalServiceInterface;
use Bitrix\Booking\Internals\Service\Journal\JournalType;
use Bitrix\Booking\Internals\Service\ResourceService;

class AddBookingCommandHandler
{
	private JournalServiceInterface $journalService;
	private TransactionHandlerInterface $transactionHandler;
	private ResourceService $resourceService;
	private BookingService $bookingService;

	public function __construct()
	{
		$this->journalService = Container::getJournalService();
		$this->transactionHandler = Container::getTransactionHandler();
		$this->resourceService = Container::getResourceService();
		$this->bookingService = Container::getBookingService();
	}

	public function __invoke(AddBookingCommand $command): Entity\Booking\Booking
	{
		$this->transactionHandler->handle(
			fn: function () use ($command) {
				$resourceCollection = clone $command->booking->getResourceCollection();
				$command->booking->setResourceCollection(
					$this->resourceService->loadResourceCollection($resourceCollection)
				);
			},
			errType: CreateBookingException::class,
		);

		try
		{
			$this->bookingService->checkBookingBeforeCreating($command->booking, $command->allowOverbooking);
		}
		catch (\Throwable $exception)
		{
			throw new CreateBookingException($exception->getMessage());
		}

		return $this->transactionHandler->handle(
			fn: function() use ($command) {
				$booking = $this->bookingService->create($command->booking, $command->createdBy);

				$this->journalService->append(
					new JournalEvent(
						entityId: $booking->getId(),
						type: JournalType::BookingAdded,
						data: array_merge(
							$command->toArray(),
							[
								'booking' => $booking->toArray(),
								'currentUserId' => $command->createdBy,
							],
						),
					),
				);

				return $booking;
			},
			errType: CreateBookingException::class,
		);
	}
}
