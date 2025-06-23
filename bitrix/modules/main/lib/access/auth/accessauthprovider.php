<?php

namespace Bitrix\Main\Access\Auth;

use Bitrix\HumanResources\Config\Storage;
use Bitrix\HumanResources\Service\Container;
use Bitrix\HumanResources\Type\MemberEntityType;
use Bitrix\HumanResources\Type\NodeEntityType;
use Bitrix\Main\Application;
use Bitrix\Main\Access\AccessCode;
use Bitrix\Main\Loader;

class AccessAuthProvider extends \CAuthProvider
{
	protected const PROVIDER_ID = 'access';

	public static function GetProviders()
	{
		return [
			[
				"ID" => self::PROVIDER_ID,
				"CLASS" => self::class,
			]
		];
	}

	public function __construct()
	{
		$this->id = self::PROVIDER_ID;
	}

	public function UpdateCodes($userId)
	{
		global $DB;

		if (
			Loader::includeModule('humanresources')
			&& Storage::instance()->isCompanyStructureConverted()
		)
		{
			$this->updateCodesByHr($userId);

			return null;
		}

		$iblockId = \COption::GetOptionInt('intranet', 'iblock_structure');
		if ($iblockId > 0)
		{
			$tableName = "b_uts_iblock_". $iblockId ."_section";

			if (!$DB->TableExists($tableName))
			{
				return null;
			}

			$res = $DB->query("
				SELECT VALUE_ID
				FROM ". $tableName ."
				WHERE UF_HEAD = " . $userId
			);

			$connection = Application::getConnection();
			$helper = $connection->getSqlHelper();

			while ($row = $res->fetch())
			{
				$id = (int) $row['VALUE_ID'];

				$sql = $helper->getInsertIgnore(
					'b_user_access',
					'(USER_ID, PROVIDER_ID, ACCESS_CODE)',
					'VALUES
						('.$userId.',\''.$this->id.'\',\''.AccessCode::ACCESS_DIRECTOR.'0\'),
						('.$userId.',\''.$this->id.'\',\''.AccessCode::ACCESS_DIRECTOR.$id.'\')'
				);
				$DB->query($sql);
			}
		}
	}

	private function updateCodesByHr(int $userId): void
	{
		$roleHelperService = Container::getRoleHelperService();
		$deputyRole = $roleHelperService->getDeputyRoleId();
		$headRole = $roleHelperService->getHeadRoleId();

		if (!$deputyRole && !$headRole)
		{
			return;
		}

		$nodeMemberRepository = Container::getNodeMemberRepository();
		$nodeMemberCollection = $nodeMemberRepository->findAllByEntityIdAndEntityTypeAndNodeType(
			$userId,
			MemberEntityType::USER,
			NodeEntityType::DEPARTMENT,
		);

		$connection = Application::getConnection();
		$insertValues = [];

		foreach ($nodeMemberCollection as $nodeMember)
		{
			if ($nodeMember->entityType !== MemberEntityType::USER)
			{
				continue;
			}

			$neededRoles = array_intersect([$headRole, $deputyRole], $nodeMember->roles);
			if (empty($neededRoles))
			{
				continue;
			}

			$userId = $nodeMember->entityId;

			foreach ($neededRoles as $role)
			{
				$type = $role === $headRole ? AccessCode::ACCESS_DIRECTOR : AccessCode::ACCESS_DEPUTY;
				$accessCode = $type . $nodeMember->nodeId;

				$insertValues[] = "($userId, '$this->id', '{$type}0')";
				$insertValues[] = "($userId, '$this->id', '$accessCode')";
			}
		}

		if (!empty($insertValues))
		{
			$helper = $connection->getSqlHelper();

			$sql = $helper->getInsertIgnore(
				'b_user_access',
				'(USER_ID, PROVIDER_ID, ACCESS_CODE)',
				'VALUES' . implode(
					',',
					$insertValues,
				),
			);

			$connection->query($sql);
		}
	}
}
