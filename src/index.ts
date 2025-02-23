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

type ExtendedType = `${DataType}${'' | '?'}` | [(string | null), ...(string | null)[]];

type InferField<T extends ExtendedType> = T extends any[] ? T[number]
	: T extends `${infer Type extends DataType}?` ? TypeMap[Type] | null
	: TypeMap[Assume<T, DataType>];

type Definition = Record<string, Schema>;

type InferSchema<TSchema extends Schema> = Simplify<
	{
		[K in keyof TSchema]: InferField<Assume<TSchema[K], ExtendedType>>;
	}
>;

type NullAsOptional<TData extends Record<string, any>> =
	& {
		[K in keyof TData as null extends TData[K] ? K : never]?: TData[K];
	}
	& {
		[K in keyof TData as null extends TData[K] ? never : K]: TData[K];
	};

type Schema =
	& Record<string, ExtendedType>
	& {
		[K in keyof Common]?: never;
	}
	& {
		entityType?: never;
	};

type Common = {
	schema: string | null;
	table: string | null;
	name: string;
};

const commonConfig: Config = {
	schema: 'string?',
	table: 'string?',
	name: 'string',
};

type InferEntities<
	TDefinition extends Definition,
> = {
	[K in keyof TDefinition]: Simplify<
		InferSchema<TDefinition[K]> & Common & {
			entityType: K;
		}
	>;
};

type Filter<TInput extends Record<string, any> = Record<string, any>> = {
	[K in keyof TInput]?: (TInput[K] extends any[] ? {
			CONTAINS: TInput[K][number];
		}
		: TInput[K]);
};

type UpdateOperators<TInput extends Record<string, any>> = {
	[K in keyof TInput]?:
		| TInput[K]
		| (TInput[K] extends any[] ? {
				REPLACE: TInput[K][number];
				WITH: TInput[K][number];
			}
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
			if (!target.find((e) => e === v.CONTAINS)) return false;
		} else {
			if (target !== v) return false;
		}
	}

	return true;
}

function filterCollection(collection: Record<string, any>[], filter: Filter) {
	return collection.filter((e) => matchesFilters(e, filter));
}

function replaceValue(arr: Array<any>, target: any, update: any) {
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === target) {
			arr[i] = update;
		}
	}
	return arr;
}

type InsertFn<TInput extends Record<string, any>> = (
	...input: Simplify<Omit<NullAsOptional<TInput>, 'entityType'>>[]
) => TInput;
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

	return (...input) => {
		store.collection.push(
			...(input.map((e: Record<string, any>) => {
				e.entityType = type;
				const filteredElement = Object.fromEntries(Object.entries(e).filter(([_, value]) => value !== undefined));
				return { ...nulls, ...filteredElement };
			})),
		);

		return input;
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

const generateUpdate: (config: Config, store: CollectionStore) => UpdateFn<any> = (config, store) => {
	return ({ value, filter }) => {
		const targets = filter ? filterCollection(store.collection, filter) : store.collection;
		const entries = Object.entries(value);

		for (const item of targets) {
			for (const [k, v] of entries) {
				const target = item[k];

				if (Array.isArray(target) && v.REPLACE) {
					item[k] = replaceValue(target, v.REPLACE, v.WITH);

					continue;
				}

				item[k] = v;
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
			update: generateUpdate(v, store),
			delete: generateDelete(v, store, common ? undefined : k),
		}];
	})) as any;
}

type Config = Record<string, string>;

type DbConfig<TDefinition extends Definition> = {
	/** Type-level fields only, do not attempt to access at runtime */
	types: InferEntities<TDefinition>;
	rawDefinition: TDefinition;
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

export type DiffInsert<TShape extends Record<string, any> = Record<string, any>, TType extends string = string> = {
	type: 'insert';
	entityType: TType;
	row: TShape;
};

export type DiffDelete<TShape extends Record<string, any> = Record<string, any>, TType extends string = string> = {
	type: 'delete';
	entityType: TType;
	row: TShape;
};

export type DiffUpdate<TShape extends Record<string, any> = Record<string, any>, TType extends string = string> = {
	type: 'update';
	entityType: TType;
	schema: string | null;
	table: string | null;
	name: string;
	changes: {
		[K in Exclude<keyof TShape, keyof Common | 'entityType'>]?: {
			from: TShape[K];
			to: TShape[K];
		};
	};
};

export type DiffStatement<
	TSchema extends Definition,
	TType extends keyof TSchema,
	TShape extends Record<string, any> = Simplify<
		InferSchema<TSchema[TType]> & Common & {
			entityType: TType;
		}
	>,
> =
	| DiffInsert<TShape, Assume<TType, string>>
	| DiffDelete<TShape, Assume<TType, string>>
	| DiffUpdate<TShape, Assume<TType, string>>;

type CollectionRow = Record<string, any> & Common & {
	entityType: string;
	key: string;
};

function getCompositeKey(
	row: Common & {
		entityType: string;
	},
): string {
	return `${row.schema ?? ''}:${row.table ?? ''}:${row.name}:${row.entityType}`;
}

const ignoreChanges: Record<keyof Common | 'entityType', true> = {
	entityType: true,
	name: true,
	schema: true,
	table: true,
};

function isEqual(a: any, b: any): boolean {
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((v, i) => v === b[i]);
	}
	return a === b;
}

export function diff<TDefinition extends Definition, TCollection extends keyof TDefinition>(
	dbOld: SimpleDb<TDefinition>,
	dbNew: SimpleDb<TDefinition>,
	collection: TCollection,
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
				row: oldRow,
			});
		} else {
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
					name: newRow.name,
					schema: newRow.schema,
					table: newRow.table,
					changes,
				});
			}
		}

		delete right[key];
	}

	for (const newRow of Object.values(right)) {
		inserted.push({
			type: 'insert',
			entityType: newRow.entityType as string,
			row: newRow,
		});
	}

	return [...inserted, ...deleted, ...changed] as DiffStatement<TDefinition, TCollection>[];
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

			Object.keys(def).forEach((fieldName) => {
				if (fieldName in commonConfig) throw new Error(`Used forbidden key "${fieldName}" in entity "${type}"`);
			});

			return [type, {
				...def,
				...commonConfig,
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
