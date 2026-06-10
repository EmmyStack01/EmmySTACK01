import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../keystatic.config';

const cwd = typeof process !== 'undefined' ? process.cwd() : '/var/task';

export const keystaticReader = createReader(cwd, keystaticConfig);
