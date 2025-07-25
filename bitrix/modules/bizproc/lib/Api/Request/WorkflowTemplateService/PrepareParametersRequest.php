<?php

namespace Bitrix\Bizproc\Api\Request\WorkflowTemplateService;

final class PrepareParametersRequest
{
	public function __construct(
		public readonly array $templateParameters,
		public readonly array $requestParameters,
		public readonly array $complexDocumentType,
	)
	{}
}
