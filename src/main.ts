import 'dotenv/config';
import 'zx/globals';
import type { LogEntry } from 'zx/core';

// $.verbose = false;
const logOld = $.log;
$.log = (entry: LogEntry) => {
  switch (entry.kind) {
    case 'fetch':
      if (!$.verbose) return;
      // const init = entry.init ? ' ' + inspect(entry.init) : '';
      // process.stderr.write('$ ' + chalk.greenBright('fetch') + ` ${entry.url}${init}\n`);
      process.stderr.write('$ ' + chalk.greenBright('fetch') + ` ${entry.url}\n`);
      break;
    default:
      logOld(entry);
  }
};

try {
  switch (argv.mode) {
    case 'test':
      const { client } = await import('./client');
      console.log(client.storage.from('jacket').getPublicUrl('webp/3.webp'));
      break;
    case 'jp':
      await import('./main.jp');
      break;
    case 'hdd':
      await import('./main.hdd');
      break;
    case 'cn':
      await import('./main.cn');
      break;
    default:
      if (argv.mode) throw new Error('unknown mode');
      else throw new Error('please specify --mode=<jp|hdd|cn>');
  }
} catch (e) {
  console.log(chalk.bgRed(' ERROR '), e);
}
