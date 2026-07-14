<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Source\Wiki;

/**
 * Builds the document tree and the flat fill-order list for one wiki base from
 * its iblock sections (categories) and elements (pages).
 *
 * Model divergence (accepted, see ANALYSIS §6): wiki pages may be bound to many
 * categories, note documents have one parent. The page is attached to its
 * PRIMARY section binding (CIBlockElement.IBLOCK_SECTION_ID) — the "first
 * category". Pages with no section land in the collection root.
 *
 * The tree (getDocumentTree, one call) and the fill list (getDocumentsPage, one
 * call per batch) MUST enumerate the same nodes with the same filters so that
 * external ids line up in ImportMap; both go through this one class.
 */
class WikiTreeBuilder
{
	private string $collectionId;

	/** @var array<int, array{ID:int, NAME:string, IBLOCK_SECTION_ID:int|null}>|null */
	private ?array $sections = null;

	/** @var array<int, array{ID:int, NAME:string, IBLOCK_SECTION_ID:int|null}>|null */
	private ?array $pages = null;

	/**
	 * @param array{kind:string, iblockId:int, groupId:int|null, rootSectionId:int|null, left:int|null, right:int|null} $context
	 */
	public function __construct(private readonly array $context)
	{
		$this->collectionId = $this->context['kind'] === 'group'
			? WikiId::groupCollectionId((int)$this->context['groupId'], (int)$this->context['iblockId'])
			: WikiId::companyCollectionId((int)$this->context['iblockId']);
	}

	/**
	 * Nested nodes: {id, title, children}. Category nodes nest by section parent;
	 * page nodes hang off their primary category (or the root).
	 *
	 * @return array<int, array{id:string, title:string, children:array}>
	 */
	public function buildTree(): array
	{
		$nodesById = [];
		$childrenOf = ['' => []];

		foreach ($this->getSections() as $section)
		{
			$nodeId = WikiId::categoryNodeId($this->collectionId, (int)$section['ID']);
			$nodesById[$nodeId] = ['id' => $nodeId, 'title' => $section['NAME'], 'children' => []];
			$parentKey = $this->sectionParentKey($section['IBLOCK_SECTION_ID']);
			$childrenOf[$parentKey][] = $nodeId;
		}

		foreach ($this->getPages() as $page)
		{
			$nodeId = WikiId::pageExternalId($this->collectionId, $page['NAME']);
			$nodesById[$nodeId] = ['id' => $nodeId, 'title' => $page['NAME'], 'children' => []];
			$parentKey = $this->pageParentKey($page['IBLOCK_SECTION_ID'], $nodesById);
			$childrenOf[$parentKey][] = $nodeId;
		}

		return $this->assemble('', $childrenOf, $nodesById);
	}

	/**
	 * Flat fill order consumed by getDocumentsPage: category nodes first (empty
	 * body), then pages, both deterministically ordered. Carries no body — bodies
	 * are loaded only for the requested window.
	 *
	 * @return array<int, array{externalId:string, kind:string, title:string, elementId:int|null}>
	 */
	public function buildFillList(): array
	{
		$items = [];

		foreach ($this->getSections() as $section)
		{
			$items[] = [
				'externalId' => WikiId::categoryNodeId($this->collectionId, (int)$section['ID']),
				'kind' => 'category',
				'title' => $section['NAME'],
				'elementId' => null,
			];
		}

		foreach ($this->getPages() as $page)
		{
			$items[] = [
				'externalId' => WikiId::pageExternalId($this->collectionId, $page['NAME']),
				'kind' => 'page',
				'title' => $page['NAME'],
				'elementId' => (int)$page['ID'],
			];
		}

		return $items;
	}

	public function getCollectionId(): string
	{
		return $this->collectionId;
	}

