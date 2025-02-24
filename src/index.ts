type DataType = 'string' | 'string[]' | 'number' | 'boolean';

type TypeMap = {
	string: string;
	number: number;
	boolean: boolean;
	'string[]': string[];
};

type Simplify<T> =
	& {
		[K in keyof T]: T[K];
	}
	& {};

type Assume<T, U> = T extends U ? T : U;

type ExtendedType =
	| `${DataType}${'' | '?'}`
	| 'required'
	| [string, ...string[]]
	| {
		[K: string]: Exclude<ExtendedType, 'required'>;
	}
	| ([{
		[K: string]: Exclude<ExtendedType, 'required'>;
	}]);

type RemoveQuestionMark<T extends string> = T extends `${infer R}?` ? R : T;

type InferField<T extends ExtendedType> = T extends string[] ? T[number]
	: T extends [Record<string, ExtendedType>] ? {
			[K in keyof T[0] & string]: InferField<T[0][K]>;
		}[]
	: T extends Record<string, ExtendedType> ?
			| {
				[K in keyof T & string]: InferField<T[K]>;
			}
			| null
	: T extends `${infer Type extends DataType}?` ? TypeMap[Type] | null
	: T extends DataType ? TypeMap[T]
	: never;

type Definition = Record<string, Schema>;

type InferSchema<TSchema extends Schema> = Simplify<
	{
		[K in keyof TSchema & string]: K extends keyof Common ? Exclude<Common[K], null>
			: InferField<Assume<TSchema[K], ExtendedType>>;
	}
>;

type NullAsUndefined<TData extends Record<string, any>> =
	& {
		[K in keyof TData as null extends TData[K] ? K : never]: TData[K] | undefined;
	}
	& {
		[K in keyof TData as null extends TData[K] ? never : K]: TData[K];
	};

type Schema =
	& Record<string, ExtendedType>
	& {
		[K in keyof Common as null extends Common[K] ? K : never]?: 'required';
	}
	& {
		[K in keyof Common as null extends Common[K] ? never : K]?: never;
	}
	& {
		[K in `${keyof Common}?`]?: never;
	}
	& {
		entityType?: never;
		CONTAINS?: never;
	};

type Common = {
	schema: string | null;
	table: string | null;
	name: string;
};

const commonConfig: Config = {
	schema: 'string',
	table: 'string',
	name: 'string',
};

type InferEntities<
	TDefinition extends Definition,
> = {
	[K in keyof TDefinition]: Simplify<
		InferSchema<TDefinition[K]> & Omit<Common, keyof TDefinition[K]> & {
			entityType: K;
		}
	>;
};

type Filter<TInput extends Record<string, any> = Record<string, any>> = {
	[K in keyof TInput]?: (TInput[K] extends (any[] | null) ? {
			CONTAINS: TInput[K][number];
		}
		: TInput[K]);
};

type UpdateOperators<TInput extends Record<string, any>> = {
	[K in keyof TInput]?:
		| TInput[K]
		| (TInput[K] extends (any[] | Record<string, any> | null) ? ((
				item: TInput[K] extends any[] | null ? Exclude<TInput[K], null>[number] : TInput[K],
			) => TInput[K] extends any[] | null ? Exclude<TInput[K], null>[number] : TInput[K])
			: never);
};

type CollectionStore = {
	collection: Record<string, any>[];
};

function matchesFilters(item: Record<string, any>, filter: Filter): boolean {
	for (const [k, v] of Object.entries(filter)) {
		if (v === undefined) continue;
		const target = item[k];

		if ((typeof v === 'object' && v.CONTAINS !== undefined)) {
			if (!Array.isArray(target)) return false;
			if (!target.find((e) => isEqual(e, v.CONTAINS))) return false;
		} else {
			return isEqual(target, v);
		}
	}

	return true;
}

function filterCollection(collection: Record<string, any>[], filter: Filter) {
	return collection.filter((e) => matchesFilters(e, filter));
}

type CommonEntity = Common & {
	entityType: string;
};

function getCompositeKey(
	row: CommonEntity,
): string {
	return `${row.schema ?? ''}:${row.table ?? ''}:${row.name}:${row.entityType}`;
}

function findCompositeKey(dataSource: (CommonEntity)[], target: CommonEntity) {
	const targetKey = getCompositeKey(target);
	const match = dataSource.find((e) => getCompositeKey(e) === targetKey);

	return match;
}

