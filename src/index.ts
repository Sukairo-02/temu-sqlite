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

type InferField<T extends ExtendedType> = T extends string[] ? T[number]
	: T extends [Record<string, ExtendedType>] ? {
			[K in keyof T[0]]: InferField<T[0][K]>;
		}[]
	: T extends Record<string, ExtendedType> ?
			| {
				[K in keyof T]: InferField<T[K]>;
			}
			| null
	: T extends `${infer Type extends DataType}?` ? TypeMap[Type] | null
	: T extends DataType ? TypeMap[T]
	: never;

type Definition = Record<string, Schema>;

type InferSchema<TSchema extends Schema> = Simplify<
	{
		[K in keyof TSchema]: K extends keyof Common ? Exclude<Common[K], null>
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
	schema: 'string?',
	table: 'string?',
	name: 'string',
};

type InferEntities<
	TDefinition extends Definition,
> = {
	[K in keyof TDefinition]: Simplify<
		& InferSchema<TDefinition[K]>
		& {
			[C in keyof Common as C extends keyof TDefinition[K] ? never : null extends Common[C] ? never : C]: Common[C];
		}
		& {
			entityType: K;
		}
	>;
};

type Filter<TInput extends Record<string, any> = Record<string, any>> = {
	[K in keyof TInput]?:
		| TInput[K]
		| (TInput[K] extends (any[] | null) ? {
				CONTAINS: TInput[K][number];
			}
			: never);
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
			if (!isEqual(target, v)) return false;
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
	config: { set: Simplify<UpdateOperators<Omit<TInput, 'entityType'>>>; where?: Filter<TInput> },
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
	return ({ set, where }) => {
		const filter = type
			? {
				...(where ?? {}),
				entityType: type,
			}
			: where;

		const targets = filter ? filterCollection(store.collection, filter) : store.collection;
		const entries = Object.entries(set);

		for (const item of targets) {
			for (const [k, v] of entries) {
				const target = item[k];

				item[k] = typeof v === 'function'
					? (Array.isArray(target) || config[k] === 'string[]?') ? target !== null ? target.map(v) : target : v(target)
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

		const filter = type
			? {
				...(where ?? {}),
				entityType: type,
			}
			: where;

		if (!filter) {
			store.collection = updatedCollection;

			return deleted;
		}

		store.collection.forEach((e) => {
			if (matchesFilters(e, filter)) deleted.push(e);
			else updatedCollection.push(e);
		});

		store.collection = updatedCollection;

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

function initSchemaProcessors<T extends Omit<DbConfig<any>, 'diffs'>>(
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
	diffs: {
		alter: {
			[K in keyof TDefinition | 'entities']: DiffAlter<TDefinition, K>;
		};
		create: {
			[K in keyof TDefinition | 'entities']: DiffCreate<TDefinition, K>;
		};
		drop: {
			[K in keyof TDefinition | 'entities']: DiffDrop<TDefinition, K>;
		};
		createdrop: {
			[K in keyof TDefinition | 'entities']: DiffCreate<TDefinition, K> | DiffDrop<TDefinition, K>;
		};
		all: {
			[K in keyof TDefinition | 'entities']: DiffStatement<TDefinition, K>;
		};
	};
	store: CollectionStore;
};

type AnyDbConfig = {
	/** Type-level fields only, do not attempt to access at runtime */
	types: Record<string, Record<string, any>>;
	entities: Record<string, Config>;
};

type ValueOf<T> = T[keyof T];

export type DiffCreate<
	TSchema extends Definition = {},
	TType extends keyof TSchema | 'entities' = string,
	TShape extends Record<string, any> = TType extends 'entities' ? {} : Simplify<
		InferSchema<TSchema[TType]> & Omit<Common, keyof TSchema[TType]> & {
			entityType: TType;
		}
	>,
> = TType extends 'entities' ? ValueOf<
		{
			[K in keyof TSchema]: DiffCreate<TSchema, K>;
		}
	>
	: Simplify<
		& {
			$diffType: 'create';
			entityType: TType;
		}
		& {
			[
				K in keyof Common as K extends keyof TShape ? null extends TShape[K] ? never : K : K
			]: Exclude<Common[K], null>;
		}
		& Omit<TShape, keyof CommonEntity>
	>;

export type DiffDrop<
	TSchema extends Definition = {},
	TType extends keyof TSchema | 'entities' = string,
	TShape extends Record<string, any> = TType extends 'entities' ? {} : Simplify<
		InferSchema<TSchema[TType]> & Omit<Common, keyof TSchema[TType]> & {
			entityType: TType;
		}
	>,
> = TType extends 'entities' ? ValueOf<
		{
			[K in keyof TSchema]: DiffDrop<TSchema, K>;
		}
	>
	: Simplify<
		& {
			$diffType: 'drop';
			entityType: TType;
		}
		& {
			[
				K in keyof Common as K extends keyof TShape ? null extends TShape[K] ? never : K : K
			]: Exclude<Common[K], null>;
		}
		& Omit<TShape, keyof CommonEntity>
	>;

export type DiffAlter<
	TSchema extends Definition = {},
	TType extends keyof TSchema | 'entities' = string,
	TShape extends Record<string, any> = TType extends 'entities' ? {} : Simplify<
		InferSchema<TSchema[TType]> & Omit<Common, keyof TSchema[TType]> & {
			entityType: TType;
		}
	>,
> = TType extends 'entities' ? ValueOf<
		{
			[K in keyof TSchema]: DiffAlter<TSchema, K>;
		}
	>
	: Simplify<
		& {
			$diffType: 'alter';
			entityType: TType;
		}
		& {
			[
				K in keyof Common as K extends keyof TShape ? null extends TShape[K] ? never : K : K
			]: Exclude<Common[K], null>;
		}
		& {
			[K in Exclude<keyof TShape, keyof CommonEntity>]?: {
				from: TShape[K];
				to: TShape[K];
			};
		}
	>;

export type DiffStatement<
	TSchema extends Definition,
	TType extends keyof TSchema | 'entities',
> =
	| DiffCreate<TSchema, TType>
	| DiffDrop<TSchema, TType>
	| DiffAlter<TSchema, TType>;

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

function _diff<
	TDefinition extends Definition,
	TCollection extends keyof TDefinition | 'entities' = 'entities',
	TMode extends 'all' | 'create' | 'drop' | 'createdrop' | 'alter' = 'all',
	TDataBase extends SimpleDb<TDefinition> = SimpleDb<TDefinition>,
>(
	dbOld: SimpleDb<TDefinition>,
	dbNew: SimpleDb<TDefinition>,
	collection?: TCollection,
	mode?: TMode,
): Simplify<TDataBase['_']['diffs'][TMode][TCollection]>[] {
	collection = collection ?? 'entities' as TCollection;
	mode = mode ?? 'all' as TMode;

	const leftEntities = dbOld.entities.list(
		collection === 'entities' ? undefined : {
			// @ts-ignore
			entityType: collection,
		},
	) as CollectionRow[];
	const rightEntities = dbNew.entities.list(
		collection === 'entities' ? undefined : {
			// @ts-ignore
			entityType: collection,
		},
	) as CollectionRow[];

	const left: Record<string, CollectionRow> = {};
	const right: Record<string, CollectionRow> = {};

	for (const row of leftEntities) {
		left[getCompositeKey(row)] = row;
	}
	for (const row of rightEntities) {
		right[getCompositeKey(row)] = row;
	}

	const created: DiffCreate[] = [];
	const dropped: DiffDrop[] = [];
	const altered: DiffAlter[] = [];

	for (const [key, oldRow] of Object.entries(left)) {
		const newRow = right[key];
		if (!newRow) {
			if (mode === 'all' || mode === 'drop' || mode === 'createdrop') {
				dropped.push({
					$diffType: 'drop',
					entityType: oldRow.entityType,
					name: oldRow.name,
					// @ts-ignore
					schema: oldRow.schema,
					table: oldRow.table,
					...sanitizeRow(oldRow),
				});
			}
		} else if (mode === 'all' || mode === 'alter') {
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
				altered.push({
					$diffType: 'alter',
					entityType: newRow.entityType,
					name: newRow.name,
					// @ts-ignore
					schema: newRow.schema,
					table: newRow.table,
					...changes,
				});
			}
		}

		delete right[key];
	}

	if (mode === 'all' || mode === 'create' || mode === 'createdrop') {
		for (const newRow of Object.values(right)) {
			created.push({
				$diffType: 'create',
				entityType: newRow.entityType as string,
				name: newRow.name,
				// @ts-ignore
				schema: newRow.schema,
				table: newRow.table,
				...sanitizeRow(newRow),
			});
		}
	}

	return [...created, ...dropped, ...altered] as any;
}

export function diff<
	TDefinition extends Definition,
	TCollection extends keyof TDefinition | 'entities' = 'entities',
>(dbOld: SimpleDb<TDefinition>, dbNew: SimpleDb<TDefinition>, collection?: TCollection) {
	return _diff(dbOld, dbNew, collection, 'createdrop');
}

export namespace diff {
	export function all<
		TDefinition extends Definition,
		TCollection extends keyof TDefinition | 'entities' = 'entities',
	>(dbOld: SimpleDb<TDefinition>, dbNew: SimpleDb<TDefinition>, collection?: TCollection) {
		return _diff(dbOld, dbNew, collection, 'all');
	}

	export function creates<
		TDefinition extends Definition,
		TCollection extends keyof TDefinition | 'entities' = 'entities',
	>(dbOld: SimpleDb<TDefinition>, dbNew: SimpleDb<TDefinition>, collection?: TCollection) {
		return _diff(dbOld, dbNew, collection, 'create');
	}

	export function drops<
		TDefinition extends Definition,
		TCollection extends keyof TDefinition | 'entities' = 'entities',
	>(dbOld: SimpleDb<TDefinition>, dbNew: SimpleDb<TDefinition>, collection?: TCollection) {
		return _diff(dbOld, dbNew, collection, 'drop');
	}

	export function alters<
		TDefinition extends Definition,
		TCollection extends keyof TDefinition | 'entities' = 'entities',
	>(dbOld: SimpleDb<TDefinition>, dbNew: SimpleDb<TDefinition>, collection?: TCollection) {
		return _diff(dbOld, dbNew, collection, 'alter');
	}
}

class SimpleDb<TDefinition extends Definition = Record<string, any>> {
	public readonly _: DbConfig<TDefinition> = {
		diffs: {} as any,
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
								[K in keyof TInferred]:
									& TInferred[K]
									& {
										[C in keyof Common]: C extends keyof TInferred[K] ? null extends TInferred[K][C] ? Common[C]
											: Exclude<Common[C], null>
											: Common[C];
									};
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
				cloneDef[fieldName] = fieldValue;

				if (fieldValue === 'required') {
					if (!(fieldName in commonConfig)) {
						throw new Error(
							`Type value "required" is only applicable to common keys [ ${
								Object.keys(commonConfig).map((e) => `"${e}"`).join(', ')
							} ], used on: "${fieldName}"`,
						);
					}

					cloneDef[fieldName] = (commonConfig[fieldName]) as Exclude<
						ExtendedType,
						'required'
					>;
				} else {
					if (fieldName in commonConfig || fieldName in commonConfig) {
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
