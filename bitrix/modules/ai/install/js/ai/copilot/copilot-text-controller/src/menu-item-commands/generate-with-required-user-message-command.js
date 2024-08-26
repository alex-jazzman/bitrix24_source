import { BaseCommand, type BaseCommandOptions } from './base-command';

type GenerateWithRequiredUserMessageCommandOptions = {
	commandCode: string;
} | BaseCommandOptions;

export class GenerateWithRequiredUserMessageCommand extends BaseCommand
{
	#commandCode: string;

	constructor(options: GenerateWithRequiredUserMessageCommandOptions)
	{
		super(options);

		this.#commandCode = options.commandCode;
	}

	execute(): void
	{
		this.copilotTextController.generateWithRequiredUserMessage(this.#commandCode);
	}
}
