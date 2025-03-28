<?php

/**
 * Slim Framework (https://slimframework.com)
 *
 * @license https://github.com/slimphp/Slim/blob/4.x/LICENSE.md (MIT License)
 */

declare(strict_types=1);

namespace Slim\Interfaces;

interface CallableResolverInterface
{
    /**
     * Resolve $toResolve into a callable
     *
     * @param string|callable $toResolve
     */
    public function resolve($toResolve): callable;
}
