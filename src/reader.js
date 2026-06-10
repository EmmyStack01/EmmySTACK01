import { createReader } from '@keystatic/core/reader';
import { createGitHubReader } from '@keystatic/core/reader/github';
import keystaticConfig from '../keystatic.config';

const isProduction = import.meta.env.PROD;

export const keystaticReader = isProduction
  ? createGitHubReader(keystaticConfig, {
      repo: 'EmmyStack01/EmmySTACK01',
      token: import.meta.env.GITHUB_TOKEN,
    })
  : createReader(process.cwd(), keystaticConfig);