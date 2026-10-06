export const getArrayBuffer = (file: File | Blob): Promise<ArrayBuffer> => {
	if (file.arrayBuffer)
	{
		return file.arrayBuffer();
	}

	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.readAsArrayBuffer(file);

		fileReader.onload = () => {
			const buffer = fileReader.result as ArrayBuffer;

			resolve(buffer);
		};

		fileReader.onerror = () => {
			reject(fileReader.error);
		};
	});
};
