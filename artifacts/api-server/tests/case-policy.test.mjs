import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canAccessCase,visibleResults,supportedChildAge} from '../src/lib/case-policy.ts';
test('unrelated professionals and families cannot access a case',()=>{
 const record={ownerId:'guardian',reviewerId:'clinician'};
 assert.equal(canAccessCase({id:'other',role:'clinic'},record),false);
 assert.equal(canAccessCase({id:'other',role:'family'},record),false);
 assert.equal(canAccessCase({id:'guardian',role:'family'},record),true);
 assert.equal(canAccessCase({id:'clinician',role:'clinic'},record),true);
});
test('family result delivery excludes every unapproved state',()=>{
 const versions=['draft','rejected','pending_review','approved'].map(status=>({status}));
 assert.deepEqual(visibleResults(versions,true),[{status:'approved'}]);
 assert.equal(visibleResults(versions,false).length,4);
});
test('age eligibility includes the whole twelfth year, rejects future and malformed dates',()=>{
 const now=new Date('2026-10-04T00:00:00Z');
 assert.equal(supportedChildAge('2013-10-05',now),true);
 assert.equal(supportedChildAge('2013-10-04',now),false);
 assert.equal(supportedChildAge('2026-10-04',now),true);
 assert.equal(supportedChildAge('2026-10-05',now),false);
 assert.equal(supportedChildAge('not a date',now),false);
});
