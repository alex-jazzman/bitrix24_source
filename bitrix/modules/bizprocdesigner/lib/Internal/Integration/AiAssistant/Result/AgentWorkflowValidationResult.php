<?php

namespace Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Result;

use Bitrix\Bizproc\Public\Entity\Activity\SetupTemplateActivity\SetupConstantDeclaration;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentBlockCollection;
use Bitrix\BizprocDesigner\Internal\Integration\AiAssistant\Entity\AgentConnectionCollection;
use Bitrix\Main\Result;

class AgentWorkflowValidationResult extends Result
{
	/**
	 * @param list<SetupConstantDeclaration> $setupConstantDeclarations constants the setup wizard forms of this
	 *        graph declare, taken from the nodes whose fingerprint diverged from the published baseline (TPL-03).
	 *        Empty when the graph carries no such node, and the write then behaves exactly as it did before this
	 *        field existed. It rides the very path the valid blocks ride: a channel of its own would let the graph
	 *        be judged by one reading of the forms and written by another.
	 */
	public function __construct(
		public readonly AgentConnectionCollection $connections,
		public readonly AgentBlockCollection $blocks,
		public readonly array $setupConstantDeclarations = [],
	)
	{
		parent::__construct();
	}
}