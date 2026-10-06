<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Grid\Component\ComponentParams;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Provider\Params\GridParams;
use Bitrix\Main\Provider\Params\Pager;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UI\Filter\Options as FilterOptions;
use Bitrix\MessageService\Infrastructure\Component\CustomTemplate\ListPageGrid\CustomTemplateGrid;
use Bitrix\MessageService\Infrastructure\Component\CustomTemplate\ListPageGrid\Settings\CustomTemplateGridSettings;
use Bitrix\MessageService\Public\Dto\CustomTemplate\CustomTemplateListItem;
use Bitrix\MessageService\Public\Provider\CustomTemplate\CustomTemplateProvider;
use Bitrix\MessageService\Public\Provider\CustomTemplate\Param\TemplateFilter;
use Bitrix\MessageService\Public\Provider\CustomTemplate\Param\TemplateSort;
use Bitrix\MessageService\Public\Provider\CustomTemplate\Zone\AbstractZoneProvider;
use Bitrix\MessageService\Public\Service\CustomTemplate\CustomTemplateZoneRegistry;
use Bitrix\MessageService\Public\Type\CustomTemplate\ReadableFilterOptions;
use Bitrix\MessageService\Public\Type\CustomTemplate\TemplateBinding;
use Bitrix\UI\Toolbar\Facade\Toolbar;

final class MessageServiceCustomTemplateListComponent extends \CBitrixComponent
{
	private const FILTER_PRESET_CURRENT_CONTEXT = 'current_context';

	public function executeComponent(): void
	{
		if (!Loader::includeModule('messageservice') || !Loader::includeModule('ui'))
		{
			return;
		}

		$zoneId = (string)($this->arParams['ZONE'] ?? '');
		$scene = (string)($this->arParams['SCENE'] ?? '');
		$targetId = (string)($this->arParams['TARGET_ID'] ?? '');
		$binding = new TemplateBinding($zoneId, $scene, $targetId);
		$zoneProvider = $this->resolveZoneProvider($zoneId);
		$userId = (int)CurrentUser::get()->getId();
		if (!$this->checkAccess($zoneProvider, $userId, $binding))
		{
			$this->arResult = ['ACCESS_DENIED' => true];
			$this->includeComponentTemplate();

			return;
		}

		$settings = new CustomTemplateGridSettings([
			'ZONE' => $zoneId,
			'SCENE' => $scene,
			'TARGET_ID' => $targetId,
		]);
		$grid = new CustomTemplateGrid($settings);
		$filterId = $grid->getId();

		$provider = ServiceLocator::getInstance()->get(CustomTemplateProvider::class);

		// The permission-side scope is the single read model that gates the grid rows and the
		// count; the labelled filter options come from the same per-request readable-target
		// computation, so the dropdowns never disclose more than the gate allows and issue no
		// DB query. The current URL binding needs no special seeding: it is in scope iff
		// readable, and checkAccess() already denied it otherwise.
		$scope = $zoneProvider->getReadableScope($userId);
		$filterOptions = $zoneProvider->getReadableFilterOptions($userId);

		$filterFields = $this->buildFilterFields($filterOptions);
		$filterPresets = $this->buildFilterPresets($binding, $zoneProvider);
		$filter = TemplateFilter::fromGridRequest(
			zone: $settings->getZone(),
			appliedValues: (new FilterOptions($filterId, $filterPresets))->getFilter($filterFields),
			scope: $scope,
		);

		// Canonical order: processRequest -> getPagination()->setRecordCount -> setRawRows.
		$grid->processRequest();
		$gridParams = $this->buildGridParams($grid, $filter);
		$totalCount = $provider->getCountForGrid($gridParams);
		$grid->getPagination()?->setRecordCount($totalCount);
		$items = $provider->getForGrid($gridParams);
		$grid->setRawRows($this->mapItemsToRows($items));
		$unfilteredCount = $totalCount;
		if ($totalCount === 0)
		{
			$unfilteredCount = $provider->getCountForGrid(new GridParams(
				pager: Pager::buildFromPageNavigation($grid->getPagination()),
				filter: new TemplateFilter(zone: $settings->getZone(), scope: $scope),
			));
		}

		Toolbar::addButton($grid->createToolbarCreateButton());
		Toolbar::addFilter([
			'FILTER_ID' => $filterId,
			'GRID_ID' => $grid->getId(),
			'FILTER' => $filterFields,
			'FILTER_PRESETS' => $filterPresets,
			'ENABLE_LABEL' => true,
			'ENABLE_LIVE_SEARCH' => true,
			'RESET_TO_DEFAULT_MODE' => true,
		]);

		$componentParams = [
			'FILTER_ID' => $filterId,
			'ZONE' => $zoneId,
			'SCENE' => $scene,
			'TARGET_ID' => $targetId,
		];
		if ($unfilteredCount === 0)
		{
			$componentParams['STUB'] = $this->buildEmptyStateStub();
		}

		$this->arResult = [
			'GRID' => ComponentParams::get($grid, $componentParams),
			'GRID_ID' => $grid->getId(),
			'ZONE' => $zoneId,
			'SCENE' => $scene,
			'TARGET_ID' => $targetId,
		];

		$this->includeComponentTemplate();
	}

