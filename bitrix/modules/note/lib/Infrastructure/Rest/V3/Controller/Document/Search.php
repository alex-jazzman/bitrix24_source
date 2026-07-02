<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Rest\V3\Controller\Document;

use Bitrix\Main\Provider\Params\Pager;
use Bitrix\Note\Public\Provider\Param\Search\SearchLimits;
use Bitrix\Note\Public\Provider\Param\Search\SearchQuery;
use Bitrix\Note\Public\Provider\SearchProvider;
use Bitrix\Note\Infrastructure\Rest\V3\Controller\ActionFilter\NoteRestAccess;
use Bitrix\Note\Infrastructure\Rest\V3\Dto\SearchResultItemDto;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\SearchQueryTooLongException;
use Bitrix\Note\Infrastructure\Rest\V3\Exceptions\SearchQueryTooShortException;
use Bitrix\Note\Infrastructure\Rest\V3\Request\SearchDocumentsRequest;
use Bitrix\Rest\V3\Attribute\DtoType;
use Bitrix\Rest\V3\Controller\RestController;
use Bitrix\Rest\V3\Interaction\Response\ArrayResponse;

#[DtoType(SearchResultItemDto::class)]
class Search extends RestController
{
	private const DEFAULT_LIMIT = 50;
	private const MAX_LIMIT = 200;

	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),
			new NoteRestAccess(),
		];
	}

	public function listAction(SearchDocumentsRequest $request): ArrayResponse
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

		$limit = $this->parseLimit($request->pagination);

		$collection = (new SearchProvider())->search(
			query: new SearchQuery($raw),
			pager: new Pager($limit),
		);

		$items = [];
		foreach ($collection as $result)
		{
			$item = [
				'documentId' => $result->getDocumentId(),
				'title' => $result->getTitle(),
				'score' => $result->getScore(),
				'snippet' => $result->getSnippet(),
				'sharedAccess' => $result->isSharedAccess(),
			];
			if (!$result->isSharedAccess())
			{
				$item['collectionId'] = $result->getCollectionId();
			}
			$items[] = $item;
		}

		return new ArrayResponse([
			'items' => $items,
			'hasMore' => $collection->hasMore(),
		]);
	}

	private function parseLimit(?array $pagination): int
	{
		if (is_array($pagination) && isset($pagination['limit']))
		{
			$requested = (int)$pagination['limit'];
			if ($requested > 0)
			{
				return min($requested, self::MAX_LIMIT);
			}
		}

		return self::DEFAULT_LIMIT;
	}
}
