<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Integration\Superset\Integrator\ProxyIntegrator;
use Bitrix\BIConnector\Integration\Superset\Model\Dashboard;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetDashboardTable;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetDashboardTagTable;
use Bitrix\BIConnector\Integration\Superset\SupersetController;
use Bitrix\BIConnector\Integration\Superset\SupersetInitializer;
use Bitrix\BIConnector\Superset\Grid\DashboardGrid;
use Bitrix\BIConnector\Superset\Grid\Settings\DashboardSettings;
use Bitrix\BIConnector\Superset\MarketDashboardManager;
use Bitrix\BIConnector\Superset\UI\UIHelper;
use Bitrix\Bitrix24;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Entity\Base;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\UI\Buttons;
use Bitrix\UI\Buttons\Button;
use Bitrix\UI\Buttons\Color;
use Bitrix\UI\Buttons\SettingsButton;
use Bitrix\UI\Toolbar\ButtonLocation;
use Bitrix\UI\Toolbar\Facade\Toolbar;
use Bitrix\UI\Buttons\JsCode;

class ApacheSupersetDashboardListComponent extends CBitrixComponent
{
	private const GRID_ID = 'biconnector_superset_dashboard_grid';

	private DashboardGrid $grid;
	private SupersetController $supersetController;

	public function onPrepareComponentParams($arParams)
	{
		$arParams['ID'] = (int)($arParams['ID'] ?? 0);
		$arParams['CODE'] = $arParams['CODE'] ?? '';

		return parent::onPrepareComponentParams($arParams);
	}

	public function executeComponent()
	{
		$superset = new SupersetController(ProxyIntegrator::getInstance());

		if (!$superset->isSupersetEnabled())
		{
			$superset->initSuperset();
		}

		$this->init();
		$this->grid->processRequest();
		$this->grid->setSupersetAvailability($this->getSupersetController()->isExternalServiceAvailable());

		if (SupersetInitializer::getSupersetStatus() === SupersetInitializer::SUPERSET_STATUS_READY)
		{
			$manager = MarketDashboardManager::getInstance();
			$manager->updateApplications();
		}
		$this->loadRows();

		$this->arResult['GRID'] = $this->grid;

		$this->includeComponentTemplate();
	}

	private function init(): void
	{
		$this->initGrid();
		$this->initGridFilter();
		$this->initCreateButton();
		$this->initToolbar();

		$ormParams = $this->getOrmParams();
		if (
			!empty($ormParams['filter']['TAGS.ID'])
			&& is_array($ormParams['filter']['TAGS.ID'])
			&& count($ormParams['filter']['TAGS.ID']) > 1
		)
		{
			$ormParams['group'] = 'ID';
		}
		$totalCount = $this->getSupersetController()->getDashboardRepository()->getCount($ormParams);
		$this->grid->initPagination($totalCount);
	}

	private function initGrid(): void
	{
		$settings = new DashboardSettings([
			'ID' => self::GRID_ID,
			'SHOW_ROW_CHECKBOXES' => false,
			'SHOW_SELECTED_COUNTER' => false,
			'SHOW_TOTAL_COUNTER' => true,
			'EDITABLE' => false,
		]);

		$grid = new DashboardGrid($settings);
		$this->grid = $grid;
		if (empty($this->grid->getOptions()->getSorting()['sort']))
		{
			$this->grid->getOptions()->setSorting('ID', 'desc');
		}
	}

	private function initGridFilter(): void
	{
		$filter = $this->grid->getFilter();
		if ($filter)
		{
			$options = \Bitrix\Main\Filter\Component\ComponentParams::get(
				$this->grid->getFilter(),
				[
					'GRID_ID' => $this->grid->getId(),
				]
			);
		}
		else
		{
			$options = [
				'FILTER_ID' => $this->grid->getId(),
			];
		}

		Toolbar::addFilter($options);
	}

	private function getOrmParams(): array
	{
		$ormParams = $this->grid->getOrmParams();

		if (
			!empty($ormParams['filter']['TAGS.ID'])
			&& is_array($ormParams['filter']['TAGS.ID'])
			&& count($ormParams['filter']['TAGS.ID']) > 1
		)
		{
			$subQuery = SupersetDashboardTagTable::query()
				->setSelect(['DASHBOARD_ID', 'COUNT'])
				->registerRuntimeField('COUNT', new ExpressionField('COUNT', 'COUNT(1)'))
				->whereIn('TAG_ID', $ormParams['filter']['TAGS.ID'])
				->addGroup('DASHBOARD_ID')
			;

			$ormParams['runtime'] ??= [];
			$ormParams['runtime'][] = new Reference(
				'SUBQUERY',
				Base::getInstanceByQuery($subQuery),
				['this.ID' => 'ref.DASHBOARD_ID'],
				['join_type' => 'INNER']
			);

			$ormParams['filter']['=SUBQUERY.COUNT'] = count($ormParams['filter']['TAGS.ID']);
		}

		return $ormParams;
	}

