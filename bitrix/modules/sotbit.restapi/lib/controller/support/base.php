<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\Support;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;
use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\Service\Support;
use Sotbit\RestAPI\Repository\SupportRepository;

abstract class Base extends BaseController
{
    /**
     * Support find service
     *
     * @return \Sotbit\RestAPI\Repository\SupportRepository
     * @throws \Psr\Container\ContainerExceptionInterface
     */
    protected function getRepository(): SupportRepository
    {
        return $this->container->get('support_repository');
    }

}
