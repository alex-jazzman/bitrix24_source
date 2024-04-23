<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Sale;

use Slim\Container;
use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;

use Sotbit\RestAPI\Service\Sale;
use Sotbit\RestAPI\Exception\UserException;
use Sotbit\RestAPI\Core;
use Sotbit\RestAPI\Localisation as l;
use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\Repository\SaleRepository;

/**
 * Class Base
 *
 * @package Sotbit\RestAPI\Controller\Sale
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 * Date: 20.10.2022
 */
abstract class Base extends BaseController
{
    /**
     * Sale find service
     *
     * @return \Sotbit\RestAPI\Repository\SaleRepository
     * @throws \Psr\Container\ContainerExceptionInterface
     */
    protected function getRepository(): SaleRepository
    {
        return $this->container->get('sale_repository');
    }

}
