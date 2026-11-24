import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  workers: 1,
  testIgnore: [
    '**/exercise-images-complete.spec.js',
    '**/exercise-images-three.spec.js',
    '**/exercise-presentation-pilot.spec.js',
    '**/header-screenshot-repro.spec.js'
  ]
});
