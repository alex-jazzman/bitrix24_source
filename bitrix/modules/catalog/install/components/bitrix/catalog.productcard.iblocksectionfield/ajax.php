<?php

use Bitrix\Catalog\Access\AccessController;
use Bitrix\Catalog\Access\ActionDictionary;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Engine\Response\Component;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

Loader::requireModule('iblock');
Loader::requireModule('catalog');

class CatalogIblockSectionFieldController extends Controller
{
	private const IBLOCK_READ = 'iblock_admin_display';
	private const IBLOCK_SECTION_EDIT = 'section_edit';

	private function checkCatalogReadPermission(): bool
	{
		if (
			!AccessController::getCurrent()->check(ActionDictionary::ACTION_CATALOG_READ)
			&& !AccessController::getCurrent()->check(ActionDictionary::ACTION_CATALOG_VIEW)
		)
		{
			$this->addError(new Error('Access Denied'));

			return false;
		}

		return true;
	}

	private function checkProductAddPermission(): bool
	{
		if (!AccessController::getCurrent()->check(ActionDictionary::ACTION_PRODUCT_ADD))
		{
			$this->addError(new Error('Access Denied'));

			return false;
		}

		return true;
	}

	private function checkIblockReadPermission(int $iblockId): bool
	{
		if (!\CIBlock::GetArrayByID($iblockId))
		{
			$this->addError(new Error('Iblock is not exists'));

			return false;
		}

		if (!\CIBlockRights::UserHasRightTo($iblockId, $iblockId, self::IBLOCK_READ))
		{
			$this->addError(new Error('Access Denied'));

			return false;
		}

		return true;
	}

	private function checkIblockSectionAddPermission(int $iblockId): bool
	{
		if (!\CIBlock::GetArrayByID($iblockId))
		{
			$this->addError(new Error('Iblock is not exists'));

			return false;
		}

		if (!\CIBlockSectionRights::UserHasRightTo($iblockId, 0, self::IBLOCK_SECTION_EDIT))
		{
			$this->addError(new Error('Access Denied'));

			return false;
		}

		return true;
	}

	public function lazyLoadAction($iblockId, $selectedSectionIds = [], $productId = null): ?Component
	{
		return new Component(
			'bitrix:catalog.productcard.iblocksectionfield',
			'',
			[
				'IBLOCK_ID' => (int)$iblockId,
				'SELECTED_SECTION_IDS' => $selectedSectionIds,
				'PRODUCT_ID' => (int)$productId,
			],
		);
	}

	public function getSectionsAction($iblockId): array
	{
		if (!$this->checkCatalogReadPermission())
		{
			return [];
		}

		$iblockId = (int)$iblockId;

		if (!$this->checkIblockReadPermission($iblockId))
		{
			return [];
		}

		$sectionsTree = CIBlockSection::GetTreeList(
			['IBLOCK_ID' => $iblockId],
			['ID', 'NAME', 'DEPTH_LEVEL'],
		);

		$allSections = [];

		while ($section = $sectionsTree->fetch())
		{
			$allSections[$section['ID']] = [
				'id' => $section['ID'],
				'name' => $section['NAME'],
				'data' => [],
			];
		}

		return [
			[
				'id' => 'all',
				'name' => Loc::getMessage('CPISF_ALL_SECTIONS_TITLE'),
				'items' => array_values($allSections),
			],
		];
	}

	public function addSectionAction($iblockId, $name): array
	{
		if (!$this->checkCatalogReadPermission())
		{
			return [];
		}

		$iblockId = (int)$iblockId;

		if (!$this->checkProductAddPermission())
		{
			return [];
		}

		if (!$this->checkIblockSectionAddPermission($iblockId))
		{
			return [];
		}

		$sectionObject = new \CIBlockSection();

		$fields = [
			'IBLOCK_ID' => $iblockId,
			'NAME' => $name,
		];
		$code = $sectionObject->generateMnemonicCode($name, $iblockId);
		if ($code !== null)
		{
			$fields['CODE'] = $code;
		}
		$ID = $sectionObject->Add($fields);

		if (empty($ID))
		{
			$this->addError(new \Bitrix\Main\Error($sectionObject->LAST_ERROR));

			return [];
		}

		return [
			'id' => $ID,
			'name' => $name,
		];
	}
}
