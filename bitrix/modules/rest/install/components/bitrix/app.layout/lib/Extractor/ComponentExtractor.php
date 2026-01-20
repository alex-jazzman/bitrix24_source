<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Extractor;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest;

class ComponentExtractor extends Extractor
{
	private array $defaultUrlTemplates404 = ['application' => '#id/',];
	private array $componentDefaultVars = ['id'];
	private array $componentRealVars = [];

	public function __construct(array $componentParams)
	{
		$this->applyParamsAndSetVariables($componentParams);
		$this->enabled = !empty($this->componentRealVars);
	}

	public function run(): array
	{
		if (!empty($this->componentRealVars['placement_id']))
		{
			$placementId = (int)$this->componentRealVars['placement_id'];
			if (
				(string)$placementId === (string)$this->componentRealVars['placement_id']
				&&
				($placement = Rest\PlacementTable::getById($placementId)->fetch())
			)
			{
				return [
					'ID' => $placement['APP_ID'],
					'CODE' => $placement['APP_ID'],
					'PLACEMENT' => $placement['PLACEMENT'],
					'PLACEMENT_ID' => $placement['ID'],
				];
			}
		}

		if (!empty($this->componentRealVars['id']))
		{
			$appId = (int)$this->componentRealVars['id'];
			if ((string)$appId === (string)$this->componentRealVars['id'])
			{
				return [
					'ID' => $appId,
				];
			}

			return [
				'CODE' => (string)$appId,
			];
		}

		return [];
	}

	private function applyParamsAndSetVariables(array $componentParams): void
	{
		$componentParams['SEF_MODE'] ??= 'N';
		$componentParams['SEF_URL_TEMPLATES'] ??= [];
		$componentParams['VARIABLE_ALIASES'] ??= [];
		if ($componentParams['SEF_MODE'] == 'Y')
		{
			$componentPage = \CComponentEngine::ParseComponentPath(
				$componentParams['SEF_FOLDER'],
				\CComponentEngine::MakeComponentUrlTemplates(
					$this->defaultUrlTemplates404,
					$componentParams['SEF_URL_TEMPLATES']
				),
				$this->componentRealVars
			);

			if (!$componentPage)
			{
				$componentPage = 'application';
			}
		}
		else
		{
			$componentPage = false;
		}

		\CComponentEngine::InitcomponentVariables(
			$componentPage,
			$this->componentDefaultVars,
			\CComponentEngine::MakeComponentVariableAliases(
				[],
				$componentParams['VARIABLE_ALIASES']
			),
			$this->componentRealVars
		);
	}
}