	private function loadRows(): void
	{
		$rows = $this->getSupersetRows($this->getOrmParams());
		$this->grid->setRawRows($rows);
	}

	private function initCreateButton(): void
	{
		$openMarketScript = UIHelper::getOpenMarketScript(
			MarketDashboardManager::getMarketCollectionUrl(),
			'grid'
		);
		$splitButton = new Buttons\Split\CreateButton();

		$mainButton = $splitButton->getMainButton();
		$mainButton->getAttributeCollection()['onclick'] = $openMarketScript;

		$splitButton->setMenu([
			'items' => [
				[
					'text' => Loc::getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_CREATE_DASHBOARD'),
					'onclick' => new JsCode($openMarketScript),
				],
				[
					'text' => Loc::getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_MENU_ITEM_NEW_DASHBOARD'),
					'onclick' => new Bitrix\UI\Buttons\JsCode(
						'this.close(); BX.BIConnector.SupersetDashboardGridManager.Instance.createEmptyDashboard()'
					),
				],
			],
			'closeByEsc' => true,
			'angle' => true,
			'offsetLeft' => 115,
			'autoHide' => true,
		]);

		Toolbar::addButton($splitButton, ButtonLocation::AFTER_TITLE);
	}

	private function initToolbar(): void
	{
		if (
			CurrentUser::get()->isAdmin()
			&& Bitrix24\LicenseScanner\Manager::getInstance()->shouldWarnPortal()
		)
		{
			$clearButton = new Button([
				'color' => Color::DANGER,
				'text' => Loc::getMessage('BICONNECTOR_APACHE_SUPERSET_DASHBOARD_LIST_CLEAR_BUTTON'),
				'click' => new JsCode(
					'BX.BIConnector.ApacheSupersetCleaner.Instance.handleButtonClick(this)'
				),
			]);
			Toolbar::addButton($clearButton);
		}

		$settingButton = new SettingsButton([
			'click' => new JsCode(
				'BX.BIConnector.DashboardManager.openSettingPeriodSlider()'
			),
		]);
		Toolbar::addButton($settingButton);
	}

	/**
	 * @param array $ormParams
	 * @return Dashboard[]
	 */
	private function getSupersetRows(array $ormParams): array
	{
		$userId = CurrentUser::get()->getId();
		$superset = $this->getSupersetController();
		$dashboardList = $superset->getDashboardRepository()->getList($ormParams);
		if (!$dashboardList)
		{
			if ($ormParams['offset'] !== 0)
			{
				$ormParams['offset'] = 0;
				$this->grid->getPagination()?->setCurrentPage(1);
				$dashboardList = $superset->getDashboardRepository()->getList($ormParams);
			}
			else
			{
				return [];
			}
		}

		$dashboardIds = [];
		foreach ($dashboardList as $index => $dashboard)
		{
			$dashboardList[$index] = $dashboard->toArray();
			$dashboardIds[$dashboard->getId()] = $index;
		}

		$dashboardTagsQuery = SupersetDashboardTable::getList([
			'filter' => [
				'=ID' => array_keys($dashboardIds),
				'=TAGS.USER_ID' => $userId,
			],
			'select' => ['TAGS', 'ID']
		]);

		foreach ($dashboardTagsQuery->fetchCollection() as $dashboard)
		{
			$tagList = [];
			$tags = $dashboard->getTags();
			foreach ($tags->getAll() as $tag)
			{
				$tagList[] = [
					'ID' => $tag->getId(),
					'TITLE' => $tag->getTitle(),
					'IS_FILTERED' => !empty($ormParams['filter']['TAGS.ID']) && in_array($tag->getId(), $ormParams['filter']['TAGS.ID'])
				];
			}

			$index = $dashboardIds[$dashboard->getId()];
			$dashboardList[$index]['TAGS'] = $tagList;
		}

		return $dashboardList;
	}

	private function getSupersetController(): SupersetController
	{
		if (!isset($this->supersetController))
		{
			$this->supersetController = new SupersetController(ProxyIntegrator::getInstance());
		}

		return $this->supersetController;
	}
}
