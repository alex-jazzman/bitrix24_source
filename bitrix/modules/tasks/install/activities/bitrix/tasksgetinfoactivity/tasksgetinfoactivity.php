<?php

use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\UserTable;
use Bitrix\Im\Model\MessageTable;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Error;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Tasks\Internals\Task\Result\ResultTable;
use Bitrix\Im\V2\Message\Text\BbCode\User;
use Bitrix\Tasks\Internals\Task\CheckListTable;
use Bitrix\Tasks\Internals\Task\MemberTable;
use Bitrix\Tasks\Internals\TaskTable;
use Bitrix\Tasks\UI\Task\Status;
use Bitrix\Main\Web\Json;
use Bitrix\Bizproc\Activity\PropertiesDialog;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

class CBPTasksGetInfoActivity extends BaseActivity
{
	private const MAX_MESSAGE_COUNT_LIMIT = 50;
	private const MAX_TASKS_LIMIT = 50;
	private const USER_NAME_SYSTEM = 'System';

	private const PARAM_USER_ID = 'PARAM_USER_ID';
	private const PARAM_MESSAGE_COUNT_LIMIT = 'MESSAGE_COUNT_LIMIT';

	private const RETURN_PARAM_TASKS_INFO_JSON = 'TASKS_INFO_JSON';
	private const RETURN_PARAM_COUNTER_TASKS_INFO = 'COUNTER_TASKS_INFO';

