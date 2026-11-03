<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Configuration\Feature;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetDashboardTable;
use Bitrix\BIConnector\Internal\Digest\DigestPeriod;
use Bitrix\BIConnector\Internal\Digest\Dto\ReadinessDto;
use Bitrix\BIConnector\Internal\Digest\PinnedContextPacker;
use Bitrix\BIConnector\Internal\Digest\Service\DigestToolFailureJournal;
use Bitrix\BIConnector\Internal\Digest\Service\OverviewWarmupService;
use Bitrix\BIConnector\Internal\Digest\Service\RecipientReadinessService;
use Bitrix\BIConnector\Internal\Integration\Bizproc\EntitySelectorValue;
use Bitrix\BIConnector\Superset\Dashboard\UrlParameter\Parameter;
use Bitrix\BIConnector\Superset\Logger\Logger;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;

class CBPBIConnectorDashboardResultActivity extends BaseActivity implements IBPConfigurableActivity
{
	protected static $requiredModules = [
		'biconnector',
	];

	private const READINESS_SERVICE_ID = 'biconnector.service.digestRecipientReadiness';

	private const PARAM_USER_ID = 'PARAM_USER_ID';
	private const PARAM_BI_DASHBOARD_ID = 'BI_DASHBOARD_ID';
	private const PARAM_BI_DIGEST_RUN_ID = 'BI_DIGEST_RUN_ID';
	private const PARAM_BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID = 'BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID';
	private const PARAM_BI_DIGEST_SCOPE_TASKS_FLOW_ID = 'BI_DIGEST_SCOPE_TASKS_FLOW_ID';
	private const PARAM_BI_DIGEST_PERIOD = 'BI_DIGEST_PERIOD';

	private const RETURN_PARAM_BI_DASHBOARD_RESULT_READY = 'BI_DASHBOARD_RESULT_READY';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CLASS = 'BI_DASHBOARD_RESULT_REASON_CLASS';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_REASON = 'BI_DASHBOARD_RESULT_REASON';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CODE = 'BI_DASHBOARD_RESULT_REASON_CODE';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING = 'BI_DASHBOARD_RESULT_URL_STRING';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_PINNED_CONTEXT = 'BI_DASHBOARD_RESULT_PINNED_CONTEXT';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_FILE = 'BI_DASHBOARD_RESULT_FILE';

	private const PROPERTY_MAP_FIELD_NAME_FOR_ERROR_MESSAGE = 'nameForErrorMessage';

	/**
	 * Selectors the settings form offers for the value inputs. Literals rather than constants of the
	 * providers: the designer reads the properties map without loading a module. Only the two scope
	 * selectors are also registered for the setup wizard of a system agent template
	 * ({@see \Bitrix\BIConnector\Internal\Integration\Bizproc\EventHandler\SetupTemplateActivitySelectorProvider});
	 * the report one is not, because the wizard picks a report by a field type of its own.
	 */
	private const ENTITY_ID_BI_DASHBOARD = 'biconnector-superset-dashboard';
	private const ENTITY_ID_WORKFLOW_TEMPLATE = 'bizproc-template';
	private const ENTITY_ID_TASKS_FLOW = 'flow';

