import { DiskPicker, type DiskPickerParams, type PickerResult } from 'disk.disk-picker';

type DiskPickerFactory = () => DiskPicker;

export type DiskImagePickerOptions = {
	pickerFactory?: DiskPickerFactory,
};

type ActivePicker = {
	picker: DiskPicker,
	resolve: (objectId: number | null) => void,
	reject: (error: Error) => void,
	settled: boolean,
};

export class DiskImagePicker
{
	#pickerFactory: DiskPickerFactory;
	#active: ActivePicker | null = null;

	constructor(options: DiskImagePickerOptions = {})
	{
		this.#pickerFactory = options.pickerFactory ?? (() => new DiskPicker());
	}

	choose(): Promise<number | null>
	{
		if (this.#active)
		{
			return Promise.reject(new Error('A Disk image selection is already active.'));
		}

		return new Promise<number | null>((resolve, reject) => {
			const picker = this.#pickerFactory();
			this.#active = { picker, resolve, reject, settled: false };
			picker.open(this.#buildParams());
		});
	}

	cancel(): void
	{
		this.#active?.picker.close();
		this.#settle(null);
	}

	#buildParams(): DiskPickerParams
	{
		return {
			selectionMode: 'single',
			maxItems: 1,
			allowedFileTypes: ['image'],
			onSelect: (result: PickerResult) => {
				this.#settle(result.items[0]?.objectId ?? null);
			},
			onCancel: () => this.#settle(null),
			onClose: () => this.#settle(null),
			onError: (error) => {
				this.#settle(null, new Error(error.code));
			},
		};
	}

	#settle(objectId: number | null, error: Error | null = null): void
	{
		const active = this.#active;
		if (!active || active.settled)
		{
			return;
		}

		active.settled = true;
		this.#active = null;
		if (error)
		{
			active.reject(error);
		}
		else
		{
			active.resolve(objectId);
		}
	}
}
