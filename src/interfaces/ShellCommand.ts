import { ShellCommandOptions } from '.'

export interface ShellCommand {
	description: string
	commandString?: string
	fn?: () => void
	options?: ShellCommandOptions
}
