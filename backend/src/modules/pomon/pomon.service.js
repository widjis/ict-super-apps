import { createPomonClient, getPomonConfig } from '../../integrations/pomon/pomon.client.js';

const pomon = createPomonClient();

export function getPomon() {
  return pomon;
}

export function readPomonConfig() {
  return getPomonConfig();
}
