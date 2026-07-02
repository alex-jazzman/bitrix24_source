/**
 * An independently-cloned snapshot of a Schema for self-JOIN queries.
 * Created via BaseSchema.createRef().
 *
 * Mirrors the static API of BaseSchema as instance methods.
 * Named field properties are available directly: `ref.id`, `ref.name`, etc.
 */
declare class SchemaRef {
	getTableName(): string;

	getFields(): Array<BaseField>;

	getField(name: string): BaseField | null;

	getPrimaryFields(): Array<BaseField>;

	[fieldName: string]: BaseField | any;
}