	private function resolveZoneProvider(string $zoneId): ?AbstractZoneProvider
	{
		return ServiceLocator::getInstance()
			->get(CustomTemplateZoneRegistry::class)
			->get($zoneId);
	}

	/**
	 * Context-aware permission gate for the list page. Without a registered zone provider
	 * (or with explicit `canReadTemplates` returning false for the exact context) the
	 * list must not render.
	 */
	private function checkAccess(?AbstractZoneProvider $zoneProvider, int $userId, TemplateBinding $binding): bool
	{
		if ($binding->zone === '' || $binding->scene === '' || $binding->targetId === '')
		{
			return false;
		}

		if ($zoneProvider === null)
		{
			return false;
		}

		return $zoneProvider->canReadTemplates($userId, $binding);
	}

	private function buildGridParams(
		CustomTemplateGrid $grid,
		TemplateFilter $filter,
	): GridParams
	{
			return new GridParams(
				pager: Pager::buildFromPageNavigation($grid->getPagination()),
				filter: $filter,
				sort: new TemplateSort($grid->getOrmOrder()),
			);
	}

	/**
	 * Filter fields for the standard `bitrix:main.ui.filter` panel: scene and subject are lists
	 * populated from the zone's readable filter options (labels built by the zone, no DB query);
	 * free-text search is the filter's built-in quick-search (FIND), matched against title and
	 * body by {@see TemplateFilter}.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private function buildFilterFields(ReadableFilterOptions $options): array
	{
		$sceneItems = [];
		foreach ($options->scenes as $scene)
		{
			$sceneItems[$scene->sceneId] = $scene->sceneLabel !== '' ? $scene->sceneLabel : $scene->sceneId;
		}

		$subjectItems = [];
		foreach ($options->subjects as $subject)
		{
			$subjectItems[$subject->targetId] =
				$subject->targetLabel !== '' ? $subject->targetLabel : $subject->targetId
			;
		}

		$fields = [];
		if ($sceneItems !== [])
		{
			$fields[] = [
				'id' => TemplateFilter::FIELD_SCENE,
				'name' => (string)Loc::getMessage('MSGSVC_CT_FILTER_SCENE'),
				'type' => 'list',
				'items' => $sceneItems,
				'default' => true,
			];
		}
		if ($subjectItems !== [])
		{
			$fields[] = [
				'id' => TemplateFilter::FIELD_TARGET_ID,
				'name' => (string)Loc::getMessage('MSGSVC_CT_FILTER_SUBJECT'),
				'type' => 'list',
				'items' => $subjectItems,
				'default' => true,
			];
		}

		$fields[] = [
			'id' => TemplateFilter::FIELD_AUTHOR,
			'name' => (string)Loc::getMessage('MSGSVC_CT_FILTER_AUTHOR'),
			'type' => 'entity_selector',
			'params' => [
				'multiple' => 'N',
				'dialogOptions' => [
					'height' => 240,
					'context' => 'MESSAGESERVICE_CT_FILTER_AUTHOR',
					'entities' => [
						['id' => 'user'],
					],
				],
			],
			'default' => false,
		];
		$fields[] = [
			'id' => TemplateFilter::FIELD_MODIFIED_BY,
			'name' => (string)Loc::getMessage('MSGSVC_CT_FILTER_MODIFIED_BY'),
			'type' => 'entity_selector',
			'params' => [
				'multiple' => 'N',
				'dialogOptions' => [
					'height' => 240,
					'context' => 'MESSAGESERVICE_CT_FILTER_MODIFIED_BY',
					'entities' => [
						['id' => 'user'],
					],
				],
			],
			'default' => false,
		];
		$fields[] = [
			'id' => TemplateFilter::FIELD_DATE_CREATE,
			'name' => (string)Loc::getMessage('MSGSVC_CT_FILTER_DATE_CREATE'),
			'type' => 'date',
			'default' => false,
		];
		$fields[] = [
			'id' => TemplateFilter::FIELD_DATE_MODIFY,
			'name' => (string)Loc::getMessage('MSGSVC_CT_FILTER_DATE_MODIFY'),
			'type' => 'date',
			'default' => false,
		];

		return $fields;
	}

	/**
	 * @return array<string, array<string, mixed>>
	 */
	private function buildFilterPresets(
		TemplateBinding $binding,
		AbstractZoneProvider $zoneProvider,
	): array
	{
		$description = $zoneProvider->describeBinding($binding);
		$contextTitle = trim(
			($description->sceneLabel !== '' ? $description->sceneLabel : $binding->scene)
			. ' · '
			. ($description->targetLabel !== '' ? $description->targetLabel : $binding->targetId)
		);

		return [
			self::FILTER_PRESET_CURRENT_CONTEXT => [
				'name' => $contextTitle,
				'default' => true,
				'disallow_for_all' => true,
				'fields' => [
					TemplateFilter::FIELD_SCENE => $binding->scene,
					TemplateFilter::FIELD_TARGET_ID => $binding->targetId,
				],
			],
		];
	}