	/**
	 * Input property carrying a scope value => the scope parameter that value belongs to. Bizproc has no
	 * field type for a "parameter code => value" map, so each parameter arrives as its own numeric input.
	 *
	 * A method rather than a class constant on purpose: the designer includes this file through
	 * IncludeActivityFile() without loading biconnector, and $requiredModules is honoured only when the
	 * activity runs. An enum case inside a constant expression is resolved as soon as anything reads the
	 * constants of the class, so the designer used to break on publishing with "class not found".
	 *
	 * @return array<string, Parameter>
	 */
	private static function getScopeValueParameters(): array
	{
		return [
			self::PARAM_BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID => Parameter::WorkflowTemplateId,
			self::PARAM_BI_DIGEST_SCOPE_TASKS_FLOW_ID => Parameter::TasksFlowsFlowId,
		];
	}

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_USER_ID => null,
			self::PARAM_BI_DASHBOARD_ID => null,
			self::PARAM_BI_DIGEST_RUN_ID => null,
			self::PARAM_BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID => null,
			self::PARAM_BI_DIGEST_SCOPE_TASKS_FLOW_ID => null,
			self::PARAM_BI_DIGEST_PERIOD => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_READY => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CLASS => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CODE => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_PINNED_CONTEXT => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_READY => [
				'Type' => FieldType::BOOL,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CLASS => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CODE => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_PINNED_CONTEXT => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE => [
				'Type' => FieldType::FILE,
			],
		]);
	}

	protected function reInitialize(): void
	{
		parent::reInitialize();

		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_READY} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CLASS} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CODE} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_PINNED_CONTEXT} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE} = null;
	}

	protected function internalExecute(): ErrorCollection
	{
		$errors = new ErrorCollection();

		// The configuration reason of a run belongs to the run preparation activity: it stops the run
		// before the recipients are walked. Inside the walk the configuration class has no reader at
		// all, so failing as an activity is the only outcome anybody can see here: this activity never
		// reports a reason of that class.
		if (!Feature::isBitrixGptBiConstructorEnabled())
		{
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_BI_TOOLS_DISABLED')));

			return $errors;
		}

		$userId = $this->resolveTargetUserId($errors);
		$dashboardId = EntitySelectorValue::toId($this->{self::PARAM_BI_DASHBOARD_ID});
		$runId = $this->getRunId();

		if ($dashboardId === 0)
		{
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_DASHBOARD_ID_EMPTY')));
		}

		if ($runId === '')
		{
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_RUN_ID_EMPTY')));
		}

		if (!$errors->isEmpty())
		{
			return $errors;
		}

		// Every attempt of the recipient passes here first, so the tools of the agent start it with no
		// failure left by the attempt before.
		(new DigestToolFailureJournal())->forget($runId, $userId);

		$readiness = $this->getReadinessService()->check(
			$userId,
			$dashboardId,
			$this->collectScopeValues(),
			$runId,
			$this->getStoredPeriod(),
		);

		$this->applyReadiness($this->warmUpOverview($readiness, $userId), $dashboardId);

		return $errors;
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_USER_ID => [
				'Name' => Loc::getMessage('BPBDC_PARAM_USER_ID'),
				'FieldName' => self::PARAM_USER_ID,
				'Type' => FieldType::USER,
				'Required' => true,
				self::PROPERTY_MAP_FIELD_NAME_FOR_ERROR_MESSAGE => Loc::getMessage('BPBDC_PARAM_USER_ID_NAME'),
			],
			self::PARAM_BI_DASHBOARD_ID => [
				'Name' => Loc::getMessage('BPBDC_PARAM_BI_DASHBOARD_ID'),
				'FieldName' => self::PARAM_BI_DASHBOARD_ID,
				'Type' => FieldType::ENTITYSELECTOR,
				'Required' => true,
				'Settings' => self::makeSelectorSettings(self::ENTITY_ID_BI_DASHBOARD),
				self::PROPERTY_MAP_FIELD_NAME_FOR_ERROR_MESSAGE => Loc::getMessage('BPBDC_PARAM_BI_DASHBOARD_ID_NAME'),
			],
			self::PARAM_BI_DIGEST_RUN_ID => [
				'Name' => Loc::getMessage('BPBDC_PARAM_BI_DIGEST_RUN_ID'),
				'FieldName' => self::PARAM_BI_DIGEST_RUN_ID,
				'Type' => FieldType::STRING,
				'Required' => true,
			],
			self::PARAM_BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID => [
				'Name' => Loc::getMessage('BPBDC_PARAM_BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID'),
				'FieldName' => self::PARAM_BI_DIGEST_SCOPE_WORKFLOW_TEMPLATE_ID,
				'Type' => FieldType::ENTITYSELECTOR,
				'Required' => false,
				'Settings' => self::makeSelectorSettings(self::ENTITY_ID_WORKFLOW_TEMPLATE),
			],
			self::PARAM_BI_DIGEST_SCOPE_TASKS_FLOW_ID => [
				'Name' => Loc::getMessage('BPBDC_PARAM_BI_DIGEST_SCOPE_TASKS_FLOW_ID'),
				'FieldName' => self::PARAM_BI_DIGEST_SCOPE_TASKS_FLOW_ID,
				'Type' => FieldType::ENTITYSELECTOR,
				'Required' => false,
				'Settings' => self::makeSelectorSettings(self::ENTITY_ID_TASKS_FLOW),
			],
			self::PARAM_BI_DIGEST_PERIOD => [
				'Name' => Loc::getMessage('BPBDC_PARAM_BI_DIGEST_PERIOD'),
				'FieldName' => self::PARAM_BI_DIGEST_PERIOD,
				'Type' => FieldType::SELECT,
				'Required' => false,
				'Options' => DigestPeriod::titles(),
			],
		];
	}

	/**
	 * Both providers fill the dialog on demand, so no list of values is preloaded into the settings form.
	 */
	private static function makeSelectorSettings(string $entityId): array
	{
		return [
			'enableSearch' => true,
			'entity' => [
				'id' => $entityId,
				'dynamicLoad' => true,
				'dynamicSearch' => true,
				'searchable' => true,
			],
		];
	}

	public static function getPropertiesDialogMap(?PropertiesDialog $dialog = null): array
	{
		return self::getPropertiesMap([]);
	}

	/**
	 * A value picked in a selector is stored as the id it stands for, and not as the pair the control
	 * hands back: see {@see EntitySelectorValue::normalizeProperties()} for what the pair costs.
	 */
	protected static function extractPropertiesValues(PropertiesDialog $dialog, array $fieldsMap): Result
	{
		$result = parent::extractPropertiesValues($dialog, $fieldsMap);
		if (!$result->isSuccess())
		{
			return $result;
		}

		$result->setData(EntitySelectorValue::normalizeProperties($result->getData(), $fieldsMap));

		foreach (static::collectRecipientErrors($dialog, $fieldsMap) as $error)
		{
			$result->addError($error);
		}

		return $result;
	}

	/**
	 * Why the recipient could not be read, told by the settings form itself.
	 *
	 * The reason used to be lost on the way out. Extracting a properties map hands one errors variable to
	 * every field in turn, and the type object assigns to it instead of adding, so the reason of one field
	 * is wiped by the silence of the next. The recipient is the first field of this map, so its reason
	 * never survived, and the empty value it left behind was then reported as an unfilled field: the
	 * setter was sent looking for an empty field while the field was full.
	 *
	 * Whether a group, a department or a role names anybody is not decided here: the answer belongs to the
	 * document the process runs on, which the settings form of a template has no instance of. That check
	 * stays where the recipient is resolved, in the run.
	 *
	 * @return Error[]
	 */
	private static function collectRecipientErrors(PropertiesDialog $dialog, array $fieldsMap): array
	{
		$field = $fieldsMap[self::PARAM_USER_ID] ?? null;
		if ($field === null)
		{
			return [];
		}

		$fieldType = static::getDocumentService()->getFieldTypeObject($dialog->getDocumentType(), $field);
		if ($fieldType === null)
		{
			return [];
		}

		$parseErrors = [];
		$value = $fieldType->extractValue(
			['Field' => $field['FieldName']],
			$dialog->getCurrentValues(),
			$parseErrors,
		);

		if ($parseErrors)
		{
			return array_map(
				static fn(array $error): Error => new Error((string)($error['message'] ?? '')),
				$parseErrors,
			);
		}

		return static::namesNobody($value)
			? [new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_USER_NOT_FOUND'))]
			: []
		;
	}

	/**
	 * A code naming a user is the one shape the settings form can resolve on its own, so a mistyped id is
	 * refused here instead of reaching the run and stopping the digest a day later.
	 */
	private static function namesNobody(mixed $value): bool
	{
		if (!CBPHelper::hasStringRepresentation($value))
		{
			return false;
		}

		$userId = 0;
		if (preg_match('/^user_(\d+)$/i', trim((string)$value), $matches))
		{
			$userId = (int)$matches[1];
		}

		return $userId > 0 && !\CUser::GetByID($userId)->Fetch();
	}

	protected static function getFileName(): string
	{
		return __FILE__;
	}

	/**
	 * Every entry this activity leaves has to be attributable to one digest run. The process journal
	 * record has no field of its own for the run, so the entry is repeated in the module journal with the
	 * run id as a field, the way the overlap outcome of a run is.
	 */
	protected function logError(string $message = '', int $userId = 0): void
	{
		parent::logError($message, $userId);

		Logger::logErrors([new Error($message)], ['run_id' => $this->getRunId()]);
	}

	private function getReadinessService(): RecipientReadinessService
	{
		return ServiceLocator::getInstance()->get(self::READINESS_SERVICE_ID);
	}

	private function getOverviewWarmupService(): OverviewWarmupService
	{
		return ServiceLocator::getInstance()->get(OverviewWarmupService::class);
	}

	/**
	 * The first ready recipient of the run makes the report build its overview before the agent asks
	 * for it. A report that did not answer in time turns the recipient into a temporary refusal, so the
	 * template retries it instead of sending the agent to a report that is still cold.
	 */
	private function warmUpOverview(ReadinessDto $readiness, int $userId): ReadinessDto
	{
		if (!$readiness->isReady)
		{
			return $readiness;
		}

		$reason = $this->getOverviewWarmupService()->warmOnce($userId, $readiness->pinnedContext);

		return $reason === null ? $readiness : ReadinessDto::refused($reason);
	}

	/**
	 * The digest is addressed to one person: the run walks the recipients one by one and the report is
	 * pinned for the recipient this node was given. A value standing for several people is refused instead
	 * of being narrowed to the first of them (the rest used to disappear without a word), and a value
	 * standing for nobody says so rather than reading as an unfilled field.
	 */
	private function resolveTargetUserId(ErrorCollection $errors): int
	{
		$userCodes = $this->parseUserCodes($errors);
		if ($userCodes === null)
		{
			return 0;
		}

		if ($userCodes === [])
		{
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_USER_ID_EMPTY')));

			return 0;
		}

		$userIds = CBPHelper::extractUsers($userCodes, $this->getDocumentId());
		if ($userIds === [])
		{
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_USER_NOT_FOUND')));

			return 0;
		}

		if (count($userIds) > 1)
		{
			$errors->setError(new Error(
				Loc::getMessage('BPBDC_DASHBOARD_RESULT_USER_NOT_SINGLE', ['#COUNT#' => count($userIds)]),
			));

			return 0;
		}

		return (int)$userIds[0];
	}

	/**
	 * The field takes user and group codes, roles of the document and departments, and a template
	 * expression can bring in a whole list of them. Whatever the parser refuses is reported as the parser
	 * put it: its reason names the value nobody could be found for, which is what the setter has to fix.
	 *
	 * @return string[]|null Codes the input stands for; null when it could not be read at all.
	 */
	private function parseUserCodes(ErrorCollection $errors): ?array
	{
		$rawValue = $this->{self::PARAM_USER_ID};

		if (is_array($rawValue))
		{
			return array_values(array_filter(
				CBPHelper::flatten($rawValue),
				static fn($code): bool => CBPHelper::hasStringRepresentation($code) && trim((string)$code) !== '',
			));
		}

		if (!CBPHelper::hasStringRepresentation($rawValue) || trim((string)$rawValue) === '')
		{
			return [];
		}

		$parseErrors = [];
		$userCodes = CBPHelper::usersStringToArray((string)$rawValue, $this->getDocumentType(), $parseErrors);

		if ($parseErrors !== [])
		{
			foreach ($parseErrors as $parseError)
			{
				$errors->setError(new Error((string)($parseError['message'] ?? '')));
			}

			return null;
		}

		return is_array($userCodes) ? $userCodes : [];
	}

	/**
	 * A template expression over a multiple document field resolves to an array: casting it would put
	 * the string 'Array' into the signed envelope as the run id, so a value with no string
	 * representation counts as no run id at all.
	 */
	private function getRunId(): string
	{
		$rawRunId = $this->{self::PARAM_BI_DIGEST_RUN_ID} ?? '';

		return CBPHelper::hasStringRepresentation($rawRunId) ? (string)$rawRunId : '';
	}

	/**
	 * The period value of the agent setup as it is stored, unparsed: "as in the report", an empty value
	 * of an older setup and a broken one each lead to a different period, and only the readiness check
	 * tells them apart.
	 */
	private function getStoredPeriod(): string
	{
		$rawPeriod = $this->{self::PARAM_BI_DIGEST_PERIOD};
		if (is_array($rawPeriod))
		{
			$rawPeriod = $rawPeriod['id'] ?? null;
		}

		return CBPHelper::hasStringRepresentation($rawPeriod) ? (string)$rawPeriod : '';
	}

	/**
	 * @return array<string, int> Scope parameter code => configured value; an unfilled input is absent.
	 */
	private function collectScopeValues(): array
	{
		$scopeValues = [];
		foreach (self::getScopeValueParameters() as $property => $parameter)
		{
			$value = EntitySelectorValue::toId($this->{$property});
			if ($value > 0)
			{
				$scopeValues[$parameter->code()] = $value;
			}
		}

		return $scopeValues;
	}

	private function applyReadiness(ReadinessDto $readiness, int $dashboardId): void
	{
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_READY} = $readiness->isReady;

		if (!$readiness->isReady)
		{
			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CLASS} = $readiness->reason->reasonClass()->code();
			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON} = $readiness->reason->text();
			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CODE} = $readiness->reason->code();
			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING} = '';
			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_PINNED_CONTEXT} = '';

			return;
		}

		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CLASS} = '';
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON} = '';
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_REASON_CODE} = '';
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING} = $this->getDashboardUrl($dashboardId);

		$pinnedContext = PinnedContextPacker::pack($readiness->pinnedContext);
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_PINNED_CONTEXT} = $pinnedContext;
	}

	/**
	 * The route of the report page lives on the entity object, and readiness has already proven the
	 * report exists, so the object is woken from its id instead of being read again.
	 */
	private function getDashboardUrl(int $dashboardId): string
	{
		return (string)SupersetDashboardTable::wakeUpObject($dashboardId)->getDetailUrl()->getUri();
	}
}
