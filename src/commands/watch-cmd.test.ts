import { Command } from 'commander';
import { registerWatchCommand } from './watch-cmd';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerWatchCommand(program);
  return program;
}

describe('registerWatchCommand', () => {
  it('registers the watch command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd).toBeDefined();
  });

  it('requires --vault option', () => {
    const program = buildProgram();
    expect(() =>
      program.parse(['node', 'cli', 'watch', '.env', '--password', 'pass'])
    ).toThrow();
  });

  it('requires --password option', () => {
    const program = buildProgram();
    expect(() =>
      program.parse(['node', 'cli', 'watch', '.env', '--vault', 'v.vault'])
    ).toThrow();
  });

  it('requires envFile argument', () => {
    const program = buildProgram();
    expect(() =>
      program.parse(['node', 'cli', 'watch', '--vault', 'v.vault', '--password', 'pass'])
    ).toThrow();
  });

  it('watch command has correct description', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    expect(cmd?.description()).toBeTruthy();
  });

  it('watch command exposes --vault and --password options', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'watch');
    const optionNames = cmd?.options.map((o) => o.long);
    expect(optionNames).toContain('--vault');
    expect(optionNames).toContain('--password');
  });
});
