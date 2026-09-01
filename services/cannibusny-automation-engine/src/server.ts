import { createApp } from './app';
import { loadConfig } from './config';

const { port } = loadConfig();

createApp().listen(port, () => {
  console.log(`Cannibus NY automation engine listening on port ${port}`);
});
