<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Dto\Mapping;

use Bitrix\Note\Infrastructure\Rest\V3\Dto\SearchResultItemDto;
use Bitrix\Note\Internal\Entity\Search\SearchResult;
use Bitrix\Rest\V3\Dto\DtoCollection;
use Bitrix\Rest\V3\Dto\Mapping\Mapper;

class SearchResultMapper extends Mapper
{
	/**
	 * @param SearchResult[] $items
	 */
	public function mapCollection(array $items, array $fields = []): DtoCollection
	{
		$collection = new DtoCollection(SearchResultItemDto::class);
		foreach ($items as $item)
		{
			$collection->add($this->mapResult($item));
		}

		return $collection;
	}

	private function mapResult(SearchResult $result): SearchResultItemDto
	{
		$dto = new SearchResultItemDto();
		$dto->documentId = $result->getDocumentId();
		$dto->title = $result->getTitle();
		$dto->score = $result->getScore();
		$dto->snippet = $result->getSnippet();
		$dto->sharedAccess = $result->isSharedAccess();
		// Shared results never disclose the owning collection.
		$dto->collectionId = $result->isSharedAccess() ? null : $result->getCollectionId();

		return $dto;
	}
}
