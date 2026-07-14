<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller\Document;

use Bitrix\Main\Provider\Params\Pager;
use Bitrix\Note\Public\Provider\Param\Search\SearchLimits;
use Bitrix\Note\Public\Provider\Param\Search\SearchQuery;
use Bitrix\Note\Public\Provider\SearchProvider;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\SearchResultItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Response\DocumentSearchListResponse;
use Bitrix\Note\Infrastructure\Rest\V3\Structure\SearchPaginationStructure;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\SearchQueryTooLongException;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\SearchQueryTooShortException;
use Bitrix\Note\Infrastructure\Rest\V3\Request\SearchDocumentsRequest;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;

#[DtoType(SearchResultItemDto::class)]
class Search extends RestController
{
	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function listAction(SearchDocumentsRequest $request): DocumentSearchListResponse
	{
		$raw = trim($request->query);
		$length = mb_strlen($raw);

		if ($length < SearchLimits::MIN_TOKEN_LENGTH)
		{
			throw new SearchQueryTooShortException(SearchLimits::MIN_TOKEN_LENGTH);
		}
		if ($length > SearchLimits::MAX_QUERY_LENGTH)
		{
			throw new SearchQueryTooLongException(SearchLimits::MAX_QUERY_LENGTH);
		}

		$limit = ($request->pagination ?? new SearchPaginationStructure())->getLimit();

		$collection = (new SearchProvider())->search(
			query: new SearchQuery($raw),
			pager: new Pager($limit),
		);

		$results = [];
		foreach ($collection as $result)
		{
			$results[] = $result;
		}

		return new DocumentSearchListResponse(
			$this->getDtoMapper()->mapCollection($results),
			$collection->hasMore(),
		);
	}
}
