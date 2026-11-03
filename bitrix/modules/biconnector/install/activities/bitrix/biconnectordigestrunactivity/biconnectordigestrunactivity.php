<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Internal\Digest\Dto\RunReadinessDto;
use Bitrix\BIConnector\Internal\Digest\Provider\DigestDashboardProvider;
use Bitrix\BIConnector\Internal\Digest\Service\DigestRecipientExpander;
use Bitrix\BIConnector\Internal\Digest\Service\DigestRecipientViewFilter;
use Bitrix\BIConnector\Internal\Digest\Service\RunReadinessService;
use Bitrix\BIConnector\Internal\Integration\Bizproc\EntitySelectorValue;
use Bitrix\BIConnector\Superset\Logger\Logger;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Error;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Result;
use Bitrix\Main\UuidGenerator;

class CBPBIConnectorDigestRunActivity extends BaseActivity implements IBPConfigurableActivity
{
	protected static $requiredModules = [
		'biconnector',
	];

	private const READINESS_SERVICE_ID = 'biconnector.service.digestRunReadiness';

	private const PARAM_BI_DASHBOARD_ID = 'BI_DASHBOARD_ID';
	private const PARAM_BI_DIGEST_RECIPIENTS = 'BI_DIGEST_RECIPIENTS';

	/**
	 * Selector the settings form offers for the report. A literal rather than a constant of the provider:
	 * the designer reads the properties map without loading a module, and this is the same selector the
	 * setup wizard of a system agent template offers for the same value.
	 */
	private const ENTITY_ID_BI_DASHBOARD = 'biconnector-superset-dashboard';

	private const RETURN_PARAM_BI_DIGEST_RUN_CAN_CONTINUE = 'BI_DIGEST_RUN_CAN_CONTINUE';
	private const RETURN_PARAM_BI_DIGEST_RUN_REASON_CLASS = 'BI_DIGEST_RUN_REASON_CLASS';
	private const RETURN_PARAM_BI_DIGEST_RUN_REASON = 'BI_DIGEST_RUN_REASON';
	private const RETURN_PARAM_BI_DIGEST_RUN_ID = 'BI_DIGEST_RUN_ID';
	private const RETURN_PARAM_BI_DIGEST_RUN_RECIPIENTS = 'BI_DIGEST_RUN_RECIPIENTS';
	private const RETURN_PARAM_BI_DIGEST_RUN_VIEWER_RECIPIENTS = 'BI_DIGEST_RUN_VIEWER_RECIPIENTS';

