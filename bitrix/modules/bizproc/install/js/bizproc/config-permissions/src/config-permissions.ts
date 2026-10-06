import { App } from 'ui.accessrights.v2';

type PermissionConfigOptions = ConstructorParameters<typeof App>[0];

export class ConfigPermissions
{
	#options: PermissionConfigOptions;
	#app: App | null = null;

	constructor(options: PermissionConfigOptions)
	{
		this.#options = options;
	}

	draw(): App
	{
		this.#app = new App(this.#options);
		this.#app.draw();

		return this.#app;
	}
}
