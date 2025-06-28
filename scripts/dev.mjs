import concurrently from 'concurrently';

concurrently([
  { command: 'npm run server', name: 'server', prefixColor: 'blue' },
  { command: 'npm run client', name: 'client', prefixColor: 'green' }
], {
  killOthers: ['failure', 'success'],
  restartTries: 0,
}).catch(() => process.exit(1));