	public function __construct($name)
	{
		parent::__construct($name);

		$this->arProperties = [
			self::PARAM_USER_ID => [],
			self::PARAM_MESSAGE_COUNT_LIMIT => '',
			self::RETURN_PARAM_TASKS_INFO_JSON => null,
			self::RETURN_PARAM_COUNTER_TASKS_INFO => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_TASKS_INFO_JSON => [
				'Type' => FieldType::JSON,
			],
			self::RETURN_PARAM_COUNTER_TASKS_INFO => [
				'Type' => FieldType::INT,
			],
		]);
	}

	public function execute(): int
	{
		if (!CModule::IncludeModule('tasks') || !CModule::IncludeModule('im'))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		$userId = $this->{self::PARAM_USER_ID};
		if (!is_numeric($userId))
		{
			$userId = CBPHelper::ExtractFirstUser(
				$userId,
				$this->getDocumentId()
			);
		}

		if (empty($userId))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		try {
			[$tasks, $userIdList] = $this->getTasks((int)$userId);
			$this->prepareTasks($tasks, $userIdList);
		}
		catch (\Throwable $exception)
		{
			$this->trackError($exception->getMessage());

			return CBPActivityExecutionStatus::Closed;
		}

		$this->{self::RETURN_PARAM_TASKS_INFO_JSON} = Json::encode(
			array_values($tasks),
			JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
		);
		$this->{self::RETURN_PARAM_COUNTER_TASKS_INFO} = count($tasks);

		return CBPActivityExecutionStatus::Closed;
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_USER_ID => [
				'Name' => Loc::getMessage('TASKS_GET_INFO_FIELD_USER_ID'),
				'FieldName' => self::PARAM_USER_ID,
				'Type' => FieldType::USER,
				'Required' => true,
			],
			self::PARAM_MESSAGE_COUNT_LIMIT => [
				'Name' => Loc::getMessage('TASKS_GET_INFO_FIELD_MESSAGE_COUNT_LIMIT'),
				'FieldName' => self::PARAM_MESSAGE_COUNT_LIMIT,
				'Type' => FieldType::INT,
				'Default' => self::MAX_MESSAGE_COUNT_LIMIT,
				'AllowSelection' => false,
			],
		];
	}

	public static function getPropertiesDialogValues(
		$documentType,
		$activityName,
		&$workflowTemplate,
		&$workflowParameters,
		&$workflowVariables,
		$arCurrentValues,
		&$errors,
	): bool
	{
		$properties = [];
		$errors = [];

		$documentService = CBPRuntime::getRuntime()->getDocumentService();
		foreach (static::getPropertiesMap($documentType) as $id => $property)
		{
			$value = $documentService->getFieldInputValue(
				$documentType,
				$property,
				$property['FieldName'],
				$arCurrentValues,
				$errors
			);

			if (!empty($errors))
			{
				return false;
			}

			if ($id == self::PARAM_MESSAGE_COUNT_LIMIT && is_null($value))
			{
				$value = self::MAX_MESSAGE_COUNT_LIMIT;
			}

			$properties[$id] = $value;
		}

		$errors = self::validateProperties(
			$properties,
			new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser)
		);

		if ($errors)
		{
			return false;
		}

		$currentActivity = &CBPWorkflowTemplateLoader::findActivityByName($workflowTemplate, $activityName);
		$currentActivity['Properties'] = $properties;

		return true;
	}

	protected function checkProperties(): ErrorCollection
	{
		$errorCollection = new ErrorCollection();
		$propertyMap = self::getPropertiesDialogMap();

		if (!is_numeric($this->{self::PARAM_MESSAGE_COUNT_LIMIT}))
		{
			$errorCollection->setError(
				new Error(
					Loc::getMessage(
						'TASKS_GET_INFO_FIELD_ERROR_INVALID_VALUE',
						['#PROPERTY_NAME#' => $propertyMap[self::PARAM_MESSAGE_COUNT_LIMIT]['Name'] ?? ''],
					),
				),
			);
		}

		return $errorCollection;
	}

	public static function validateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null): array
	{
		$errors = [];
		foreach (self::getPropertiesMap([]) as $id => $property)
		{
			if ($id == self::PARAM_MESSAGE_COUNT_LIMIT && !is_null($arTestProperties[$id]))
			{
				if (
					!is_numeric($arTestProperties[$id])
					|| (int)$arTestProperties[$id] <= 0
					|| (int)$arTestProperties[$id] > self::MAX_MESSAGE_COUNT_LIMIT
				)
				{
					$errors[] = self::makeError($id);
				}
			}
		}

		return array_merge($errors, parent::ValidateProperties($arTestProperties, $user));
	}

	private static function makeError(string $property): array
	{
		return [
			'message' => match ($property)
			{
				self::PARAM_MESSAGE_COUNT_LIMIT => Loc::getMessage(
					'TASKS_GET_INFO_FIELD_ERROR_INVALID_VALUE_IN_RANGE',
					[
						'#PROPERTY_NAME#' => Loc::getMessage('TASKS_GET_INFO_FIELD_MESSAGE_COUNT_LIMIT'),
						'#MIN_VALUE#' => 1,
						'#MAX_VALUE#' => self::MAX_MESSAGE_COUNT_LIMIT,
					],
				),
				default => '',
			},
		];
	}

	private function getTasks(int $userId): array
	{
		$select = [
			'ID',
			'TITLE',
			'DESCRIPTION',
			'STATUS',
			'RESPONSIBLE_ID',
			'DEADLINE',
			'CREATED_BY',
			'CHANGED_BY',
			'CHANGED_DATE',
			'CHAT_ID' => 'CHAT_TASK.CHAT_ID',
		];

		$tasksQuery = TaskTable::query()
			->setSelect($select)
			->setFilter([
				'LOGIC' => 'AND',
				[
					'LOGIC' => 'OR',
					'CREATED_BY' => $userId,
					'RESPONSIBLE_ID' => $userId,
					[
						'MEMBERS.USER_ID' => $userId,
						'MEMBERS.TYPE' => MemberTable::MEMBER_TYPE_ACCOMPLICE,
					],
					[
						'MEMBERS.USER_ID' => $userId,
						'MEMBERS.TYPE' => MemberTable::MEMBER_TYPE_AUDITOR,
					],

				],
				[
					'LOGIC' => 'OR',
					'>CHANGED_DATE' => (new DateTime())->add('-7 days'),
					'>ACTIVITY_DATE' => (new DateTime())->add('-7 days'),
				],
			])
			->setGroup(['ID'])
			->setOrder(['CHANGED_DATE' => 'DESC'])
			->setLimit(self::MAX_TASKS_LIMIT)
		;

		$userIdList = [$userId => $userId];
		$tasks = [];
		foreach ($tasksQuery->fetchAll() as $task)
		{
			$status = Status::getList()[$task['STATUS']] ?? $task['STATUS'];
			$deadline = $task['DEADLINE'] instanceof DateTime ? $task['DEADLINE']->format('c') : $task['DEADLINE'];
			$changedDate = $task['CHANGED_DATE'] instanceof DateTime
				? $task['CHANGED_DATE']->format('c')
				: $task['CHANGED_DATE']
			;
			$tasks[$task['ID']] = [
				'TITLE' => $task['TITLE'],
				'DESCRIPTION' => $task['DESCRIPTION'],
				'STATUS' => $status,
				'RESPONSIBLE' => $task['RESPONSIBLE_ID'],
				'DEADLINE' => $deadline,
				'CREATOR' => $task['CREATED_BY'],
				'EDITOR' => $task['CHANGED_BY'],
				'CHANGED_DATE' => $changedDate,
				'CHAT_ID' => $task['CHAT_ID'],
			];

			$userIdList[$task['RESPONSIBLE_ID']] = $task['RESPONSIBLE_ID'];
			$userIdList[$task['CREATED_BY']] = $task['CREATED_BY'];
			$userIdList[$task['CHANGED_BY']] = $task['CHANGED_BY'];
		}

		return [$tasks, $userIdList];
	}

	private function fetchChecklists(array $taskIds, array &$userIdList): array
	{
		if (empty($taskIds))
		{
			return [];
		}

		$checkLists = CheckListTable::query()
			->setSelect([
				'TITLE',
				'TOGGLED_BY',
				'IS_COMPLETE',
				'TASK_ID',
			])
			->whereIn('TASK_ID', $taskIds)
			->fetchAll()
		;

		$list = [];
		foreach ($checkLists as $checkList)
		{
			$list[$checkList['TASK_ID']][] = [
				'TITLE' => $checkList['TITLE'],
				'TOGGLED_BY' => $checkList['TOGGLED_BY'],
				'IS_COMPLETE' => $checkList['IS_COMPLETE'],
			];

			$userIdList[$checkList['TOGGLED_BY']] = $checkList['TOGGLED_BY'];
		}

		return $list;
	}

	private function fetchResults(array $taskIds, array &$userIdList): array
	{
		if (empty($taskIds))
		{
			return [];
		}

		$resultList = ResultTable::query()
			->setSelect([
				'TASK_ID',
				'TEXT',
				'CREATED_BY',
			])
			->whereIn('TASK_ID', $taskIds)
			->fetchAll()
		;

		$list = [];
		foreach ($resultList as $result)
		{
			$list[$result['TASK_ID']][] = [
				'TEXT' => $result['TEXT'],
				'CREATOR' => $result['CREATED_BY'],
			];

			$userIdList[$result['CREATED_BY']] = $result['CREATED_BY'];
		}

		return $list;
	}

	private function fetchMessagesByChatId(
		int $chatId,
		int $limit,
	): array
	{
		$messagesRow = MessageTable::query()
			->setSelect([
				'AUTHOR_ID',
				'MESSAGE',
				'DATE_CREATE',
			])
			->where('DATE_CREATE', '>=', (new DateTime())->add('-7 days'))
			->where('CHAT_ID', $chatId)
			->setOrder(['DATE_CREATE' => 'DESC'])
			->setLimit($limit)
			->fetchAll()
		;

		$messagesRow = array_reverse($messagesRow);

		$userIdList = [];
		$result = [];
		foreach ($messagesRow as $messageRow)
		{
			if (empty($messageRow['MESSAGE']))
			{
				continue;
			}

			$result[] = [
				'AUTHOR' => $messageRow['AUTHOR_ID'],
				'MESSAGE' => $messageRow['MESSAGE'],
				'DATE' => $messageRow['DATE_CREATE']?->format('c'),
			];

			$userIdList[$messageRow['AUTHOR_ID']] = $messageRow['AUTHOR_ID'];
		}

		$userList = $this->getFormatUserByIds(array_keys($userIdList));

		foreach ($result as &$item)
		{
			$item['AUTHOR'] = $userList[$item['AUTHOR']] ?? $item['AUTHOR'];
			if ($item['AUTHOR'] == 0)
			{
				$item['AUTHOR'] = $this->formatUser(['ID' => 0]);
			}
		}

		return $result;
	}

	private function fetchMembers(array $taskIds, array &$userIdList): array
	{
		if (empty($taskIds))
		{
			return [];
		}

		$query = MemberTable::query()
			->setSelect([
				'TASK_ID',
				'USER_ID',
				'TYPE',
			])
			->whereIn('TASK_ID', $taskIds)
			->whereIn('TYPE', [
				MemberTable::MEMBER_TYPE_ACCOMPLICE,
				MemberTable::MEMBER_TYPE_AUDITOR,
			]);

		$list = [];
		foreach ($query->fetchAll() as $member)
		{
			$list[$member['TASK_ID']] ??= [
				MemberTable::MEMBER_TYPE_ACCOMPLICE => [],
				MemberTable::MEMBER_TYPE_AUDITOR => [],
			];

			$list[$member['TASK_ID']][$member['TYPE']][] = $member['USER_ID'];

			$userIdList[$member['USER_ID']] = $member['USER_ID'];
		}

		return $list;
	}

	private function formatUser(array $author): string
	{
		$userId = (int)$author['ID'];
		$params = [
			'NAME' => $author['NAME'],
			'LAST_NAME' => $author['LAST_NAME'],
			'LOGIN' => $author['LOGIN'],
		];

		if (empty($userId))
		{
			$params = [
				'NAME' => self::USER_NAME_SYSTEM,
			];
		}

		$userName = \CUser::formatName(
			\CSite::GetNameFormat(),
			$params
		);

		return User::build(
			$userId,
			$userName,
		)->compile();
	}

	private function getFormatUserByIds(array $ids): array
	{
		$ids = array_filter($ids);
		if (empty($ids))
		{
			return [];
		}

		$userQuery = UserTable::query()
			->setSelect([
				'ID',
				'NAME',
				'LAST_NAME',
				'LOGIN',
			])
			->whereIn('ID', $ids)
		;

		$list = [];
		foreach ($userQuery->fetchAll() as $user)
		{
			$list[$user['ID']] = $this->formatUser($user);
		}

		return $list;
	}

	private function prepareTasks(array &$tasks, array $userIdList): void
	{
		if (empty($tasks))
		{
			return;
		}

		$taskIds = array_keys($tasks);

		$memberList = $this->fetchMembers($taskIds, $userIdList);
		$checklistList = $this->fetchChecklists($taskIds, $userIdList);
		$resultList = $this->fetchResults($taskIds, $userIdList);

		$formatUsers = $this->getFormatUserByIds(array_keys($userIdList));

		$this->replaceUserField($checklistList, 'TOGGLED_BY', $formatUsers);
		$this->replaceUserField($resultList, 'CREATOR', $formatUsers);

		foreach ($memberList as &$member) {
			$this->replaceUserIds($member[MemberTable::MEMBER_TYPE_ACCOMPLICE], $formatUsers);
			$this->replaceUserIds($member[MemberTable::MEMBER_TYPE_AUDITOR], $formatUsers);
		}
		unset($member);

		foreach ($tasks as $taskId => &$task) {
			$task['RESPONSIBLE'] = $formatUsers[$task['RESPONSIBLE']] ?? $task['RESPONSIBLE'];
			$task['CREATOR'] = $formatUsers[$task['CREATOR']] ?? $task['CREATOR'];
			$task['EDITOR'] = $formatUsers[$task['EDITOR']] ?? $task['EDITOR'];

			$task['CHECKLISTS'] = $checklistList[$taskId] ?? [];
			$task['RESULTS'] = $resultList[$taskId] ?? [];
			$task['ACCOMPLICES'] = $memberList[$taskId][MemberTable::MEMBER_TYPE_ACCOMPLICE] ?? [];
			$task['AUDITORS'] = $memberList[$taskId][MemberTable::MEMBER_TYPE_AUDITOR] ?? [];

			if (!empty($task['CHAT_ID']))
			{
				$task['CHAT_INFO'] = $this->fetchMessagesByChatId(
					$task['CHAT_ID'],
					$this->{self::PARAM_MESSAGE_COUNT_LIMIT},
				);
			}

			unset($task['CHAT_ID']);
		}
		unset($task);
	}

	private function replaceUserField(array &$list, string $field, array $users): void
	{
		foreach ($list as &$group)
		{
			foreach ($group as &$item)
			{
				$id = $item[$field] ?? null;
				if ($id !== null && isset($users[$id]))
				{
					$item[$field] = $users[$id];
				}
			}
		}
		unset($group, $item);
	}

	private function replaceUserIds(array &$list, array $users): void
	{
		foreach ($list as &$id)
		{
			if (isset($users[$id]))
			{
				$id = $users[$id];
			}
		}
		unset($id);
	}

	public static function getPropertiesDialogMap(?PropertiesDialog $dialog = null): array
	{
		return self::getPropertiesMap([]);
	}

	protected static function getFileName(): string
	{
		return __FILE__;
	}
}
