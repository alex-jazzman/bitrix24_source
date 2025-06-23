<?php

namespace Bitrix\HumanResources\Service;

use Bitrix\HumanResources\Contract;
use Bitrix\HumanResources\Item;
use Bitrix\HumanResources\Item\NodeMember;

class RoleHelperService implements Contract\Service\RoleHelperService
{
	private readonly Contract\Repository\RoleRepository $roleRepository;

	public function __construct(
		?Contract\Repository\RoleRepository $roleRepository = null,
	)
	{
		$this->roleRepository = $roleRepository ?? Container::getRoleRepository();
	}

	public function getById(int $roleId): ?Item\Role
	{
		return $this->roleRepository->getById($roleId);
	}
	public function getEmployeeRoleId(): ?int
	{
		return $this->roleRepository->findByXmlId(NodeMember::DEFAULT_ROLE_XML_ID['EMPLOYEE'])?->id;
	}

	public function getHeadRoleId(): ?int
	{
		static $headRoleId;
		if (!$headRoleId)
		{
			$headRoleId = $this->roleRepository->findByXmlId(NodeMember::DEFAULT_ROLE_XML_ID['HEAD'])?->id;
		}

		return $headRoleId;
	}

	public function getDeputyRoleId(): ?int
	{
		return $this->roleRepository->findByXmlId(NodeMember::DEFAULT_ROLE_XML_ID['DEPUTY_HEAD'])?->id;
	}

	public function getTeamHeadRole(): ?Item\Role
	{
		static $teamHeadRole;
		if (!$teamHeadRole)
		{
			$teamHeadRole = $this->roleRepository->findByXmlId(NodeMember::TEAM_ROLE_XML_ID['TEAM_HEAD']);
		}

		return $teamHeadRole;
	}

	public function getTeamDeputyRole(): ?Item\Role
	{
		static $teamDeputyRole;
		if (!$teamDeputyRole)
		{
			$teamDeputyRole = $this->roleRepository->findByXmlId(NodeMember::TEAM_ROLE_XML_ID['TEAM_DEPUTY_HEAD']);
		}

		return $teamDeputyRole;
	}

	public function getTeamEmployeeRole(): ?Item\Role
	{
		static $teamEmployeeRole;
		if (!$teamEmployeeRole)
		{
			$teamEmployeeRole = $this->roleRepository->findByXmlId(NodeMember::TEAM_ROLE_XML_ID['TEAM_EMPLOYEE']);
		}

		return $teamEmployeeRole;
	}
}