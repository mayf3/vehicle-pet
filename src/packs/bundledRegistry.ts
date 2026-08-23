/**
 * Build-time static bundled Pack registry (CTR-PET-025).
 * This is the only place where concrete Packs are wired into the application;
 * there is no runtime Pack installer and no remote Pack support.
 */

import type { PackBundleInput } from '../engine'
import { autonomousFleetBundle } from './autonomous-fleet'
import { seedlingFixtureBundle } from './seedling-fixture'

export const bundledPackBundles: PackBundleInput[] = [autonomousFleetBundle, seedlingFixtureBundle]

export const defaultPackId = 'autonomous-fleet'
