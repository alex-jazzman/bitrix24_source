<?php

namespace Bitrix\Booking\Command\Booking;

use Bitrix\Booking\Command\WaitListItem\RemoveWaitListItemCommand;
use Bitrix\Booking\Entity;
use Bitrix\Booking\Internals\Container;
use Bitrix\Booking\Internals\Exception\Booking\CreateBookingFromWaitListItemException;
use Bitrix\Booking\Internals\Repository\TransactionHandlerInterface;
use Bitrix\Booking\Internals\Repository\WaitListItemRepositoryInterface;
use Bitrix\Booking\Internals\Service\BookingService;
use Bitrix\Booking\Internals\Service\Journal\JournalEvent;
use Bitrix\Booking\Internals\Service\Journal\JournalServiceInterface;
use Bitrix\Booking\Internals\Service\Journal\JournalType;
use Bitrix\Booking\Internals\Service\ResourceService;
use Bitrix\Booking\Provider\WaitListItemProvider;

class CreateBookingFromWaitListItemCommandHandler
{
	private TransactionHandlerInterface $transactionHandler;
	private WaitListItemProvider $waitListItemProvider;
	private WaitListItemRepositoryInterface $waitListItemRepository;
	private JournalServiceInterface $journalService;
	private ResourceService $resourceService;
	private BookingService $bookingService;

	public function __construct()
	{
		$this->transactionHandler = Container::getTransactionHandler();
		$this->waitListItemProvider = new WaitListItemProvider();
		$this->waitListItemRepository = Container::getWaitListItemRepository();
		$this->journalService = Container::getJournalService();
		$this->resourceService = Container::getResourceService();
		$this->bookingService = Container::getBookingService();
	}

	public function __invoke(CreateBookingFromWaitListItemCommand $command): Entity\Booking\Booking
	{
		return $this->transactionHandler->handle(
			fn: function () use ($command) {
				$waitListItem = $this->waitListItemProvider->getById(
					$command->waitListItemId,
					$command->createdBy
				);
				if (!$waitListItem)
				{
					throw new CreateBookingFromWaitListItemException('wait list item not found');
				}

				$newBooking = $this->bookingService->buildFromWaitListItem(
					waitListItem: $waitListItem,
					resources: $command->resources,
					datePeriod: $command->datePeriod,
					createdBy: $command->createdBy,
					name: $command->name,
				);

				$resourceCollection = $newBooking->getResourceCollection();
				$newBooking->setResourceCollection($this->resourceService->loadResourceCollection($resourceCollection));

				$this->bookingService->checkBookingBeforeCreating($newBooking, $command->allowOverbooking);

				$bookingEntity = $this->bookingService->create($newBooking, $command->createdBy);

				$addBookingCommand = new AddBookingCommand($command->createdBy, $bookingEntity);
				$this->journalService->append(
					new JournalEvent(
						entityId: $bookingEntity->getId(),
						type: JournalType::BookingAdded,
						data: array_merge(
							$addBookingCommand->toArray(),
							[
								'currentUserId' => $command->createdBy,
							],
						),
					),
				);

				$this->waitListItemRepository->remove($command->waitListItemId);
				$waitListItem->setDeleted(true);

				$removeWaitListItemCommand = new RemoveWaitListItemCommand(
					id: $command->waitListItemId,
					removedBy: $command->createdBy,
				);
				$this->journalService->append(
					new JournalEvent(
						entityId: $command->waitListItemId,
						type: JournalType::WaitListItemDeleted,
						data: [
							...$removeWaitListItemCommand->toArray(),
							'waitListItem' => $waitListItem->toArray(),
						],
					),
				);

				return $bookingEntity;
			},
			errType: CreateBookingFromWaitListItemException::class,
		);
	}
}
