<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Integration\Superset\Model\Dashboard;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetDashboardTagTable;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetTagTable;
use Bitrix\BIConnector\Superset\Grid\DashboardTagGrid;
use Bitrix\Bitrix24\CurrentUser;
use Bitrix\Main\Grid\Settings;
use Bitrix\Main\Loader;
use Bitrix\Main\ORM\Fields\ExpressionField;
use Bitrix\Main\ORM\Fields\Relations\Reference;
use Bitrix\Main\ORM;
use Bitrix\UI\Toolbar\Facade\Toolbar;

Loader::includeModule('biconnector');

class ApacheSupersetDashboardTagListComponent extends CBitrixComponent
{
	private const GRID_ID = 'biconnector_superset_dashboard_tag_grid';
	private const DASHBOARD_GRID_ID = 'biconnector_superset_dashboard_grid';

	private DashboardTagGrid $grid;

	public function onPrepareComponentParams($arParams)
	{
		$arParams['USER_ID'] = CurrentUser::get()?->getId() ?? 0;

		return parent::onPrepareComponentParams($arParams);
	}

	public function executeComponent()
	{
		$this->init();
		$this->grid->processRequest();
		$this->loadRows();

		$this->arResult['GRID'] = $this->grid;
		$this->arResult['DASHBOARD_GRID_ID'] = self::DASHBOARD_GRID_ID;

		$this->includeComponentTemplate();
	}

	private function init(): void
	{
		$settings = new Settings([
			'ID' => self::GRID_ID,
			'SHOW_ROW_CHECKBOXES' => false,
			'SHOW_SELECTED_COUNTER' => false,
			'SHOW_TOTAL_COUNTER' => true,
			'EDITABLE' => false,
		]);

		$grid = new DashboardTagGrid($settings);
		$this->grid = $grid;
		if (empty($this->grid->getOptions()->getSorting()['sort']))
		{
			$this->grid->getOptions()->SetSorting('ID', 'desc');
		}

		$totalCount = SupersetTagTable::getCount(['USER_ID' => $this->arParams['USER_ID']]);
		$grid->initPagination($totalCount);

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

	private function loadRows(): void
	{
		$rows = $this->getGridRows($this->grid->getOrmParams());
		$this->grid->setRawRows($rows);
	}

	/**
	 * @param array $ormParams
	 * @return Dashboard[]
	 */
	private function getGridRows(array $ormParams): array
	{
		$filter = $ormParams['filter'] ?? [];
		$filter['USER_ID'] = $this->arParams['USER_ID'];
		$bindingDashboardTagQuery =	SupersetDashboardTagTable::query()
			->setSelect(['TAG_ID', 'DASHBOARD_COUNT'])
			->addGroup('TAG_ID')
			->registerRuntimeField(new ExpressionField('DASHBOARD_COUNT', 'COUNT(1)'))
			->where('TAG.USER_ID', $this->arParams['USER_ID'])
		;

		$entity = ORM\Entity::getInstanceByQuery($bindingDashboardTagQuery);

		$tags = SupersetTagTable::query()
			->setFilter($filter)
			->setSelect(['ID', 'TITLE', 'DASHBOARD_COUNT' => 'BINDINGS.DASHBOARD_COUNT'])
			->registerRuntimeField(
				'BINDINGS',
				(
					new Reference(
						'BINDINGS',
						$entity,
						ORM\Query\Join::on('this.ID', 'ref.TAG_ID')
					)
				)
					->configureJoinType(ORM\Query\Join::TYPE_LEFT)
			)
		;

		if (!empty($ormParams['order']))
		{
			$tags->setOrder($ormParams['order']);
		}

		if (!empty($ormParams['limit']))
		{
			$tags->setLimit((int)$ormParams['limit']);
		}

		if (!empty($ormParams['offset']))
		{
			$tags->setOffset((int)$ormParams['offset']);
		}

		return $tags->fetchAll();
	}
}
