<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Access\Rule\Factory;

use Bitrix\Main\Access\AccessibleController;
use Bitrix\Main\Access\Rule\Factory\RuleControllerFactory;
use Bitrix\Note\Internal\Access\ActionDictionary;

final class NoteRuleFactory extends RuleControllerFactory
{
	protected const BASE_RULE = 'Base';

	protected function getClassName(string $action, AccessibleController $controller): ?string
	{
		$action = str_replace(ActionDictionary::PREFIX, '', $action);
		$actionParts = explode('_', $action);
		$actionParts = array_map(static fn($el) => ucfirst(mb_strtolower($el)), $actionParts);
		$ruleClassName = $this->getNamespace($controller) . implode($actionParts) . static::SUFFIX;

		if (class_exists($ruleClassName))
		{
			return $ruleClassName;
		}

		return $this->getNamespace($controller) . static::BASE_RULE . static::SUFFIX;
	}
}
