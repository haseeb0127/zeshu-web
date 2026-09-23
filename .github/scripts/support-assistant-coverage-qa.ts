import fs from 'node:fs';

const route = fs.readFileSync('app/api/support/assistant/route.ts', 'utf8');
const knowledge = fs.readFileSync('app/lib/support-ai.ts', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

assert(route.includes('There is no published launch date I can safely promise'), 'Assistant must not invent Move & Travel launch dates');
assert(route.includes('I will not invent a fare, charge or ETA'), 'Assistant must not invent fares or ETAs');
assert(route.includes('final weight/size limits, prohibited-goods rules, insurance and liability'), 'Courier limits must defer to verified provider terms');
assert(route.includes('authorized provider shown at booking will supply the authoritative fare, baggage, room and ticket rules'), 'Travel supplier rules must remain provider-authoritative');
assert(knowledge.includes('do not invent or estimate a launch date'), 'Knowledge base must forbid invented launch dates');
assert(knowledge.includes('do not estimate it'), 'Knowledge base must forbid invented Move pricing/ETA');

const moveFlagCount = (env.match(/^MOVE_EXECUTION_ENABLED=/gm) || []).length;
assert(moveFlagCount === 1, 'MOVE_EXECUTION_ENABLED must be documented exactly once');
assert(env.includes('Guided/rules-based help remains available while AI is off.'), 'Environment manifest should explain guided help fallback');

console.log('SUPPORT_ASSISTANT_COVERAGE_QA=PASS');