	/**
	 * Assigning a property of an activity does not reach the prepared values a property read goes
	 * through, so the born run id is kept here for everything that needs it after it is published.
	 */
	private string $runId = '';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_BI_DASHBOARD_ID => null,
			self::PARAM_BI_DIGEST_RECIPIENTS => null,
			self::RETURN_PARAM_BI_DIGEST_RUN_CAN_CONTINUE => null,
			self::RETURN_PARAM_BI_DIGEST_RUN_REASON_CLASS => null,
			self::RETURN_PARAM_BI_DIGEST_RUN_REASON => null,
			self::RETURN_PARAM_BI_DIGEST_RUN_ID => null,
			self::RETURN_PARAM_BI_DIGEST_RUN_RECIPIENTS => null,
			self::RETURN_PARAM_BI_DIGEST_RUN_VIEWER_RECIPIENTS => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_BI_DIGEST_RUN_CAN_CONTINUE => [
				'Type' => FieldType::BOOL,
			],
			self::RETURN_PARAM_BI_DIGEST_RUN_REASON_CLASS => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DIGEST_RUN_REASON => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DIGEST_RUN_ID => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DIGEST_RUN_RECIPIENTS => [
				'Type' => FieldType::USER,
				'Multiple' => true,
			],
			self::RETURN_PARAM_BI_DIGEST_RUN_VIEWER_RECIPIENTS => [
				'Type' => FieldType::USER,
				'Multiple' => true,
			],
		]);
	}

	protected function reInitialize(): void
	{
		parent::reInitialize();

		$this->runId = '';
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_CAN_CONTINUE} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_REASON_CLASS} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_REASON} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_ID} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_RECIPIENTS} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_VIEWER_RECIPIENTS} = null;
	}

	protected function internalExecute(): ErrorCollection
	{
		$errors = new ErrorCollection();

		// The run id is born here and nowhere else: the context preparation activity takes it as an
		// input, and it is published before anything can go wrong, so every outcome carries it.
		$this->stopRun(UuidGenerator::generateV4());
		$recipients = $this->resolveRecipients();
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_RECIPIENTS} = $recipients;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_VIEWER_RECIPIENTS} = [];

		$dashboardId = $this->getDashboardId();
		if ($dashboardId === 0)
		{
			$errors->setError(new Error(Loc::getMessage('BPBDR_DIGEST_RUN_DASHBOARD_ID_EMPTY')));

			return $errors;
		}

		// The switched off BI tools option is a reason of the configuration class here and not a failure
		// of the activity: the run has to stop before the recipients are walked and the template has to
		// tell whoever set the digest up, and the only thing a template can branch on is the class. The
		// context preparation activity does the opposite: inside the walk that class has no reader.
		$readiness = $this->getReadinessService()->check(
			(int)$this->getWorkflowTemplateId(),
			$this->getOwnWorkflowInstanceId(),
			$dashboardId,
			$this->runId,
		);

		$this->applyReadiness($readiness);
		if (!$readiness->isReady && !$readiness->isOverlapping())
		{
			$this->{self::RETURN_PARAM_BI_DIGEST_RUN_VIEWER_RECIPIENTS} = $this->resolveViewerRecipients(
				$dashboardId,
				$recipients,
			);
		}

		return $errors;
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_BI_DASHBOARD_ID => [
				'Name' => Loc::getMessage('BPBDR_PARAM_BI_DASHBOARD_ID'),
				'FieldName' => self::PARAM_BI_DASHBOARD_ID,
				'Type' => FieldType::ENTITYSELECTOR,
				'Required' => true,
				'Settings' => [
					'enableSearch' => true,
					'entity' => [
						'id' => self::ENTITY_ID_BI_DASHBOARD,
						'dynamicLoad' => true,
						'dynamicSearch' => true,
						'searchable' => true,
					],
				],
			],
			self::PARAM_BI_DIGEST_RECIPIENTS => [
				'Name' => Loc::getMessage('BPBDR_PARAM_BI_DIGEST_RECIPIENTS'),
				'FieldName' => self::PARAM_BI_DIGEST_RECIPIENTS,
				'Type' => FieldType::USER,
				'Multiple' => true,
				'Required' => false,
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

		return $result->isSuccess()
			? $result->setData(EntitySelectorValue::normalizeProperties($result->getData(), $fieldsMap))
			: $result
		;
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

		Logger::logErrors([new Error($message)], ['run_id' => $this->runId]);
	}

	private function getReadinessService(): RunReadinessService
	{
		return ServiceLocator::getInstance()->get(self::READINESS_SERVICE_ID);
	}

	private function getDashboardId(): int
	{
		return EntitySelectorValue::toId($this->{self::PARAM_BI_DASHBOARD_ID});
	}

	/**
	 * The loops of the template walk this list one person at a time: see {@see DigestRecipientExpander}.
	 *
	 * @return string[]
	 */
	private function resolveRecipients(): array
	{
		return ServiceLocator::getInstance()
			->get(DigestRecipientExpander::class)
			->expand($this->{self::PARAM_BI_DIGEST_RECIPIENTS}, $this->getDocumentId())
		;
	}

	/**
	 * The people a refused run may tell that the digest will not come today: the notice names the report, so it
	 * goes only to those of the recipients who can view it. A run that goes on needs no such list, since the walk
	 * checks every person itself, and a failure here leaves the list empty rather than failing the run.
	 *
	 * The recipients are handed in rather than read back from the property: a read of a list of exactly two
	 * strings resolves as a reference to a field of another activity.
	 *
	 * @param string[] $recipients
	 *
	 * @return string[]
	 */
	private function resolveViewerRecipients(int $dashboardId, array $recipients): array
	{
		if ($recipients === [])
		{
			return [];
		}

		try
		{
			$dashboardProvider = ServiceLocator::getInstance()->get(DigestDashboardProvider::class);
			$dashboardProvider->beginRun($dashboardId, $this->runId);
			$dashboard = $dashboardProvider->findDashboard($dashboardId);
			if ($dashboard === null)
			{
				return [];
			}

			return ServiceLocator::getInstance()
				->get(DigestRecipientViewFilter::class)
				->filter($recipients, $dashboard)
			;
		}
		catch (\Throwable $exception)
		{
			Logger::logErrors(
				[new Error('BI digest viewer recipients are not resolved: ' . $exception->getMessage())],
				['run_id' => $this->runId, 'dashboard_id' => $dashboardId],
			);

			return [];
		}
	}

	/**
	 * @return string|null Null when the runtime has no instance of its own for the overlap predicate to exclude.
	 */
	private function getOwnWorkflowInstanceId(): ?string
	{
		$instanceId = (string)$this->getWorkflowInstanceId();

		return $instanceId === '' ? null : $instanceId;
	}

	/**
	 * The properties of a run that stops with nothing to report, filled before the check is made: an
	 * outcome that never reaches the check leaves the same complete set of four values as any other one.
	 */
	private function stopRun(string $runId): void
	{
		$this->runId = $runId;

		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_ID} = $runId;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_CAN_CONTINUE} = false;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_REASON_CLASS} = '';
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_REASON} = '';
	}

	/**
	 * All three outcomes arrive in the same two properties: a refusal has a class and a text, overlap has
	 * only the class, and a run that goes on has neither.
	 */
	private function applyReadiness(RunReadinessDto $readiness): void
	{
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_CAN_CONTINUE} = $readiness->isReady;
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_REASON_CLASS} = $readiness->reasonClass?->code() ?? '';
		$this->{self::RETURN_PARAM_BI_DIGEST_RUN_REASON} = $readiness->reason?->text() ?? '';
	}
}
