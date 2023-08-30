<?php

declare(strict_types=1);

namespace Sotbit\RestAPI\Controller\User;

use Slim\Http\Request;
use Slim\Http\Response;
use Slim\Http\StatusCode;

use Sotbit\RestAPI\Controller\BaseController;
use Sotbit\RestAPI\Repository\UserRepository;

/**
 * Class Base
 *
 * @package Sotbit\RestAPI\Controller\User
 * @author Andrey Sapronov <a.sapronov@sotbit.ru>
 */
abstract class Base extends BaseController
{
    /**
     * User repository
     * @return mixed
     * @throws \Psr\Container\ContainerExceptionInterface
     */
    protected function getRepository(): UserRepository
    {
        return $this->container->get('user_repository');
    }

}