function replaceValue(arr: Array<any>, target: any, update: any) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === target) {
			arr[i] = update;
		}
	}
	return arr;
}

export type InferInsert<TShape extends Record<string, any>> = Simplify<
	Omit<
		NullAsUndefined<
			{
				[
					K in keyof TShape as K extends keyof Common
						? (null extends Common[K] ? null extends TShape[K] ? never : K : K)
						: K
				]: TShape[K];
			}
		>,
		'entityType'
	>
>;

type InsertFn<
	TInput extends Record<string, any>,
> = (
	input: InferInsert<TInput>,
) => {
	status: 'OK' | 'CONFLICT';
	data: TInput extends [Record<string, any>, Record<string, any>, ...Record<string, any>[]] ? TInput[] : TInput;
};
type ListFn<TInput extends Record<string, any>> = (where?: Filter<TInput>) => TInput[];
type UpdateFn<TInput extends Record<string, any>> = (
	config: { value: Simplify<UpdateOperators<Omit<TInput, 'entityType'>>>; filter?: Filter<TInput> },
) => TInput[];
type DeleteFn<TInput extends Record<string, any>> = (where?: Filter<TInput>) => TInput[];

const generateInsert: (config: Config, store: CollectionStore, type: string) => InsertFn<any> = (
	config,
	store,
	type,
) => {
	const nulls = Object.fromEntries(Object.keys(config).map((e) => [e, null]));

	return (input) => {
		const filteredElement = Object.fromEntries(Object.entries(input).filter(([_, value]) => value !== undefined));
		const mapped = {
			...nulls,
			...filteredElement,
			entityType: type,
		};

		const conflict = findCompositeKey(store.collection as CommonEntity[], mapped as CommonEntity);
		if (conflict) {
			return { status: 'CONFLICT', data: conflict };
		}

		store.collection.push(mapped);

		return { status: 'OK', data: mapped };
	};
};

const generateList: (config: Config, store: CollectionStore, type?: string) => ListFn<any> = (
	config,
	store,
	type,
) => {
	return (where) => {
		const from = type
			? filterCollection(store.collection, {
				entityType: type,
			})
			: store.collection;

		if (!where) return from;

		return (filterCollection(from, where));
	};
};

const generateUpdate: (config: Config, store: CollectionStore, type?: string) => UpdateFn<any> = (
	config,
	store,
	type,
) => {
	return ({ value, filter: where }) => {
		const filter = type
			? {
				...(where ?? {}),
				entityType: type,
			}
			: where;

		const targets = filter ? filterCollection(store.collection, filter) : store.collection;
		const entries = Object.entries(value);

		for (const item of targets) {
			for (const [k, v] of entries) {
				const target = item[k];

				item[k] = typeof v === 'function'
					? Array.isArray(target) ? target.map(v) : v(target)
					: v;
			}
		}

		return targets;
	};
};

const generateDelete: (config: Config, store: CollectionStore, type?: string) => DeleteFn<any> = (
	config,
	store,
	type,
) => {
	return (where) => {
		const updatedCollection = [] as Record<string, any>[];
		const deleted = [] as Record<string, any>[];

		const filter = where && type ? { ...where, entityType: type } : type
			? {
				entityType: type,
			}
			: undefined;

		if (!filter) {
			store.collection = updatedCollection;

			return deleted;
		}

		store.collection.forEach((e) => {
			if (matchesFilters(e, filter)) deleted.push(e);
			else updatedCollection.push(e);
		});

		return deleted;
	};
};

type GenerateProcessors<T extends AnyDbConfig, TTypes extends Record<string, any> = T['types']> = {
	[K in keyof TTypes]: {
		insert: InsertFn<TTypes[K]>;
		list: ListFn<TTypes[K]>;
		update: UpdateFn<TTypes[K]>;
		delete: DeleteFn<TTypes[K]>;
	};
};

function initSchemaProcessors<T extends DbConfig<any>>(
	{ entities }: T,
	store: CollectionStore,
	common: boolean,
): GenerateProcessors<T> {
	const entries = Object.entries(entities);

	return Object.fromEntries(entries.map(([k, v]) => {
		return [k, {
			insert: generateInsert(v, store, k),
			list: generateList(v, store, common ? undefined : k),
			update: generateUpdate(v, store, common ? undefined : k),
			delete: generateDelete(v, store, common ? undefined : k),
		}];
	})) as any;
}

