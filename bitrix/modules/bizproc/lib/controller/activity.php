<?php

namespace Bitrix\Bizproc\Controller;

use Bitrix\Main\Error;
use Bitrix\Bizproc;
use Bitrix\Bizproc\Api\Enum\ErrorMessage;

class Activity extends Base
{
	public function requestAction(array $documentType, string $activity, array $params)
	{
		try
		{
			$documentType = \CBPHelper::ParseDocumentId($documentType);
			$activity = (new Bizproc\Validator(['activity' => $activity]))
				->validateString('activity')
				->getPureValues()['activity'];

			$dirtyParams = $params;
			$pureParams = (new Bizproc\Validator($params))
				//->validateRequire('lists_document_type')
				//->validateString('lists_document_type')
				->validateRequire('form_name')
				->validateString('form_name')
				->validateEnum('public_mode', ['Y', ''])
				->setDefault('public_mode', '')
				->getPureValues();

			$params = array_merge($dirtyParams, $pureParams);
		}
		catch (\Throwable $e)
		{
			$this->addError(new Error($e->getMessage(), $e->getCode()));
			return null;
		}
		$user = $this->getCurrentUser();

		$hasAccess = $user && (
			\CBPDocument::CanUserOperateDocumentType(
				\CBPCanUserOperateOperation::CreateWorkflow,
				$user->getId(),
				$documentType
			)
			|| \CBPDocument::CanUserOperateDocumentType(
				\CBPCanUserOperateOperation::CreateAutomation,
				$user->getId(),
				$documentType
			)
		);

		if (!$hasAccess)
		{
			$this->addError(ErrorMessage::ACCESS_DENIED->getError());

			return null;
		}

		$runtime = \CBPRuntime::GetRuntime();
		$runtime->StartRuntime();

		$activityDescription = $runtime->GetActivityDescription($activity);
		if (!$activityDescription)
		{
			$this->addError(new Error("Bad activity type!" . htmlspecialcharsbx($activity)));
			return null;
		}

		$runtime->IncludeActivityFile($activity);

		return \CBPActivity::CallStaticMethod(
			$activity,
			"getAjaxResponse",
			[$params]
		);
	}
}
