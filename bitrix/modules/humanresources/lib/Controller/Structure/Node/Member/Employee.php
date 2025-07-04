<?php

namespace Bitrix\HumanResources\Controller\Structure\Node\Member;

use Bitrix\HumanResources\Access\StructureActionDictionary;
use Bitrix\HumanResources\Internals\Attribute;
use Bitrix\HumanResources\Internals\Attribute\StructureActionAccess;
use Bitrix\HumanResources\Internals\Attribute\Access\LogicOr;
use Bitrix\HumanResources\Contract\Repository\NodeMemberRepository;
use Bitrix\HumanResources\Contract\Repository\RoleRepository;
use Bitrix\HumanResources\Item;
use Bitrix\HumanResources\Engine\Controller;
use Bitrix\HumanResources\Item\NodeMember;
use Bitrix\HumanResources\Service\UserService;
use Bitrix\HumanResources\Service\Container;
use Bitrix\HumanResources\Type\AccessibleItemType;
use Bitrix\HumanResources\Type\NodeEntityType;
use Bitrix\Main\Request;

final class Employee extends Controller
{
	private readonly RoleRepository $roleRepository;
	private readonly NodeMemberRepository $nodeMemberRepository;
	private readonly UserService $userService;

	public function __construct(Request $request = null)
	{
		$this->roleRepository = Container::getRoleRepository();
		$this->nodeMemberRepository = Container::getNodeMemberRepository();
		$this->userService = Container::getUserService();
		parent::__construct($request);
	}

	#[LogicOr(
		new StructureActionAccess(
			permission: StructureActionDictionary::ACTION_STRUCTURE_VIEW,
			itemType: AccessibleItemType::NODE,
			itemIdRequestKey: 'nodeId',
		),
		new StructureActionAccess(
			permission: StructureActionDictionary::ACTION_TEAM_VIEW,
			itemType: AccessibleItemType::NODE,
			itemIdRequestKey: 'nodeId',
		),
	)]
	public function getIdsAction(Item\Node $node): array
	{
		if ($node->type === NodeEntityType::TEAM)
		{
			$employeeRole = $this->roleRepository->findByXmlId(NodeMember::TEAM_ROLE_XML_ID['TEAM_EMPLOYEE']);
		}
		else
		{
			$employeeRole = $this->roleRepository->findByXmlId(NodeMember::DEFAULT_ROLE_XML_ID['EMPLOYEE']);
		}

		if (!$employeeRole)
		{
			return [];
		}
		$employeeCollection = $this->nodeMemberRepository->findAllByRoleIdAndNodeId($employeeRole->id, $node->id);

		return array_column($employeeCollection->getItemMap(), 'entityId');
	}

	#[LogicOr(
		new StructureActionAccess(
			permission: StructureActionDictionary::ACTION_STRUCTURE_VIEW,
			itemType: AccessibleItemType::NODE,
			itemIdRequestKey: 'nodeId',
		),
		new StructureActionAccess(
			permission: StructureActionDictionary::ACTION_TEAM_VIEW,
			itemType: AccessibleItemType::NODE,
			itemIdRequestKey: 'nodeId',
		),
	)]
	public function listAction(
		Item\Node $node,
		int $page = 1,
		int $countPerPage = 10,
	): array
	{
		if ($node->type === NodeEntityType::TEAM)
		{
			$employeeRole = $this->roleRepository->findByXmlId(NodeMember::TEAM_ROLE_XML_ID['TEAM_EMPLOYEE']);
		}
		else
		{
			$employeeRole = $this->roleRepository->findByXmlId(NodeMember::DEFAULT_ROLE_XML_ID['EMPLOYEE']);
		}

		$employeeUsers = [];
		if (!$employeeRole)
		{
			return $employeeUsers;
		}

		$limit = $countPerPage;

		$offset = $countPerPage * ($page - 1);
		$employees = $this->nodeMemberRepository->findAllByRoleIdAndNodeId(
			roleId: $employeeRole->id,
			nodeId: $node->id,
			limit: $limit,
			offset: $offset,
			ascendingSort: false
		);
		$employeeUserCollection = $this->userService->getUserCollectionFromMemberCollection($employees);
		foreach ($employeeUserCollection as $user)
		{
			$employeeUsers[] = $this->userService->getBaseInformation($user);
		}

		$userIdToMemberIdMap = [];
		foreach ($employees as $employee)
		{
			$userIdToMemberIdMap[$employee->entityId] = $employee->id;
		}

		usort(
			$employeeUsers,
			function ($a, $b) use ($userIdToMemberIdMap)
			{
				return $userIdToMemberIdMap[$b['id']] <=> $userIdToMemberIdMap[$a['id']];
			},
		);

		return $employeeUsers;
	}
}