type Config = Record<string, string>;

type DbConfig<TDefinition extends Definition> = {
	/** Type-level fields only, do not attempt to access at runtime */
	types: InferEntities<TDefinition>;
	definition: TDefinition;
	entities: {
		[K in keyof TDefinition]: Config;
	};
	store: CollectionStore;
};

type AnyDbConfig = {
	/** Type-level fields only, do not attempt to access at runtime */
	types: Record<string, Record<string, any>>;
	entities: Record<string, Config>;
};

type ValueOf<T> = T[keyof T];

export type DiffInsert<
	TSchema extends Definition = {},
	TType extends string = string,
	TShape extends Record<string, any> = Simplify<
		InferSchema<TSchema[TType]> & Omit<Common, keyof TSchema[TType]> & {
			entityType: TType;
		}
	>,
> = Simplify<
	& {
		type: 'insert';
		entityType: TType;
		row: Simplify<Omit<TShape, keyof CommonEntity>>;
	}
	& {
		[
			K in keyof Common as K extends keyof TShape ? null extends TShape[K] ? never : K : K
		]: Common[K];
	}
>;

export type DiffDelete<
	TSchema extends Definition = {},
	TType extends string = string,
	TShape extends Record<string, any> = Simplify<
		InferSchema<TSchema[TType]> & Omit<Common, keyof TSchema[TType]> & {
			entityType: TType;
		}
	>,
> = Simplify<
	& {
		type: 'delete';
		entityType: TType;
		row: Simplify<Omit<TShape, keyof CommonEntity>>;
	}
	& {
		[
			K in keyof Common as K extends keyof TShape ? null extends TShape[K] ? never : K : K
		]: Common[K];
	}
>;

export type DiffUpdate<
	TSchema extends Definition = {},
	TType extends string = string,
	TShape extends Record<string, any> = Simplify<
		InferSchema<TSchema[TType]> & Omit<Common, keyof TSchema[TType]> & {
			entityType: TType;
		}
	>,
> = Simplify<{
	type: 'update';
	entityType: TType;
	changes: Simplify<
		& {
			[K in Exclude<keyof TShape, keyof CommonEntity>]?: {
				from: TShape[K];
				to: TShape[K];
			};
		}
		& {
			[K in keyof Common as K extends keyof TShape ? null extends TShape[K] ? never : K : K]: Common[K];
		}
	>;
}>;

export type DiffStatement<
	TSchema extends Definition,
	TType extends keyof TSchema,
> =
	| DiffInsert<TSchema, Assume<TType, string>>
	| DiffDelete<TSchema, Assume<TType, string>>
	| DiffUpdate<TSchema, Assume<TType, string>>;

type CollectionRow = Record<string, any> & Common & {
	entityType: string;
	key: string;
};

const ignoreChanges: Record<keyof Common | 'entityType', true> = {
	entityType: true,
	name: true,
	schema: true,
	table: true,
};

function isEqual(a: any, b: any): boolean {
	if (typeof a !== typeof b) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((v, i) => isEqual(v, b[i]));
	}

	if (typeof a === 'object') {
		if (a === b) return true;
		if ((a === null || b === null) && a !== b) return false;

		const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));

		return keys.every((k) => isEqual(a[k], b[k]));
	}

	return a === b;
}

function sanitizeRow(row: Record<string, any>) {
	return Object.fromEntries(
		Object.entries(row).filter(([k, v]) => !ignoreChanges[k as keyof typeof ignoreChanges]),
	);
}