	/**
	 * @return array<int, array{ID:int, NAME:string, IBLOCK_SECTION_ID:int|null}>
	 */
	private function getSections(): array
	{
		if ($this->sections !== null)
		{
			return $this->sections;
		}

		$filter = [
			'IBLOCK_ID' => $this->context['iblockId'],
			'CHECK_PERMISSIONS' => 'N',
		];
		if ($this->context['kind'] === 'group')
		{
			// Strict descendants of the group root section (root itself is the
			// collection, not a category document). CIBlockSection::GetList does NOT
			// honour the strict >LEFT_MARGIN/<RIGHT_MARGIN operators — they are
			// silently dropped, which let the root section leak in as a spurious
			// empty document named after the base and, in the shared socnet iblock,
			// would expose other groups' sections. The inclusive >=/<= operators
			// are honoured, so scope to [left + 1 .. right - 1].
			$filter['>=LEFT_MARGIN'] = (int)$this->context['left'] + 1;
			$filter['<=RIGHT_MARGIN'] = (int)$this->context['right'] - 1;
		}

		$this->sections = [];
		$rs = \CIBlockSection::GetList(
			['LEFT_MARGIN' => 'ASC'],
			$filter,
			false,
			['ID', 'NAME', 'IBLOCK_SECTION_ID'],
		);
		while ($section = $rs->Fetch())
		{
			$this->sections[] = [
				'ID' => (int)$section['ID'],
				'NAME' => (string)$section['NAME'],
				'IBLOCK_SECTION_ID' => $section['IBLOCK_SECTION_ID'] !== null
					? (int)$section['IBLOCK_SECTION_ID']
					: null,
			];
		}

		return $this->sections;
	}

	/**
	 * @return array<int, array{ID:int, NAME:string, IBLOCK_SECTION_ID:int|null}>
	 */
	private function getPages(): array
	{
		if ($this->pages !== null)
		{
			return $this->pages;
		}

		$filter = [
			'IBLOCK_ID' => $this->context['iblockId'],
			'ACTIVE' => 'Y',
			'CHECK_PERMISSIONS' => 'N',
		];
		if ($this->context['kind'] === 'group')
		{
			$filter['SECTION_ID'] = (int)$this->context['rootSectionId'];
			$filter['INCLUDE_SUBSECTIONS'] = 'Y';
		}

		$this->pages = [];
		$rs = \CIBlockElement::GetList(
			['ID' => 'ASC'],
			$filter,
			false,
			false,
			['ID', 'NAME', 'IBLOCK_SECTION_ID'],
		);
		while ($element = $rs->GetNext())
		{
			$name = (string)$element['NAME'];

			// Category pages are the editable body of a category; the category
			// itself is already a section node, so skip the element (Q-3: empty body).
			$catName = '';
			if (\CWikiUtils::IsCategoryPage($name, $catName))
			{
				continue;
			}

			$this->pages[] = [
				'ID' => (int)$element['ID'],
				'NAME' => $name,
				'IBLOCK_SECTION_ID' => $element['IBLOCK_SECTION_ID'] !== null
					? (int)$element['IBLOCK_SECTION_ID']
					: null,
			];
		}

		return $this->pages;
	}

	private function sectionParentKey(?int $parentSectionId): string
	{
		if ($parentSectionId === null)
		{
			return '';
		}

		// In a group wiki the group root section is not a category node; its
		// direct children are top-level categories.
		if ($this->context['kind'] === 'group' && $parentSectionId === (int)$this->context['rootSectionId'])
		{
			return '';
		}

		return WikiId::categoryNodeId($this->collectionId, $parentSectionId);
	}

	/**
	 * @param array<string, array{id:string, title:string, children:array}> $nodesById
	 */
	private function pageParentKey(?int $sectionId, array $nodesById): string
	{
		if ($sectionId === null)
		{
			return '';
		}

		if ($this->context['kind'] === 'group' && $sectionId === (int)$this->context['rootSectionId'])
		{
			return '';
		}

		$categoryId = WikiId::categoryNodeId($this->collectionId, $sectionId);

		// Primary section outside the imported set (e.g. bound above the group
		// root) → fall back to collection root rather than orphan the page.
		return isset($nodesById[$categoryId]) ? $categoryId : '';
	}

	/**
	 * @param array<string, array<int, string>> $childrenOf
	 * @param array<string, array{id:string, title:string, children:array}> $nodesById
	 * @return array<int, array{id:string, title:string, children:array}>
	 */
	private function assemble(string $parentKey, array $childrenOf, array $nodesById): array
	{
		$result = [];
		foreach ($childrenOf[$parentKey] ?? [] as $nodeId)
		{
			$node = $nodesById[$nodeId];
			$node['children'] = $this->assemble($nodeId, $childrenOf, $nodesById);
			$result[] = $node;
		}

		return $result;
	}
}
