<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller;

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\CollectionItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\CursorDto;
use Bitrix\Note\Infrastructure\Rest\V3\Response\CollectionListResponse;
use Bitrix\Note\Infrastructure\Rest\V3\Structure\CollectionPaginationStructure;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\CollectionUnderImportException;
use Bitrix\Note\Internal\Exceptions\AccessDeniedException as DomainAccessDeniedException;
use Bitrix\Note\Internal\Model\Collection as CollectionEntity;
use Bitrix\Note\Internal\Service\Analytics\AnalyticsDictionary;
use Bitrix\Note\Internal\Service\Analytics\AnalyticsService;
use Bitrix\Note\Internal\Service\Analytics\AnalyticsStats;
use Bitrix\Note\Infrastructure\Rest\V3\Request\ArchiveCollectionRequest;
use Bitrix\Note\Infrastructure\Rest\V3\Request\ListCollectionsRequest;
use Bitrix\Note\Public\Command\ArchiveCollectionCommand;
use Bitrix\Note\Public\Command\CreateCollectionCommand;
use Bitrix\Note\Public\Command\DeleteCollectionCommand;
use Bitrix\Note\Public\Command\UpdateCollectionCommand;
use Bitrix\Note\Public\Provider\CollectionProvider;
use Bitrix\Note\Public\Service\AccessService;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Attribute\RequiredGroup;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Exception\AccessDeniedException;
use Bitrix\Rest\V3\Exception\EntityNotFoundException;
use Bitrix\Rest\V3\Interaction\Request\AddRequest;
use Bitrix\Rest\V3\Interaction\Request\DeleteRequest;
use Bitrix\Rest\V3\Interaction\Request\GetRequest;
use Bitrix\Rest\V3\Interaction\Request\UpdateRequest;
use Bitrix\Rest\V3\Interaction\Response\DeleteResponse;
use Bitrix\Rest\V3\Interaction\Response\GetResponse;
use Bitrix\Rest\V3\Interaction\Response\UpdateResponse;

#[DtoType(CollectionItemDto::class)]
class Collection extends RestController
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function listAction(ListCollectionsRequest $request): CollectionListResponse
	{
		$pagination = $request->pagination ?? new CollectionPaginationStructure();

		$batch = (new CollectionProvider())->getAccessibleBatch($pagination->getLimit(), $pagination->getAfterCursor());
		$items = $this->getDtoMapper()->mapCollection($batch['entities']);

		return new CollectionListResponse($items, $this->buildCursor($batch['nextCursor']));
	}

	public function getAction(GetRequest $request): GetResponse
	{
		$id = (int)$request->id;
		if (!AccessService::canViewCollection($id))
		{
			// "Do not leak existence": the same EntityNotFoundException is returned
			// both when the collection is missing and when the caller cannot see it.
			throw new EntityNotFoundException($id);
		}

		$collection = (new CollectionProvider())->getById($id);
		if ($collection === null)
		{
			throw new EntityNotFoundException($id);
		}

		// view_collection for the REST read; only after the collection is confirmed visible and present.
		AnalyticsService::collectionViewed(true, AnalyticsDictionary::TYPE_REST);

		return new GetResponse($this->getDtoMapper()->mapOne($collection));
	}

	public function addAction(AddRequest $request): GetResponse
	{
		try
		{
			AccessService::assertCanCreateCollections();
		}
		catch (DomainAccessDeniedException)
		{
			throw new AccessDeniedException();
		}

		/** @var CollectionItemDto $dto */
		$dto = $request->fields->convertToDto(RequiredGroup::Add->value);

		$result = (new CreateCollectionCommand(
			(string)$dto->name,
			$this->getCurrentUserId(),
			$dto->position ?? 0,
		))->run();

		$collection = $result->getData()['collection'] ?? null;
		if (!$collection instanceof CollectionEntity)
		{
			throw new EntityNotFoundException(0);
		}

		// REST creator is always the sole moderator (admin=1); no import context => no importType.
		AnalyticsService::collectionCreated(
			true,
			AnalyticsStats::buildCollectionStats(1, 0, 0),
			AnalyticsDictionary::TYPE_REST,
		);

		return new GetResponse($this->getDtoMapper()->mapOne($collection));
	}

	public function updateAction(UpdateRequest $request): GetResponse
	{
		$id = (int)$request->id;
		try
		{
			AccessService::assertCanEditCollection($id);
		}
		catch (DomainAccessDeniedException)
		{
			throw new AccessDeniedException();
		}

		/** @var CollectionItemDto $dto */
		$dto = $request->fields->convertToDto(RequiredGroup::Update->value);

		$result = (new UpdateCollectionCommand(
			$id,
			(string)$dto->name,
			$this->getCurrentUserId(),
			notifyInitiator: true,
		))->run();

		$collection = $result->getData()['collection'] ?? null;
		if (!$collection instanceof CollectionEntity)
		{
			throw new EntityNotFoundException($id);
		}

		return new GetResponse($this->getDtoMapper()->mapOne($collection));
	}

	public function archiveAction(ArchiveCollectionRequest $request): UpdateResponse
	{
		try
		{
			AccessService::assertCanModerateCollection($request->id);
		}
		catch (DomainAccessDeniedException)
		{
			throw new AccessDeniedException();
		}

		$result = (new ArchiveCollectionCommand(
			$request->id,
			$this->getCurrentUserId(),
			analyticsType: AnalyticsDictionary::TYPE_REST,
		))->run();

		if (($result->getData()['success'] ?? false) !== true)
		{
			throw new EntityNotFoundException($request->id);
		}

		return new UpdateResponse(true);
	}

	public function deleteAction(DeleteRequest $request): DeleteResponse
	{
		$id = (int)$request->id;
		try
		{
			AccessService::assertCanModerateCollection($id);
		}
		catch (DomainAccessDeniedException)
		{
			throw new AccessDeniedException();
		}

		$result = (new DeleteCollectionCommand(
			$id,
			$this->getCurrentUserId(),
			analyticsType: AnalyticsDictionary::TYPE_REST,
		))->run();

		$data = $result->getData();
		if (($data['errorCode'] ?? null) === 'COLLECTION_UNDER_IMPORT')
		{
			throw new CollectionUnderImportException();
		}

		if (($data['success'] ?? false) !== true)
		{
			throw new EntityNotFoundException($id);
		}

		return new DeleteResponse(true);
	}

	private function getCurrentUserId(): int
	{
		return (int)CurrentUser::get()->getId();
	}

	private function buildCursor(?array $cursor): ?CursorDto
	{
		if ($cursor === null)
		{
			return null;
		}

		$dto = new CursorDto();
		$dto->position = (int)$cursor['position'];
		$dto->id = (int)$cursor['id'];

		return $dto;
	}
}
