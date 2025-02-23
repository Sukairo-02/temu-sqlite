import { beforeEach } from 'vitest';
import { create } from '../src';
import { expect, expectTypeOf, test } from 'vitest';

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

	const ent1 = db.entityOne.list()
	const ent2 = db.entityTwo.list()
	const all = db.entities.list()

	expect (ent1).toStrictEqual([])
	expect(ent2).toStrictEqual([
		{
			entityType: 'entityTwo',
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
			table: null,
			verified: null
		},
		{
			entityType: 'entityTwo',
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
			verified: null
		}
	])
	expect(all).toStrictEqual([
		{
			entityType: 'entityTwo',
			name: 'n1',
			array: ['one', 'two', 'three'],
			counter: 1,
			alias: 'first',
			schema: 'public',
			table: null,
			verified: null
		},
		{
			entityType: 'entityTwo',
			name: 'n2',
			array: ['four', 'five', 'six'],
			counter: 2,
			alias: 'second',
			schema: 'public',
			table: 'private',
			verified: null
		}
	])
});