	/**
	 * @return array{title: string, description: string}
	 */
	private function buildEmptyStateStub(): array
	{
		// main.ui.grid prints the STUB array branch verbatim; these are trusted lang
		// phrases, so they are passed raw — htmlspecialcharsbx here would double-encode.
		return [
			'title' => (string)Loc::getMessage('MSGSVC_CT_LIST_EMPTY_TITLE'),
			'description' => (string)Loc::getMessage('MSGSVC_CT_LIST_EMPTY_DESCRIPTION'),
		];
	}

	/**
	 * Produce flat raw rows; per-row `actions` are attached by the Row Action DataProvider
	 * wired into {@see CustomTemplateGrid::createRows()}.
	 *
	 * The grid needs arrays, not DTOs: {@see \Bitrix\Main\Grid\Row\Rows::prepareRow()} is
	 * typed `array`, indexes `$rawValue['ID']`, wraps the row as `['data' => $rawValue]`, and
	 * hands the same array to the field assemblers and row actions by column key. So this
	 * array shape is the contract, and it is where the column/raw-data split that the assembler
	 * relies on for stored-XSS escaping is established.
	 *
	 * @param array<int, CustomTemplateListItem> $items
	 * @return array<int, array<string, mixed>>
	 */
	private function mapItemsToRows(array $items): array
	{
		$rows = [];
		foreach ($items as $dto)
		{
			$rows[] = [
				'ID' => $dto->id,
				'TITLE' => $dto->title,
				'BODY' => $dto->body,
				'BODY_PREVIEW' => $dto->bodyPreview,
				'SCENE' => $dto->scene,
				'TARGET_ID' => $dto->targetId,
				'SCENE_LABEL' => $dto->sceneLabel,
				'CONTEXT_LABEL' => $dto->targetLabel,
				// Raw ids: the user field assembler resolves names and renders the profile link.
				'AUTHOR_ID' => $dto->authorId,
				'MODIFIED_BY' => $dto->modifiedBy,
				'DATE_CREATE' => $this->formatGridDate($dto->dateCreate),
				'DATE_MODIFY' => $this->formatGridDate($dto->dateModify),
			];
		}

		return $rows;
	}

	private function formatGridDate(?DateTime $date): string
	{
		if ($date === null)
		{
			return '—';
		}

		return (string)FormatDate('x', $date->toUserTime()->getTimestamp(), time() + \CTimeZone::getOffset());
	}
}
