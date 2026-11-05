import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FixtureRoute } from '../lib/routes.js';

const path = process.env.STUDIO_FIXTURE_ROUTES;
if (!path) throw new Error('Set STUDIO_FIXTURE_ROUTES to the generated structural route map.');
export const routes = JSON.parse(readFileSync(resolve(path), 'utf8')) as FixtureRoute[];
