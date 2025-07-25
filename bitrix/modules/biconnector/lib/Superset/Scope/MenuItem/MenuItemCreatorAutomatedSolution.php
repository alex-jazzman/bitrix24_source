<?php

namespace Bitrix\BIConnector\Superset\Scope\MenuItem;

use Bitrix\BIConnector\Integration\Superset\Model\EO_SupersetDashboard_Collection;

final class MenuItemCreatorAutomatedSolution extends BaseMenuItemCreator
{
	private readonly string $automatedSolutionCode;

	public function __construct(string $automatedSolutionCode)
	{
		$this->automatedSolutionCode = $automatedSolutionCode;
	}

	public function getMenuItemData(EO_SupersetDashboard_Collection $dashboards, array $params = []): array
	{
		$items = [];

		foreach ($dashboards as $dashboard)
		{
			$items[] = [
				'ID' => 'DASHBOARD_' . $dashboard->getId(),
				'TEXT' => $dashboard->getTitle(),
				'ON_CLICK' => $this->createDashboardOpenEventFromMenu($dashboard, $params),
			];
		}

		if (!empty($items))
		{
			$items[] = [
				'IS_DELIMITER' => true,
			];

			$items = [...$items, ...$this->getAdditionalItems()];
		}

		return [
			'ID' => 'BIC_DASHBOARDS',
			'TEXT' => $this->getMenuItemTitle(),
			'URL' => '',
			'ITEMS' => $items,
		];
	}

	protected function getScopeCode(): string
	{
		return $this->automatedSolutionCode;
	}
}
