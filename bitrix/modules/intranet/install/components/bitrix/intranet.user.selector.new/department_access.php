<?php

use Bitrix\HumanResources;

final class IntranetUserSelectorDepartmentAccess
{
	public static function getVisibleRootDepartmentIds(
		array $departments,
		array $allowedDepartmentIds,
	): array
	{
		$departmentById = [];
		foreach ($departments as $department)
		{
			$departmentById[(int)$department['ID']] = $department;
		}

		$visibleRootDepartmentIds = [];
		foreach ($departmentById as $departmentId => $department)
		{
			if (!isset($allowedDepartmentIds[$departmentId]))
			{
				continue;
			}

			$parentId = (int)$department['IBLOCK_SECTION_ID'];
			if ($parentId > 0 && isset($allowedDepartmentIds[$parentId]))
			{
				continue;
			}

			$visibleRootDepartmentIds[] = $departmentId;
		}

		return $visibleRootDepartmentIds;
	}

	public static function getAllowedDepartmentIdMap(array $departmentIds): array
	{
		$departmentIds = array_values(array_unique(array_filter(
			array_map('intval', $departmentIds),
			static fn(int $id): bool => $id > 0,
		)));
		if ($departmentIds === [])
		{
			return [];
		}

		try
		{
			if (\Bitrix\Main\Loader::includeModule('humanresources'))
			{
				$requestedDepartmentIds = array_fill_keys($departmentIds, true);
				$accessCodes = array_map(
					[HumanResources\Compatibility\Utils\DepartmentBackwardAccessCode::class, 'makeById'],
					$departmentIds,
				);
				$departments = HumanResources\Public\Service\Container::getNodeService()->findAllByAccessCodes(
					$accessCodes,
					structureAction: HumanResources\Type\StructureAction::ViewAction,
				);
				$allowedDepartmentIds = [];
				foreach ($departments as $department)
				{
					$id = HumanResources\Compatibility\Utils\DepartmentBackwardAccessCode::extractIdFromCode(
						$department->accessCode,
					);
					if (isset($requestedDepartmentIds[$id]))
					{
						$allowedDepartmentIds[$id] = true;
					}
				}

				return $allowedDepartmentIds;
			}

			if (\Bitrix\Main\Loader::includeModule('iblock'))
			{
				$departments = CIBlockSection::GetList(
					[],
					[
						'IBLOCK_ID' => COption::GetOptionInt('intranet', 'iblock_structure', 0),
						'ID' => $departmentIds,
						'CHECK_PERMISSIONS' => 'Y',
						'MIN_PERMISSION' => 'R',
					],
					false,
					['ID'],
				);
				$allowedDepartmentIds = [];
				while ($department = $departments->Fetch())
				{
					$allowedDepartmentIds[(int)$department['ID']] = true;
				}

				return $allowedDepartmentIds;
			}
		}
		catch (\Throwable)
		{
			return [];
		}

		return [];
	}
}
