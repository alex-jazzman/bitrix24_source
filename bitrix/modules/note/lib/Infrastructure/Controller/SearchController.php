<?php

declare(strict_types=1);

namespace Bitrix\Note\Infrastructure\Controller;

use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Provider\Params\Pager;
use Bitrix\Main\UI\PageNavigation;
use Bitrix\Note\Infrastructure\Controller\ActionFilter\NoteAccess;
use Bitrix\Note\Public\Provider\Param\Search\SearchQuery;
use Bitrix\Note\Public\Provider\SearchProvider;

final class SearchController extends Controller
{
	private const QUICK_SEARCH_LIMIT = 5;
	private const MIN_QUERY_LENGTH = 3;
	private const MAX_QUERY_LENGTH = 1000;

	public function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new NoteAccess(),
			],
		);
	}

	public function searchAction(
		string $query,
		PageNavigation $navigation,
		SearchProvider $provider,
	): ?array
	{
		$trimmed = mb_substr(trim($query), 0, self::MAX_QUERY_LENGTH);
		if ($trimmed === '')
		{
			$this->addError(new Error(Loc::getMessage('NOTE_SEARCH_QUERY_EMPTY')));

			return null;
		}

		if (mb_strlen($trimmed) < self::MIN_QUERY_LENGTH)
		{
			$this->addError(new Error(Loc::getMessage('NOTE_SEARCH_QUERY_TOO_SHORT')));

			return null;
		}

		$collection = $provider->search(
			query: new SearchQuery($trimmed),
			pager: Pager::buildFromPageNavigation($navigation),
		);

		return [
			'items' => iterator_to_array($collection),
			'hasMore' => $collection->hasMore(),
		];
	}

	public function quickSearchAction(
		string $query,
		SearchProvider $provider,
	): ?array
	{
		$trimmed = mb_substr(trim($query), 0, self::MAX_QUERY_LENGTH);
		if ($trimmed === '' || mb_strlen($trimmed) < self::MIN_QUERY_LENGTH)
		{
			return ['items' => []];
		}

		$collection = $provider->search(
			query: new SearchQuery($trimmed),
			pager: new Pager(self::QUICK_SEARCH_LIMIT),
			withSnippets: false,
		);

		return ['items' => iterator_to_array($collection)];
	}
}
