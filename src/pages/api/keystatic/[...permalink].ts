import { makeResponseHandler } from '@keystatic/astro/api';
import config from '../../../../keystatic.config';

export const ALL = makeResponseHandler({ config });