<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Service\Import\Step;

use Bitrix\Note\Internal\Service\Import\Source\SourceInterface;

interface StepInterface
{
	public function execute(array &$option, ?SourceInterface $source): void;
}
