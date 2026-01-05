import readline from 'readline'
import { handleCommand } from './commandHandler'

// 헬퍼: 한 번의 입력을 받고 rl을 닫는 함수
async function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log('')
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function createCLI(player: any, context: any) {
  while (true) {
    const line = await askQuestion('명령(명령어 리스트: 도움말) > ');
    const shouldExit = await handleCommand(line, player, context);
    if (shouldExit === 'exit') break;
  }
}
