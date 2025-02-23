import { beforeEach } from 'vitest';
import { expect, expectTypeOf, test } from 'vitest';
import { create } from '../src';

const db = create({
	entityOne: {
		type: 'string',
		email: 'string?',
	},
	entityTwo: {
		alias: 'string',
		counter: 'number',
		array: 'string[]',
		verified: 'boolean?',
	},
});

beforeEach(() => {
	db.entities.delete();
	console.log(db.entities.list());
});

test('Insert & list entity', () => {
	db.entityTwo.insert(
		{
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
		},
		{
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
		},
	);

	const ent1 = db.entityOne.list();
	const ent2 = db.entityTwo.list();
	const all = db.entities.list();

	expectTypeOf(ent1).toEqualTypeOf<
		{
			type: string;
			email: string | null;
			schema: string | null;
			table: string | null;
			name: string;
			entityType: 'entityOne';
		}[]
	>;
	expectTypeOf(ent2).toEqualTypeOf<
		{
			alias: string;
			counter: number;
			array: string[];
			verified: boolean | null;
			schema: string | null;
			table: string | null;
			name: string;
			entityType: 'entityTwo';
		}[]
	>;
	expectTypeOf(all).toEqualTypeOf<({
		type: string;
		email: string | null;
		schema: string | null;
		table: string | null;
		name: string;
		entityType: 'entityOne';
	} | {
		alias: string;
		counter: number;
		array: string[];
		verified: boolean | null;
		schema: string | null;
		table: string | null;
		name: string;
		entityType: 'entityTwo';
	})[]>;

	expect(ent1).toStrictEqual([]);
	expect(ent2).toStrictEqual([
		{
			entityType: 'entityTwo',
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
			table: null,
			verified: null,
		},
		{
			entityType: 'entityTwo',
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
			verified: null,
		},
	]);
	expect(all).toStrictEqual([
		{
			entityType: 'entityTwo',
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
			table: null,
			verified: null,
		},
		{
			entityType: 'entityTwo',
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
			verified: null,
		},
	]);
});

test('Insert & list multiple entities', () => {
	db.entityOne.insert({
		name: 'e1',
		type: 'varchar',
	}, {
		name: 'e2',
		type: 'text',
	});

	db.entityTwo.insert(
		{
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
		},
		{
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
		},
	);

	const ent1 = db.entityOne.list();
	const ent2 = db.entityTwo.list();
	const all = db.entities.list();

	expect(ent1).toStrictEqual([{
		entityType: 'entityOne',
		name: 'e1',
		type: 'varchar',
		email: null,
		table: null,
		schema: null,
	}, {
		entityType: 'entityOne',
		name: 'e2',
		type: 'text',
		email: null,
		table: null,
		schema: null,
	}]);
	expect(ent2).toStrictEqual([
		{
			entityType: 'entityTwo',
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
			table: null,
			verified: null,
		},
		{
			entityType: 'entityTwo',
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
			verified: null,
		},
	]);
	expect(all).toStrictEqual([{
		entityType: 'entityOne',
		name: 'e1',
		type: 'varchar',
		email: null,
		table: null,
		schema: null,
	}, {
		entityType: 'entityOne',
		name: 'e2',
		type: 'text',
		email: null,
		table: null,
		schema: null,
	}, {
		entityType: 'entityTwo',
		name: 'n1',
		array: ['one', 'two', 'three'],
		counter: 1,
		alias: 'first',
		schema: 'public',
		table: null,
		verified: null,
	}, {
		entityType: 'entityTwo',
		name: 'n2',
		array: ['four', 'five', 'six'],
		counter: 2,
		alias: 'second',
		schema: 'public',
		table: 'private',
		verified: null,
	}]);
});

test('Insert & list filtered multiple entities', () => {
	db.entityOne.insert({
		name: 'e1',
		type: 'varchar',
	}, {
		name: 'e2',
		type: 'text',
		schema: 'public',
	});

	db.entityTwo.insert(
		{
			name: 'n1',
			array: ['one', 'two', 'TARGET', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
		},
		{
			name: 'n2',
			array: ['four', 'five', 'six', 'TARGET'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
		},
		{
			name: 'n3',
			array: ['seven', 'eight', 'nine'],
			counter: 3,
			alias: 'second',
			table: 'private',
		},
	);

	const ent1 = db.entityOne.list({
		type: 'varchar',
	});
	const ent2 = db.entityTwo.list({
		array: {
			CONTAINS: 'TARGET',
		},
	});
	const all = db.entities.list({
		schema: 'public',
	});

	expect(ent1).toStrictEqual([{
		entityType: 'entityOne',
		name: 'e1',
		type: 'varchar',
		email: null,
		table: null,
		schema: null,
	}]);
	expect(ent2).toStrictEqual([
		{
			entityType: 'entityTwo',
			name: 'n1',
			array: ['one', 'two', 'TARGET', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
			table: null,
			verified: null,
		},
		{
			entityType: 'entityTwo',
			name: 'n2',
			array: ['four', 'five', 'six', 'TARGET'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
			verified: null,
		},
	]);
	expect(all).toStrictEqual([{
		entityType: 'entityOne',
		name: 'e2',
		type: 'text',
		email: null,
		table: null,
		schema: 'public',
	}, {
		entityType: 'entityTwo',
		name: 'n1',
		array: ['one', 'two', 'TARGET', 'three'],
		counter: 1,
		alias: 'first',
		schema: 'public',
		table: null,
		verified: null,
	}, {
		entityType: 'entityTwo',
		name: 'n2',
		array: ['four', 'five', 'six', 'TARGET'],
		counter: 2,
		alias: 'second',
		schema: 'public',
		table: 'private',
		verified: null,
	}]);
});
