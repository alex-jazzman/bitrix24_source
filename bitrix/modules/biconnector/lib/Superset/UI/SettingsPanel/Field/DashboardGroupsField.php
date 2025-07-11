<?php

namespace Bitrix\BIConnector\Superset\UI\SettingsPanel\Field;

use Bitrix\BIConnector\Integration\Superset\Model\Dashboard;
use Bitrix\BIConnector\Superset\Dashboard\UrlParameter;
use Bitrix\BIConnector\Superset\Scope\ScopeService;

final class DashboardGroupsField extends EntityEditorField
{
	public const FIELD_NAME = 'DASHBOARD_PARAMETERS';
	public const FIELD_ENTITY_EDITOR_TYPE = 'dashboardGroupsSelector';
	private Dashboard $dashboard;

	public function __construct(string $id, Dashboard $dashboard)
	{
		parent::__construct($id);
		\Bitrix\Main\UI\Extension::load(['ui.icons.disk']);

		$this->dashboard = $dashboard;
	}

	public function getFieldInitialData(): array
	{
		$scope = ScopeService::getInstance()->getDashboardScopes($this->dashboard->getId());
		$ormDashboard = $this->dashboard->getOrmObject();
		$paramsService = new UrlParameter\Service($ormDashboard);
		$params = $paramsService->getUrlParameters();
		$arrayParams = [];
		foreach ($params as $param)
		{
			$arrayParams[] = $param->code();
		}

		$scopeParamsMap = [];
		$globalParams = UrlParameter\ScopeMap::getGlobals();
		$globalScopeKey = 'global';
		foreach ($globalParams as $globalParam)
		{
			$scopeParamsMap[$globalScopeKey][] = [
				'code' => $globalParam->code(),
				'title' => $globalParam->title(),
				'description' => $globalParam->description(),
				'scope' => $globalScopeKey,
			];
		}

		$map = UrlParameter\ScopeMap::getMap();
		foreach ($map as $scopeCode => $scopeParams)
		{
			foreach ($scopeParams as $scopeParam)
			{
				$scopeParamsMap[$scopeCode][] = [
					'code' => $scopeParam->code(),
					'title' => $scopeParam->title(),
					'description' => $scopeParam->description(),
					'scope' => $scopeCode,
				];
			}
		}

		if (!$ormDashboard->isGroupsFilled())
		{
			$ormDashboard->fillGroups();
		}

		return [
			'GROUPS' => $ormDashboard->getGroups()->getIdList(),
			'SCOPE' => $scope,
			'PARAMS' => $arrayParams,
			'SCOPE_PARAMS_MAP' => $scopeParamsMap,
		];
	}

	public function getName(): string
	{
		return self::FIELD_NAME;
	}

	public function getType(): string
	{
		return self::FIELD_ENTITY_EDITOR_TYPE;
	}

	protected function getFieldInfoData(): array
	{
		return [];
	}
}
