import { ShellCommandOptions } from '.'

export interface Command {
	description: string
	commandString?: string
	fn?: () => void
	options?: ShellCommandOptions
}
