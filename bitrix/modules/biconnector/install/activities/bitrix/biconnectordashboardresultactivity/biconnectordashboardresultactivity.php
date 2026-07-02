<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Integration\Superset\Integrator\Integrator;
use Bitrix\BIConnector\Integration\Superset\SupersetController;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Error;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\BIConnector\Access\AccessController;
use Bitrix\BIConnector\Access\ActionDictionary;

class CBPBIConnectorDashboardResultActivity extends BaseActivity implements IBPConfigurableActivity
{
	protected static $requiredModules = [
		'biconnector',
	];

	private const PARAM_USER_ID = 'PARAM_USER_ID';
	private const PARAM_BI_DASHBOARD_ID = 'BI_DASHBOARD_ID';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_FILE = 'BI_DASHBOARD_RESULT_FILE';
	private const RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING = 'BI_DASHBOARD_RESULT_URL_STRING';
	private const PROPERTY_MAP_FIELD_NAME_FOR_ERROR_MESSAGE = 'nameForErrorMessage';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_USER_ID => null,
			self::PARAM_BI_DASHBOARD_ID => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE => null,
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE => [
				'Type' => FieldType::FILE,
			],
			self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING => [
				'Type' => FieldType::STRING,
			],
		]);
	}

	protected function reInitialize(): void
	{
		parent::reInitialize();

		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE} = null;
		$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING} = null;
	}

	protected function internalExecute(): ErrorCollection
	{
		$errors = new ErrorCollection();

		$userId = (int)$this->getTargetUserId();
		$dashboardId = (int)$this->{self::PARAM_BI_DASHBOARD_ID};

		if ($userId === 0) {
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_USER_ID_EMPTY')));
		}

		if ($dashboardId === 0) {
			$errors->setError(new Error(Loc::getMessage('BPBDC_DASHBOARD_RESULT_DASHBOARD_ID_EMPTY')));
		}

		if (!$errors->isEmpty())
		{
			return $errors;
		}

		if (!$this->isCanViewResult($userId, $dashboardId))
		{
			$errors->setError(
				new Error(
					Loc::getMessage(
						'BPBDC_DASHBOARD_RESULT_NOT_ALLOWED_VIEW',
						[
							'#USER_ID#' => $userId,
							'#DASHBOARD_ID#' => $dashboardId,
						]
					)
				)
			);

			return $errors;
		}

		try
		{
			[$result, $resultUrl] = $this->getResult($dashboardId);

			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_FILE} = $result;
			$this->{self::RETURN_PARAM_BI_DASHBOARD_RESULT_URL_STRING} = $resultUrl;
		}
		catch (\Throwable $exception)
		{
			$errors->setError(new Error($exception->getMessage()));
		}

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
				'Type' => FieldType::INT,
				'Required' => true,
				self::PROPERTY_MAP_FIELD_NAME_FOR_ERROR_MESSAGE => Loc::getMessage('BPBDC_PARAM_BI_DASHBOARD_ID_NAME'),
			],
		];
	}

	public static function getPropertiesDialogMap(?PropertiesDialog $dialog = null): array
	{
		return self::getPropertiesMap([]);
	}

	private function getTargetUserId(): ?int
	{
		return CBPHelper::extractFirstUser($this->{self::PARAM_USER_ID}, $this->getDocumentId());
	}

	protected static function getFileName(): string
	{
		return __FILE__;
	}

	private function isCanViewResult(int $userId, int $dashboardId): bool
	{
		return AccessController::getInstance($userId)
			->check(ActionDictionary::ACTION_BIC_DASHBOARD_VIEW, null, $dashboardId)
		;
	}

	private function getResult(int $dashboardId): array
	{
		$superset = new SupersetController(Integrator::getInstance());
		$dashboard = $superset->getDashboardRepository()->getById($dashboardId);

		if (!$dashboard)
		{
			return [];
		}

		$result = null;
		$resultUrl = $dashboard->getOrmObject()->getDetailUrl()->getUri();

		return [$result, $resultUrl];
	}
}
