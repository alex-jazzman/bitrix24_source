<?php

namespace Bitrix\BIConnector\Superset\Grid\Row\Action\Dashboard;

use Bitrix\Main\Grid\Row\Action\BaseAction;
use Bitrix\Main\HttpRequest;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;

final class DeleteFromTopMenuAction extends BaseAction
{
	public static function getId(): string
	{
		return 'deleteFromTopMenu';
	}

	public function processRequest(HttpRequest $request): ?Result
	{
		return null;
	}

	protected function getText(): string
	{
		return Loc::getMessage('BICONNECTOR_DASHBOARD_GRID_ACTION_DELETE_FROM_TOP_MENU') ?? '';
	}

	public function getControl(array $rawFields): ?array
	{
		$dashboardId = (int)$rawFields['ID'];
		$isFavorite = $rawFields['IS_IN_TOP_MENU'];
		if (!$isFavorite)
		{
			return null;
		}

		$url = $rawFields['DETAIL_URL'];
		if (!$url)
		{
			return null;
		}

		$url .= (str_contains($url, '?') ? '&' : '?')
			. 'openFrom=menu';

		$this->onclick = "BX.BIConnector.SupersetDashboardGridManager.Instance.deleteFromTopMenu({$dashboardId}, `{$url}`)";

		$result = parent::getControl($rawFields);
		$result['ACTION_ID'] = self::getId();

		return $result;
	}
}
