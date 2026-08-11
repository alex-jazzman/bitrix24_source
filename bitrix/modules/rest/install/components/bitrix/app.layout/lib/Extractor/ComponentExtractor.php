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
		$rawPlacementId = $this->componentRealVars['placement_id'] ?? null;
		$placementId = (int)$rawPlacementId;
		if ($placementId > 0 && (string)$placementId === (string)$rawPlacementId)
		{
			$placement = Rest\PlacementTable::getById($placementId)->fetch();
			if ($placement)
			{
				return [
					'ID' => $placement['APP_ID'],
					'CODE' => $placement['APP_ID'],
					'PLACEMENT' => $placement['PLACEMENT'],
					'PLACEMENT_ID' => $placement['ID'],
				];
			}

			return [];
		}

		if (!empty($this->componentRealVars['id']))
		{
			$rawId = $this->componentRealVars['id'];
			$appId = (int)$rawId;
			if ((string)$appId === (string)$rawId)
			{
				return [
					'ID' => $appId,
				];
			}

			return [
				'CODE' => trim((string)$rawId),
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

		\CComponentEngine::InitComponentVariables(
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
