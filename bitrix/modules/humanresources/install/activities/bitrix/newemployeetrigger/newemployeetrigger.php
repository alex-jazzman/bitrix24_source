<?php

declare(strict_types=1);

use Bitrix\Bizproc\Activity\BaseTrigger;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\Activity\Trigger\TriggerParameters;
use Bitrix\Bizproc\Error;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Result;
use Bitrix\HumanResources\Enum\DepthLevel;
use Bitrix\HumanResources\Integration\Bizproc\NewEmployeeTrigger;
use Bitrix\HumanResources\Public\Service\Container as HumanResourcesContainer;
use Bitrix\HumanResources\Type\AccessCodeType;
use Bitrix\HumanResources\Type\NodeEntityType;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPNewEmployeeTrigger extends BaseTrigger
{
	private const PARAM_DEPARTMENTS = 'DEPARTMENTS';
	private const RETURN_PARAM_USER = 'USER';
	private const RETURN_PARAM_EVENT_DATE_TIME = 'EventDateTime';

	/**
	 * Node types the filter is read against. A team picked in the property has to work exactly like a
	 * department, and the membership lookup answers with departments alone unless asked for both.
	 */
	private const FILTER_NODE_TYPES = [NodeEntityType::DEPARTMENT, NodeEntityType::TEAM];

	/**
	 * Refusal codes of the filter, taken from the contract of the event: the dispatcher classifies them by
	 * their common prefix, so the codes are declared once there and never restated here.
	 */
	private const ERROR_UNRESOLVED_FILTER = NewEmployeeTrigger::REFUSAL_UNRESOLVED_FILTER;
	private const ERROR_NO_STRUCTURE_CODES = NewEmployeeTrigger::REFUSAL_NO_STRUCTURE_CODES;
	private const ERROR_NO_MEMBER_NODES = NewEmployeeTrigger::REFUSAL_NO_MEMBER_NODES;
	private const ERROR_OUTSIDE_SELECTION = NewEmployeeTrigger::REFUSAL_OUTSIDE_SELECTION;
	private const ERROR_NO_EMPLOYEE = NewEmployeeTrigger::REFUSAL_NO_EMPLOYEE;

	/**
	 * Answers of the org structure, kept for the event being checked. The scope is the class and not the
	 * instance on purpose: the engine checks the rules of every published template on a fresh instance of
	 * the node ({@see \Bitrix\Bizproc\Activity\Mixins\ApplyRulesChecker}), so an instance field would come
	 * back empty on each of them and every template would ask the same questions again. The file of the
	 * node is included once per hit, which leaves the statics of the class the only scope living long
	 * enough to hold the answers of one event.
	 *
	 * The membership is held as a single slot keyed by the employee: the templates of one event are checked
	 * one after another, so a single slot is enough to drop the multiplier by templates, and an event about
	 * another employee starts the slot over instead of growing it. The identifier is the emptiness mark as
	 * well, telling "not asked yet" from "asked, and the employee belongs nowhere".
	 *
	 * @var list<int>
	 */
	private static array $memberNodeIds = [];
	private static ?int $memberNodeIdsUserId = null;

	/** @var array<int, list<int>> Ancestors of a node, which do not depend on the employee of the event. */
	private static array $ancestorIdsByNodeId = [];

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_DEPARTMENTS => null,
			self::RETURN_PARAM_USER => null,
			self::RETURN_PARAM_EVENT_DATE_TIME => null,
		];

		$this->SetPropertiesTypes([
			self::RETURN_PARAM_USER => ['Type' => FieldType::USER],
			self::RETURN_PARAM_EVENT_DATE_TIME => ['Type' => FieldType::DATETIME],
		]);
	}

	public function execute(): int
	{
		$context = $this->getEventData();

		$userId = (int)($context[NewEmployeeTrigger::FIELD_USER_ID] ?? 0);
		if ($userId > 0)
		{
			$this->{self::RETURN_PARAM_USER} = 'user_' . $userId;
		}

		// Stays the string the dispatcher sent: a delayed start carries the payload through storage.
		$eventDateTime = $context[NewEmployeeTrigger::FIELD_EVENT_DATE_TIME] ?? null;
		if (is_string($eventDateTime) && $eventDateTime !== '')
		{
			$this->{self::RETURN_PARAM_EVENT_DATE_TIME} = $eventDateTime;
		}

		return CBPActivityExecutionStatus::Closed;
	}

	public static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_DEPARTMENTS => [
				'Name' => (string)Loc::getMessage('HUMAN_RESOURCES_NEW_EMPLOYEE_TRIGGER_PROPERTY_DEPARTMENTS'),
				'Description' => (string)Loc::getMessage('HUMAN_RESOURCES_NEW_EMPLOYEE_TRIGGER_PROPERTY_DEPARTMENTS_DESCR'),
				'FieldName' => self::PARAM_DEPARTMENTS,
				'Type' => FieldType::USER,
				'Required' => false,
				'Multiple' => true,
			],
		];
	}

	public static function getPropertiesDialog(
		$documentType,
		$activityName,
		$arWorkflowTemplate,
		$arWorkflowParameters,
		$arWorkflowVariables,
		$arCurrentValues = null,
		$formName = '',
		$popupWindow = null,
		$siteId = '',
	): PropertiesDialog
	{
		$dialog = new PropertiesDialog(__FILE__, [
			'documentType' => $documentType,
			'activityName' => $activityName,
			'workflowTemplate' => $arWorkflowTemplate,
			'workflowParameters' => $arWorkflowParameters,
			'workflowVariables' => $arWorkflowVariables,
			'currentValues' => $arCurrentValues,
			'formName' => $formName,
			'siteId' => $siteId,
		]);

		$dialog->setMap(static::getPropertiesMap($documentType));

		return $dialog;
	}

	/**
	 * The filter of the node against the employee the event carries. A node saved without the filter takes
	 * any new employee; a filled one takes the employees picked by hand and the members of the picked
	 * structure nodes, and of the nodes below them as well for a node picked together with its subordinates.
	 *
	 * A filter that is set but resolves into no code is not the same thing as no filter at all. The property
	 * takes expressions, and the rule check runs on a stub workflow whose parameters and variables are empty
	 * ({@see \Bitrix\Bizproc\Activity\Mixins\ApplyRulesChecker}), so an expression over them resolves into
	 * nothing here. Reading that as an empty filter would start the process for every new employee of the
	 * portal, so the emptiness of the setting is judged on the raw value and an unresolved one is rejected.
	 *
	 * The check runs on every event, and once per published template holding the node, so the order of the
	 * steps is the order of their cost: nothing is asked of the org structure until the answer can come
	 * from nowhere else, and every answer it does give is kept for the event ({@see self::$memberNodeIds}).
	 */
	public function checkApplyRules(array $rules, TriggerParameters $parameters): Result
	{
		$userId = (int)$parameters->get(NewEmployeeTrigger::FIELD_USER_ID);
		if ($userId <= 0)
		{
			// The node is a public trigger: any addEvent() with its code reaches here, not the launcher of the
			// module alone. An event carrying no employee has nothing to check and nothing to fill USER with.
			return self::rejected(self::ERROR_NO_EMPLOYEE, 'the event carries no employee');
		}

		if (CBPHelper::isEmptyValue(CBPHelper::flatten($this->getRawProperty(self::PARAM_DEPARTMENTS))))
		{
			return Result::createOk();
		}

		$selectedCodes = self::normalizeCodes(CBPHelper::flatten($this->{self::PARAM_DEPARTMENTS}));
		if (!$selectedCodes)
		{
			return self::rejected(self::ERROR_UNRESOLVED_FILTER, 'the filter resolves into no access code');
		}

		$selectedUserIds = self::selectedUserIds($selectedCodes);
		if (in_array($userId, $selectedUserIds, true))
		{
			return Result::createOk();
		}

		[$plainNodeIds, $deepNodeIds] = self::selectedNodeIds($selectedCodes);
		if (!$plainNodeIds && !$deepNodeIds)
		{
			if ($selectedUserIds)
			{
				// Employees picked by hand are a filter of their own: no node was picked to be missing, the
				// employee of the event is simply not among the picked ones.
				return self::rejected(self::ERROR_OUTSIDE_SELECTION, 'the employee is not among the picked ones');
			}

			// User groups, socnet groups and "all departments" name no structure node. Reading such a
			// setting as an empty one would start the process for every new employee of the portal.
			return self::rejected(self::ERROR_NO_STRUCTURE_CODES, 'the filter names no structure node');
		}

		$memberNodeIds = self::memberNodeIds($userId);
		if (!$memberNodeIds)
		{
			// A portal whose structure is not converted yet answers the same way, and stays unmatched
			// instead of taking everyone.
			return self::rejected(self::ERROR_NO_MEMBER_NODES, 'the employee belongs to no structure node');
		}

		// A node picked together with its subordinates takes its own members too, and a node of its own
		// is not among its ancestors.
		if (array_intersect($memberNodeIds, array_merge($plainNodeIds, $deepNodeIds)) !== [])
		{
			return Result::createOk();
		}

		if (!$deepNodeIds)
		{
			return self::rejected(self::ERROR_OUTSIDE_SELECTION, 'the employee is outside the filtered nodes');
		}

		foreach ($memberNodeIds as $memberNodeId)
		{
			if (array_intersect(self::ancestorIds($memberNodeId), $deepNodeIds) !== [])
			{
				return Result::createOk();
			}
		}

		return self::rejected(self::ERROR_OUTSIDE_SELECTION, 'the employee is outside the filtered nodes');
	}

	protected static function getModuleId(): ?string
	{
		return 'humanresources';
	}

	/**
	 * Resets memoized answers of the org structure. Intended for use in tests.
	 */
	public static function resetLookupCache(): void
	{
		self::$memberNodeIds = [];
		self::$memberNodeIdsUserId = null;
		self::$ancestorIdsByNodeId = [];
	}

	/**
	 * Structure nodes the employee belongs to, asked for once per employee.
	 *
	 * @return list<int>
	 */
	private static function memberNodeIds(int $userId): array
	{
		if (self::$memberNodeIdsUserId !== $userId)
		{
			self::$memberNodeIds = HumanResourcesContainer::getNodeMemberService()
				->findAllByEntityIds(
					entityIds: [$userId],
					nodeTypes: self::FILTER_NODE_TYPES,
					withVirtualUsers: false,
				)
				->getUniqueNodeIds()
			;
			self::$memberNodeIdsUserId = $userId;
		}

		return self::$memberNodeIds;
	}

	/**
	 * The whole chain of ancestors of a node, asked for once per node.
	 *
	 * @return list<int>
	 */
	private static function ancestorIds(int $nodeId): array
	{
		if (!array_key_exists($nodeId, self::$ancestorIdsByNodeId))
		{
			self::$ancestorIdsByNodeId[$nodeId] = HumanResourcesContainer::getNodeService()
				->findParentsByNodeId($nodeId, depthLevel: DepthLevel::FULL)
				?->getIds() ?? []
			;
		}

		return self::$ancestorIdsByNodeId[$nodeId];
	}

	/**
	 * Access codes as the engine writes them: lower case, one flat list. Anything the property carries that
	 * is not a code at all is dropped instead of becoming an empty entry: the caller tells a filter that
	 * resolves into nothing from a filter that was never set by this list coming back empty.
	 *
	 * @return list<string>
	 */
	private static function normalizeCodes(array $value): array
	{
		$codes = [];
		foreach ($value as $code)
		{
			if (is_string($code) && $code !== '')
			{
				$codes[] = mb_strtolower($code);
			}
		}

		return $codes;
	}

	/**
	 * Employees the filter names by hand, and the `user_<id>` form of them alone. A bare id is no employee
	 * here: the core resolves such a value into a user group ({@see \CBPHelper::extractUsers()}), and this
	 * filter never expands a group into its members, so the setting is refused instead of taking a person.
	 *
	 * @param list<string> $codes
	 *
	 * @return list<int>
	 */
	private static function selectedUserIds(array $codes): array
	{
		$userIds = [];
		foreach ($codes as $code)
		{
			if (preg_match('/^user_(\d+)$/', $code, $match))
			{
				$userIds[] = (int)$match[1];
			}
		}

		return $userIds;
	}

	/**
	 * Structure nodes named by the codes, read in one pass and split by the trailing `r` of the code: the
	 * nodes picked as they are and the nodes picked together with their subordinates.
	 *
	 * The two dictionaries do not meet: `hr` codes of the engine carry the node id itself, while `d` codes
	 * carry a section id of the old structure and are translated through the access code of the node. Each
	 * kind of pick that names a section costs one translation, and none is made when no such code is picked:
	 * the translation answers with node ids alone, so a single call for both kinds could not tell which kind
	 * of pick a node id came from.
	 *
	 * @param list<string> $codes
	 *
	 * @return array{0: list<int>, 1: list<int>} Nodes picked as they are, then nodes picked with subordinates.
	 */
	private static function selectedNodeIds(array $codes): array
	{
		$nodeIds = ['' => [], 'r' => []];
		$sectionIds = ['' => [], 'r' => []];
		foreach ($codes as $code)
		{
			if (preg_match('/^group_hr(r?)(\d+)$/', $code, $match))
			{
				$nodeIds[$match[1]][] = (int)$match[2];
			}
			elseif (preg_match('/^group_d(r?)(\d+)$/', $code, $match))
			{
				$sectionIds[$match[1]][] = (int)$match[2];
			}
		}

		return [
			self::withSectionsTranslated($nodeIds[''], $sectionIds['']),
			self::withSectionsTranslated($nodeIds['r'], $sectionIds['r']),
		];
	}

	/**
	 * @param list<int> $nodeIds
	 * @param list<int> $sectionIds
	 *
	 * @return list<int>
	 */
	private static function withSectionsTranslated(array $nodeIds, array $sectionIds): array
	{
		if (!$sectionIds)
		{
			return $nodeIds;
		}

		$accessCodes = array_map(
			static fn(int $sectionId) => AccessCodeType::IntranetDepartmentType->buildAccessCode($sectionId),
			$sectionIds,
		);

		return array_merge(
			$nodeIds,
			HumanResourcesContainer::getNodeService()->getNodeIdsByAccessCodes($accessCodes),
		);
	}

	private static function rejected(string $code, string $message): Result
	{
		return Result::createError(new Error($message, $code));
	}
}
