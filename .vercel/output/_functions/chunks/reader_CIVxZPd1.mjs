import { createReader } from '@keystatic/core/reader';
import { k as keystaticConfig } from './keystatic.config_ByrsJa2t.mjs';

const keystaticReader = createReader(process.cwd(), keystaticConfig);

export { keystaticReader as k };
