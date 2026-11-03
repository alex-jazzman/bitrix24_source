<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\BIConnector\Internal\Digest\Service\DigestToolFailureJournal;
use Bitrix\BIConnector\Superset\Logger\Logger;
use Bitrix\Bizproc\Activity\BaseActivity;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Localization\Loc;

/**
 * Tells what the answer of the digest agent means for the recipient: a summary to deliver, a report that
 * did not answer the tools in time and is retried, or a refusal of the model reported to the recipient
 * at once. The error text of the AI service is never read: the outcome rests on the journal the tools of
 * the run keep and, when it holds nothing, on the text of the answer.
 */
class CBPBIConnectorDigestAnswerActivity extends BaseActivity implements IBPConfigurableActivity
{
	protected static $requiredModules = [
		'biconnector',
	];

	private const PARAM_USER_ID = 'PARAM_USER_ID';
	private const PARAM_BI_DIGEST_RUN_ID = 'BI_DIGEST_RUN_ID';
	private const PARAM_BI_DIGEST_AI_RESULT = 'BI_DIGEST_AI_RESULT';

	private const RETURN_PARAM_BI_DIGEST_ANSWER_OUTCOME = 'BI_DIGEST_ANSWER_OUTCOME';
	private const RETURN_PARAM_BI_DIGEST_ANSWER_REASON_CODE = 'BI_DIGEST_ANSWER_REASON_CODE';

	private const OUTCOME_DELIVERED = 'delivered';
	private const OUTCOME_TEMPORARY = 'temporary';
	private const OUTCOME_FAILED = 'failed';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			self::PARAM_USER_ID => null,
			self::PARAM_BI_DIGEST_RUN_ID => null,
			self::PARAM_BI_DIGEST_AI_RESULT => null,
			self::RETURN_PARAM_BI_DIGEST_ANSWER_OUTCOME => null,
			self::RETURN_PARAM_BI_DIGEST_ANSWER_REASON_CODE => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_BI_DIGEST_ANSWER_OUTCOME => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_BI_DIGEST_ANSWER_REASON_CODE => [
				'Type' => FieldType::STRING,
			],
		]);
	}

	protected function reInitialize(): void
	{
		parent::reInitialize();

		$this->{self::RETURN_PARAM_BI_DIGEST_ANSWER_OUTCOME} = null;
		$this->{self::RETURN_PARAM_BI_DIGEST_ANSWER_REASON_CODE} = null;
	}

	/**
	 * Nothing here fails the activity: every answer has an outcome, and the template has a message for each.
	 */
	protected function internalExecute(): ErrorCollection
	{
		$userId = $this->getRecipientId();
		$runId = $this->getStringProperty(self::PARAM_BI_DIGEST_RUN_ID);

		// The mark outweighs the text: after a tool was told the report is unavailable, the model answers
		// with words about missing data, which is no summary to deliver.
		$reason = $runId !== '' && $userId > 0 ? (new DigestToolFailureJournal())->find($runId, $userId) : null;

		$outcome = self::OUTCOME_FAILED;
		$reasonCode = '';
		if ($reason !== null)
		{
			$outcome = self::OUTCOME_TEMPORARY;
			$reasonCode = $reason->code();
		}
		elseif (trim($this->getStringProperty(self::PARAM_BI_DIGEST_AI_RESULT)) !== '')
		{
			$outcome = self::OUTCOME_DELIVERED;
		}

		$this->{self::RETURN_PARAM_BI_DIGEST_ANSWER_OUTCOME} = $outcome;
		$this->{self::RETURN_PARAM_BI_DIGEST_ANSWER_REASON_CODE} = $reasonCode;

		Logger::logInfo('BI digest answer outcome', [
			'run_id' => $runId,
			'user_id' => $userId,
			'outcome' => $outcome,
			'reason_code' => $reasonCode,
		]);

		return new ErrorCollection();
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_USER_ID => [
				'Name' => Loc::getMessage('BPBDA_PARAM_USER_ID'),
				'FieldName' => self::PARAM_USER_ID,
				'Type' => FieldType::USER,
				'Required' => true,
			],
			self::PARAM_BI_DIGEST_RUN_ID => [
				'Name' => Loc::getMessage('BPBDA_PARAM_BI_DIGEST_RUN_ID'),
				'FieldName' => self::PARAM_BI_DIGEST_RUN_ID,
				'Type' => FieldType::STRING,
				'Required' => true,
			],
			self::PARAM_BI_DIGEST_AI_RESULT => [
				'Name' => Loc::getMessage('BPBDA_PARAM_BI_DIGEST_AI_RESULT'),
				'FieldName' => self::PARAM_BI_DIGEST_AI_RESULT,
				'Type' => FieldType::TEXT,
				'Required' => false,
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

	private function getRecipientId(): int
	{
		$recipient = $this->{self::PARAM_USER_ID};
		if (!is_array($recipient) && !CBPHelper::hasStringRepresentation($recipient))
		{
			return 0;
		}

		return (int)(CBPHelper::extractUsers($recipient, $this->getDocumentId(), true) ?? 0);
	}

	/**
	 * An expression over a multiple field resolves to an array, which has no text to read.
	 */
	private function getStringProperty(string $name): string
	{
		$value = $this->{$name};

		return CBPHelper::hasStringRepresentation($value) ? (string)$value : '';
	}
}