export function diff<TDefinition extends Definition, TCollection extends keyof TDefinition>(
	dbOld: SimpleDb<TDefinition>,
	dbNew: SimpleDb<TDefinition>,
	collection: TCollection,
	ignoreUpdates = true,
): Simplify<DiffStatement<TDefinition, TCollection>>[] {
	const leftEntities = dbOld.entities.list({
		// @ts-ignore
		entityType: collection,
	}) as CollectionRow[];
	const rightEntities = dbNew.entities.list({
		// @ts-ignore
		entityType: collection,
	}) as CollectionRow[];

	const left: Record<string, CollectionRow> = {};
	const right: Record<string, CollectionRow> = {};

	for (const row of leftEntities) {
		left[getCompositeKey(row)] = row;
	}
	for (const row of rightEntities) {
		right[getCompositeKey(row)] = row;
	}

	const inserted: DiffInsert[] = [];
	const deleted: DiffDelete[] = [];
	const changed: DiffUpdate[] = [];

	for (const [key, oldRow] of Object.entries(left)) {
		const newRow = right[key];
		if (!newRow) {
			deleted.push({
				type: 'delete',
				entityType: oldRow.entityType,
				name: oldRow.name,
				// @ts-ignore
				schema: oldRow.schema,
				table: oldRow.table,
				row: sanitizeRow(oldRow),
			});
		} else if (!ignoreUpdates) {
			const changes: Record<string, any> = {};
			let isChanged = false;

			for (const [k, v] of Object.entries(oldRow)) {
				if (ignoreChanges[k as keyof typeof ignoreChanges]) continue;

				if (!isEqual(oldRow[k], newRow[k])) {
					isChanged = true;
					changes[k] = { from: oldRow[k], to: newRow[k] };
				}
			}

			if (isChanged) {
				changed.push({
					type: 'update',
					entityType: newRow.entityType,
					// @ts-ignore
					name: newRow.name,
					schema: newRow.schema,
					table: newRow.table,
					changes: changes as (typeof changed)[number]['changes'],
				});
			}
		}

		delete right[key];
	}

	for (const newRow of Object.values(right)) {
		inserted.push({
			type: 'insert',
			entityType: newRow.entityType as string,
			name: newRow.name,
			// @ts-ignore
			schema: newRow.schema,
			table: newRow.table,
			row: sanitizeRow(newRow),
		});
	}

	return [...inserted, ...deleted, ...changed] as any as DiffStatement<TDefinition, TCollection>[];
}

function removeQuestionMark<T extends string>(str: T): RemoveQuestionMark<T> {
	return (str.endsWith('?')
		? str.slice(0, str.length - 1)
		: str) as RemoveQuestionMark<T>;
}

class SimpleDb<TDefinition extends Definition = Record<string, any>> {
	public readonly _: DbConfig<TDefinition> = {
		store: {
			collection: [] as Record<string, any>[],
		},
	} as any;

	public entities: Omit<
		GenerateProcessors<{
			types: {
				entities: InferEntities<TDefinition> extends infer TInferred ? Simplify<
						ValueOf<
							{
								[K in keyof TInferred]: TInferred[K];
							}
						>
					>
					: never;
			};
			entities: any;
		}>['entities'],
		'insert'
	>;

	constructor(definition: TDefinition) {
		const entries = Object.entries(definition);
		const configs = Object.fromEntries(entries.map(([type, def]) => {
			if (type === 'entities' || type === '_') throw new Error(`Illegal entity type name: "${type}"`);
			const cloneDef: Record<string, any> = {};

			Object.entries(def).forEach(([fieldName, fieldValue]) => {
				const newName = fieldName; // removeQuestionMark(fieldName);
				cloneDef[newName] = fieldValue;

				if (fieldValue === 'required') {
					if (!(fieldName in commonConfig)) {
						throw new Error(
							`Type value "required" is only applicable to common keys [ ${
								Object.keys(commonConfig).map((e) => `"${e}"`).join(', ')
							} ], used on: "${fieldName}"`,
						);
					}

					cloneDef[newName] =
						(typeof commonConfig[newName] === 'string'
							&& commonConfig[newName]) /*removeQuestionMark(commonConfig[newName]))*/ as Exclude<
								ExtendedType,
								'required'
							>;
				} else {
					if (newName in commonConfig || fieldName in commonConfig) {
						throw new Error(`Used forbidden key "${fieldName}" in entity "${type}"`);
					}
				}
			});

			return [type, {
				...commonConfig,
				...cloneDef,
			}];
		}));

		this._.entities = configs as any;

		const entConfig = {
			...this._,
			entities: {
				entities: commonConfig,
			},
		};

		this.entities = initSchemaProcessors(entConfig, this._.store, true).entities as any;
	}
}

export function create<
	TDefinition extends Definition,
	TResult = SimpleDb<TDefinition> extends infer DB extends SimpleDb<any> ? Simplify<DB & GenerateProcessors<DB['_']>>
		: never,
>(
	definition: TDefinition,
): TResult {
	const db = new SimpleDb(definition);

	const processors = initSchemaProcessors(db._, db._.store, false);
	for (const [k, v] of Object.entries(processors)) {
		(db as any)[k] = v;
	}

	return db as any;
}
