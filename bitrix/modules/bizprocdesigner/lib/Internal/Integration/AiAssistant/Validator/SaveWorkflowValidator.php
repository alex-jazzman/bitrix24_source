<?php

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Validator;

use Bitrix\BizprocDesigner\Internal\Entity\DocumentDescription;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Enum\RequestSource;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Result\AgentWorkflowValidationResult;
use Bitrix\Main\Result;

readonly class SaveWorkflowValidator
{
	private AgentConnectionsValidator $connectionsValidator;
	private AgentBlocksValidator $blocksValidator;
	private AgentFrameMembershipValidator $frameMembershipValidator;
	private GraphLimitsValidator $limitsValidator;

	/**
	 * Origin of the write, read from the context; the frame membership overlay is the one REST-only branch it
	 * drives. Fail-closed like {@see ValidationContext::__construct()}: no context at all means the least, not
	 * the most, permissive source.
	 */
	private RequestSource $source;

	public function __construct(
		public array $input,
		public DocumentDescription $documentType,
		?AgentConnectionsValidator $connectionsValidator =  null,
		?AgentBlocksValidator $blocksValidator = null,
		public ?ValidationContext $context = null,
		?AgentFrameMembershipValidator $frameMembershipValidator = null,
		?GraphLimitsValidator $limitsValidator = null,
	) {
		$this->source = $context?->source ?? RequestSource::Marta;
		$this->connectionsValidator = $connectionsValidator ?? new AgentConnectionsValidator();
		$this->blocksValidator = $blocksValidator ?? new AgentBlocksValidator(context: $context);
		$this->frameMembershipValidator = $frameMembershipValidator ?? new AgentFrameMembershipValidator();
		$this->limitsValidator = $limitsValidator ?? new GraphLimitsValidator();
	}

	public function validate(): AgentWorkflowValidationResult|Result
	{
		// Bounds first: a graph over them is refused by its size, not walked block by block through the
		// catalog lookups the ordinary validators do.
		$limitsResult = $this->limitsValidator->validate(
			blocks: $this->input['blocks'] ?? null,
			connections: $this->input['connections'] ?? null,
			source: $this->source,
		);
		if (!$limitsResult->isSuccess())
		{
			return $limitsResult;
		}

		$validateBlocksResult = $this->blocksValidator->validate(
			blocks: $this->input['blocks'] ?? null,
			documentType: $this->documentType,
			path: 'blocks',
		);

		$validateConnectionsResult = $this->connectionsValidator->validate(
			connections: $this->input['connections'] ?? null,
			blockIds: $this->blocksValidator->getBlockIds(),
			path: 'connections',
			blockPortsMap: $this->blocksValidator->getBlockPortsMap(),
			blockLoopbackInputPortsMap: $this->blocksValidator->getBlockLoopbackInputPortsMap(),
			frameBlockIds: $this->blocksValidator->getFrameBlockIds(),
		);

		// Frame membership is a REST-only overlay concern; for Marta frames are already rejected at block level.
		$validateMembershipResult = new Result();
		if ($this->source === RequestSource::Rest)
		{
			$validateMembershipResult = $this->frameMembershipValidator->validate(
				blocks: $this->input['blocks'] ?? null,
				connections: $this->input['connections'] ?? null,
				path: 'blocks',
			);
		}

		if (
			$validateBlocksResult->isSuccess()
			&& $validateConnectionsResult->isSuccess()
			&& $validateMembershipResult->isSuccess()
		)
		{
			return new AgentWorkflowValidationResult(
				connections: $this->connectionsValidator->getValidConnections(),
				blocks: $this->blocksValidator->getValidBlocks(),
				setupConstantDeclarations: $this->blocksValidator->getSetupConstantDeclarations(),
			);
		}

		return (new Result())
			->addErrors($validateBlocksResult->getErrors())
			->addErrors($validateConnectionsResult->getErrors())
			->addErrors($validateMembershipResult->getErrors())
		;
	}
}
