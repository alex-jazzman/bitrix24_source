<?php

namespace Bitrix\HumanResources\Contract\Service;

use Bitrix\HumanResources\Item;

interface RoleHelperService
{
	public function getById(int $roleId): ?Item\Role;
	public function getEmployeeRoleId(): ?int;
	public function getHeadRoleId(): ?int;
	public function getDeputyRoleId(): ?int;
	public function getTeamHeadRole(): ?Item\Role;
	public function getTeamDeputyRole(): ?Item\Role;
	public function getTeamEmployeeRole(): ?Item\Role;
}