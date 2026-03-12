import { Tag, Runtime, Type } from 'main.core';

type Field = {
	fieldName: string,
	value: string,
	property: FieldProperties,
};

type FieldProperties = {
	Multiple?: boolean,
};

export class ImBotCreateBotActivityRenderer
{
	getControlRenderers(): Record<string, (Field) => HTMLElement>
	{
		return {
			diskFile: (field: Field): HTMLElement => {
				const container = Tag.render`<div></div>`;
				const loader = new BX.Loader({
					size: 40,
					target: container,
					mode: 'inline',
				});
				loader.show();

				Runtime.loadExtension('ui.uploader.tile-widget')
					.then(({ TileWidget }): void => {
						loader.destroy();
						const widget = new TileWidget({
							controller: 'disk.uf.integration.diskUploaderController',
							hiddenFieldsContainer: container,
							hiddenFieldName: field.fieldName,
							files: this.#getValueAsArray(field.value),
							multiple: Boolean(field.property?.Multiple),
							autoUpload: true,
							acceptOnlyImages: true,
						});

						widget.renderTo(container);
					})
					.catch((e): void => {
						loader.destroy();
						container.textContent = e;
					})
				;

				return container;
			},
		};
	}

	#getValueAsArray(value: any): Array<string | number>
	{
		if (Type.isArray(value))
		{
			return value.filter((item) => Type.isNumber(item) || Type.isStringFilled(item));
		}

		if (Type.isNumber(value) || Type.isStringFilled(value))
		{
			return [value];
		}

		return [];
	}
}
