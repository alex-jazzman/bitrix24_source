import { Event } from 'main.core';

const FileUtil = {
	getBase64(file: File): Promise<string>
	{
		const reader = new FileReader();

		return new Promise((resolve) => {
			Event.bind(reader, 'load', () => {
				const fullBase64 = reader.result;
				const commaPosition = fullBase64.indexOf(',');
				const cutBase64 = fullBase64.slice(commaPosition + 1);
				resolve(cutBase64);
			});

			reader.readAsDataURL(file);
		});
	},
};

export const fileUtil = Object.seal(FileUtil);
