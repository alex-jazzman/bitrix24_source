<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Internal\Digest\Provider\BizprocDigestProblemProvider;
use Bitrix\BIConnector\Internal\Digest\Service\ProblemNoticeComposer;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;

/**
 * Gives the notice for the person who set the digest up as ready text: the template only puts it into
 * the message and keeps the fingerprint, with no list expressions over the stored problems.
 *
 * The problems are read here from the storage the template names, one record per problem of this run:
 * a read in the template returns a bounded number of records and would cut a large run short.
 */
class CBPBIConnectorDigestProblemNoticeActivity extends BaseActivity implements IBPConfigurableActivity
{
	protected static $requiredModules = [
		'biconnector',
	];

	private const PARAM_BI_DIGEST_PROBLEM_STORAGE = 'BI_DIGEST_PROBLEM_STORAGE';

	private const RETURN_PARAM_BI_DIGEST_PROBLEM_NOTICE = 'BI_DIGEST_PROBLEM_NOTICE';
	private const RETURN_PARAM_BI_DIGEST_PROBLEM_FINGERPRINT = 'BI_DIGEST_PROBLEM_FINGERPRINT';
	private const RETURN_PARAM_BI_DIGEST_PROBLEM_COUNT = 'BI_DIGEST_PROBLEM_COUNT';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_BI_DIGEST_PROBLEM_STORAGE => null,
			self::RETURN_PARAM_BI_DIGEST_PROBLEM_NOTICE => null,
			self::RETURN_PARAM_BI_DIGEST_PROBLEM_FINGERPRINT => null,
			self::RETURN_PARAM_BI_DIGEST_PROBLEM_COUNT => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_BI_DIGEST_PROBLEM_NOTICE => [
				'Type' => FieldType::TEXT,
			],
			self::RETURN_PARAM_BI_DIGEST_PROBLEM_FINGERPRINT => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DIGEST_PROBLEM_COUNT => [
				'Type' => FieldType::INT,
			],
		]);
	}

	protected function reInitialize(): void
	{
		parent::reInitialize();

		$this->{self::RETURN_PARAM_BI_DIGEST_PROBLEM_NOTICE} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_PROBLEM_FINGERPRINT} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_PROBLEM_COUNT} = null;
	}

	protected function internalExecute(): ErrorCollection
	{
		$notice = (new ProblemNoticeComposer())->compose($this->findProblems());

		$this->{self::RETURN_PARAM_BI_DIGEST_PROBLEM_NOTICE} = implode("\n", $notice['lines']);
		$this->{self::RETURN_PARAM_BI_DIGEST_PROBLEM_FINGERPRINT} = $notice['fingerprint'];
		$this->{self::RETURN_PARAM_BI_DIGEST_PROBLEM_COUNT} = $notice['count'];

		return new ErrorCollection();
	}

	protected function findProblems(): array
	{
		return (new BizprocDigestProblemProvider())->findRunProblems(
			(string)$this->{self::PARAM_BI_DIGEST_PROBLEM_STORAGE},
			(string)$this->getWorkflowInstanceId(),
		);
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_BI_DIGEST_PROBLEM_STORAGE => [
				'Name' => Loc::getMessage('BPBDPN_PARAM_BI_DIGEST_PROBLEM_STORAGE'),
				'FieldName' => self::PARAM_BI_DIGEST_PROBLEM_STORAGE,
				'Type' => FieldType::STRING,
				'Required' => true,
			],
		];
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
