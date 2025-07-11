<?php

namespace Bitrix\Main\Cli\Command\Make;

use Bitrix\Main\Cli\Command\Make\Service\Controller\GenerateDto;
use Bitrix\Main\Cli\Command\Make\Service\ControllerService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\InvalidArgumentException;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Command for generate controller class.
 *
 * Example (run from `DOCUMENT_ROOT/bitrix` folder):
 * ```bash
	* php bitrix.php make:controller entity partner.module
 * ```
 *
 * Example custom namespace:
 * ```bash
	* php bitrix.php make:controller entity --namespace My\\Custom\\Namespace
 * ```
 *
 * Example generate to custom folder (default generate to document root):
 * ```bash
	* php bitrix.php make:controller entity partner.module --root ./my/folder
 * ```
 *
 * Example generate to custom file:
 * ```bash
	* php bitrix.php make:controller entity partner.module --show > ./my/folder/my-custom-file.php
 * ```
 *
 *  Example generate with actions:
 *  ```bash
 * php bitrix.php make:controller entity partner.module --actions index,crud --show
 *  ```
 *
 *   Example generate with alias:
 *   ```bash
 *  php bitrix.php make:controller entity partner.module --actions index,crud --alias V2 --show
 *   ```
 */
final class ControllerCommand extends Command
{
	private ControllerService $service;

	protected function configure(): void
	{
		$this->service = new ControllerService();

		$this
			->setName('make:controller')
			->setDescription('Make empty controller file')
			->addArgument('name', InputArgument::REQUIRED, 'controller name')
			->addArgument('module', InputArgument::OPTIONAL, 'module id')
			->addOption('namespace', 'ns', InputOption::VALUE_REQUIRED, 'custom namespace')
			->addOption('psr4', null, InputOption::VALUE_NEGATABLE, 'generate file path in PSR4 / camelCase style, ex: `module/lib/My/ClassName.php`', true)
			->addOption('root', null, InputOption::VALUE_REQUIRED, 'root folder for generate. Defaults server document root')
			->addOption('show', null, InputOption::VALUE_NONE, 'outputs to console, without saving it. It can be used to save to an arbitrary location when using the `>` operator.')
			->addOption('actions', null, InputArgument::OPTIONAL, 'generate given actions in controller. Use alias "crud" for CRUD actions')
			->addOption('alias', null, InputArgument::OPTIONAL, 'controller\'s namespace alias from .settings.php')
		;
	}

	protected function execute(InputInterface $input, OutputInterface $output): int
	{
		$name = $input->getArgument('name');
		if (!is_string($name))
		{
			throw new InvalidArgumentException('Controller name must be string');
		}

		$dto = new GenerateDto(
			name: $name,
			moduleId: $input->getArgument('module'),
			namespace: $input->getOption('namespace'),
			rootFolder: $input->getOption('root'),
			psr4: $input->getOption('psr4') === true,
			actions: $this->resolveActions($input),
			alias: $input->getOption('alias'),
		);

		if ($input->getOption('show') === true)
		{
			$output->write($this->service->generateContent($dto));
			$output->writeln("\n");
		}
		else
		{
			$this->service->generateFile($dto);
		}

		return self::SUCCESS;
	}

	private function resolveActions(InputInterface $input): array
	{
		$actions = $input->getOption('actions');

		if (empty($actions))
		{
			return [];
		}

		$actions = explode(',', $actions);

		if (in_array('crud', $actions, true))
		{
			$actions = array_filter($actions, static fn(string$action): bool => $action !== 'crud');

			$actions = array_merge(
				$actions,
				['list', 'get', 'add', 'update', 'delete']
			);

			return array_unique($actions);
		}

		return $actions;
	}
}
