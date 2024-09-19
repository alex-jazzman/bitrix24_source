<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Catalog;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;
use Fig\Http\Message\StatusCodeInterface as StatusCode;

use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\Repository\CatalogRepository;

/**
 * Class Base
 *
 * @package Sotbit\RestAPI\Controller\Catalog
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 20.10.2022
 */
abstract class Base extends BaseController
{
    /**
     * @return \Sotbit\RestAPI\Repository\CatalogRepository
     * @throws \Psr\Container\ContainerExceptionInterface
     */
    protected function getRepository(): CatalogRepository
    {
        return $this->container->get('catalog_repository');
    }
}
