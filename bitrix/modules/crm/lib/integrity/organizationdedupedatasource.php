<?php

namespace Bitrix\Crm\Integrity;

use Bitrix\Main;
use Bitrix\Main\Entity\Query;
use Bitrix\Main\ORM;

class OrganizationDedupeDataSource extends MatchHashDedupeDataSource
{
	public function __construct(DedupeParams $params)
	{
		parent::__construct(DuplicateIndexType::ORGANIZATION, $params);
	}

	final protected function getOrmEntity(): ORM\Entity
	{
		return DuplicateOrganizationMatchCodeTable::getEntity();
	}

	final protected function applyQueryFilterByMatches(Query $query, DuplicateCriterion $criterion): Query
	{
		$matches = $criterion->getMatches();
		$title = $matches['TITLE'] ?? '';
		if ($title === '')
		{
			throw new Main\ArgumentException("Parameter 'TITLE' is required.", 'matches');
		}
		$query->addFilter('=TITLE', $title);

		return $query;
	}

	protected function getEntityMatchesByHash($entityTypeID, $entityID, $matchHash): ?array
	{
		$matches = DuplicateOrganizationCriterion::loadEntityMatches($entityTypeID, $entityID);

		return (is_array($matches) && DuplicateOrganizationCriterion::prepareMatchHash($matches) === $matchHash)
			? $matches
			: null
		;
	}

	protected function createCriterionFromMatches(array $matches): DuplicateCriterion
	{
		return DuplicateOrganizationCriterion::createFromMatches($matches);
	}

	protected function prepareResult(array &$map, DedupeDataSourceResult $result): void
	{
		$entityTypeID = $this->getEntityTypeID();

		foreach ($map as $matchHash => &$entry)
		{
			$isValidEntry = false;

			$primaryQty = isset($entry['PRIMARY']) ? count($entry['PRIMARY']) : 0;
			if ($primaryQty > 1)
			{
				$matches = $this->getEntityMatchesByHash(
					$entityTypeID,
					$entry['PRIMARY'][0],
					$matchHash
				);
				if (is_array($matches))
				{
					$criterion = $this->createCriterionFromMatches($matches);
					$dup = new Duplicate($criterion, array());
					foreach ($entry['PRIMARY'] as $entityID)
					{
						$dup->addEntity(new DuplicateEntity($entityTypeID, $entityID));
					}
					$result->addItem($matchHash, $dup);

					$isValidEntry = true;
				}
			}

			if (!$isValidEntry)
			{
				$result->addInvalidItem((string)$matchHash);
			}
		}
		unset($entry);
	}

	/**
	 * @deprecated
	 * @see DedupeDataSource::isEmptyEntity()
	 * 
	 * @noinspection All
	 */
	public function calculateEntityCount(DuplicateCriterion $criterion, array $options = null)
	{
		$entityTypeID = $this->getEntityTypeID();
		$enablePermissionCheck = $this->isPermissionCheckEnabled();
		$userID = $this->getUserID();

		$query = new Main\Entity\Query(DuplicateOrganizationMatchCodeTable::getEntity());
		$query->addSelect('QTY');
		$query->registerRuntimeField('', new Main\Entity\ExpressionField('QTY', 'COUNT(*)'));
		$query->addFilter('=ENTITY_TYPE_ID', $entityTypeID);

		if($enablePermissionCheck)
		{
			$permissionSql = $this->preparePermissionSql();
			if($permissionSql === false)
			{
				//Access denied;
				return 0;
			}
			if(is_string($permissionSql) && $permissionSql !== '')
			{
				$query->addFilter('@ENTITY_ID', new Main\DB\SqlExpression($permissionSql));
			}
		}

		$matches = $criterion->getMatches();
		$title = isset($matches['TITLE']) ? $matches['TITLE'] : '';
		if($title === '')
		{
			throw new Main\ArgumentException("Parameter 'TITLE' is required.", 'matches');
		}
		$query->addFilter('=TITLE', $title);

		$rootEntityID = 0;
		if(is_array($options) && isset($options['ROOT_ENTITY_ID']))
		{
			$rootEntityID =  (int)$options['ROOT_ENTITY_ID'];
		}
		if($rootEntityID > 0)
		{
			$query->addFilter('!ENTITY_ID', $rootEntityID);
			$query->addFilter(
				'!@ENTITY_ID',
				DuplicateIndexMismatch::prepareQueryField($criterion, $entityTypeID, $rootEntityID, $userID)
			);
		}

		$query = DedupeDataSource::registerRuntimeFieldsByParams($query, $this->getParams());

		$limit = 0;
		if(is_array($options) && isset($options['LIMIT']))
		{
			$limit =  (int)$options['LIMIT'];
		}
		if($limit > 0)
		{
			$query->setLimit($limit);
		}

		$dbResult = $query->exec();
		$fields = $dbResult->fetch();
		return is_array($fields) && isset($fields['QTY']) ? intval($fields['QTY']) : 0;
	}
}
