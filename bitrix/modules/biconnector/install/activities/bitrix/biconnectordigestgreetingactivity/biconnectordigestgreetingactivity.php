<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Internal\Digest\Provider\DigestDashboardProvider;
use Bitrix\BIConnector\Internal\Digest\Service\DigestRecipientExpander;
use Bitrix\BIConnector\Internal\Digest\Service\DigestRecipientViewFilter;
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

/**
 * Tells who of the digest recipients is greeted when the digest is set up: the greeting promises a digest
 * of the report, so a person who cannot open the report is not greeted.
 */
class CBPBIConnectorDigestGreetingActivity extends BaseActivity implements IBPConfigurableActivity
{
	protected static $requiredModules = [
		'biconnector',
	];

	private const PARAM_BI_DASHBOARD_ID = 'BI_DASHBOARD_ID';
	private const PARAM_BI_DIGEST_RECIPIENTS = 'BI_DIGEST_RECIPIENTS';

	/** The same selector the run preparation activity offers for the same value. */
	private const ENTITY_ID_BI_DASHBOARD = 'biconnector-superset-dashboard';

	private const RETURN_PARAM_BI_DIGEST_GREETING_RECIPIENTS = 'BI_DIGEST_GREETING_RECIPIENTS';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_BI_DASHBOARD_ID => null,
			self::PARAM_BI_DIGEST_RECIPIENTS => null,
			self::RETURN_PARAM_BI_DIGEST_GREETING_RECIPIENTS => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_BI_DIGEST_GREETING_RECIPIENTS => [
				'Type' => FieldType::USER,
				'Multiple' => true,
			],
		]);
	}

	protected function reInitialize(): void
	{
		parent::reInitialize();

		$this->{self::RETURN_PARAM_BI_DIGEST_GREETING_RECIPIENTS} = null;
	}

	/**
	 * Nothing here fails the activity: a greeting that cannot be addressed is not sent, and the setup goes on.
	 */
	protected function internalExecute(): ErrorCollection
	{
		$this->{self::RETURN_PARAM_BI_DIGEST_GREETING_RECIPIENTS} = [];

		$dashboardId = EntitySelectorValue::toId($this->{self::PARAM_BI_DASHBOARD_ID});
		try
		{
			$this->{self::RETURN_PARAM_BI_DIGEST_GREETING_RECIPIENTS} = $this->resolveGreetingRecipients($dashboardId);
		}
		catch (\Throwable $exception)
		{
			$this->logSkippedGreeting($exception->getMessage(), $dashboardId);
		}

		return new ErrorCollection();
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_BI_DASHBOARD_ID => [
				'Name' => Loc::getMessage('BPBDG_PARAM_BI_DASHBOARD_ID'),
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
				'Name' => Loc::getMessage('BPBDG_PARAM_BI_DIGEST_RECIPIENTS'),
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
	 * @see CBPBIConnectorDigestRunActivity::extractPropertiesValues()
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
	 * @return string[] User codes of the recipients who can view the report, in the order of the run recipients.
	 */
	private function resolveGreetingRecipients(int $dashboardId): array
	{
		$recipients = ServiceLocator::getInstance()
			->get(DigestRecipientExpander::class)
			->expand($this->{self::PARAM_BI_DIGEST_RECIPIENTS}, $this->getDocumentId())
		;
		if ($recipients === [])
		{
			return [];
		}

		$dashboardProvider = ServiceLocator::getInstance()->get(DigestDashboardProvider::class);
		// The provider is shared by the process, and the report may have changed since it was last read.
		$dashboardProvider->beginRun($dashboardId, UuidGenerator::generateV4());
		$dashboard = $dashboardId > 0 ? $dashboardProvider->findDashboard($dashboardId) : null;
		if ($dashboard === null)
		{
			$this->logSkippedGreeting('the report is not found', $dashboardId);

			return [];
		}

		return ServiceLocator::getInstance()
			->get(DigestRecipientViewFilter::class)
			->filter($recipients, $dashboard)
		;
	}

	private function logSkippedGreeting(string $reason, int $dashboardId): void
	{
		Logger::logErrors(
			[new Error('BI digest greeting is not sent: ' . $reason)],
			[
				'dashboard_id' => $dashboardId,
				'workflow_id' => (string)$this->getWorkflowInstanceId(),
			],
		);
	}
}
