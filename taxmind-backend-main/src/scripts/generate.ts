import { exec } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter migration name: ', (migrationName) => {
  if (!migrationName) {
    console.log('Migration name is required!');
    rl.close();
    process.exit(1);
  }

  // Execute the drizzle-kit command with the entered migration name
  const command = `npx drizzle-kit generate --name ${migrationName}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      rl.close();
      return;
    }

    if (stderr) {
      console.error(`Error: ${stderr}`);
    }

    console.log(stdout);
    rl.close();
  });
});
