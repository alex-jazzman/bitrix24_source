<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Repository;

use Bitrix\Main\Context;

abstract class BaseRepository
{

    /**
     * Default limit of messages per page
     */
    public const DEFAULT_LIMIT_PAGE = 50;

    /**
     * Default page
     */
    public const DEFAULT_PAGE = 1;

    public $siteId;


    public function __construct()
    {
        $this->siteId = Context::getCurrent()->getSite();
    }

    protected function prepareNavigation(array $params): array
    {
        $filter = [];
        if(!is_null($params['filter']) && is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return $this->prepareVariable($v);
                },
                $params['filter']
            );


            $filter = array_merge(
                $filter,
                ['USER_ID' => $params['user_id']]
            );
        } else {
            $filter['USER_ID'] = $params['user_id'];
        }

        $params['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $params['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : self::DEFAULT_PAGE);
        $params['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $params['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $params['filter'] = (array)$filter;

        return $params;
    }

    protected function prepareNavigationSupport(array $params): array
    {
        $filter = [];
        if(!is_null($params['filter']) && is_array($params['filter'])) {
            $filter = array_map(
                function($v) {
                    return str_replace(',', '|', $v);
                },
                $params['filter']
            );


            $filter = array_merge(
                $filter,
                ['USER_ID' => $params['user_id']]
            );
        } else {
            $params['filter']['USER_ID'] = $params['user_id'];
        }

        $params['select'] = (array)($params['select'] ? $this->prepareVariable($params['select']) : ['*']);
        $params['page'] = (int)(is_numeric($params['page']) && $params['page'] > 0 ? $params['page']
            : self::DEFAULT_PAGE);
        $params['limit'] = (int)(is_numeric($params['limit']) && $params['limit'] > 0 ? $params['limit']
            : self::DEFAULT_LIMIT_PAGE);
        $params['order'] = (array)($params['order'] ?? ['ID' => 'DESC']);
        $params['filter'] = (array)$filter;

        return $params;
    }

    protected function prepareVariable($value)
    {
        return (stripos($value, ',') !== false ? explode(',', $value) : $value);
    }

}
