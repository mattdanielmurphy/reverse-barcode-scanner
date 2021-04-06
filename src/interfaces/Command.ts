import { ShellCommandOptions } from '.'

export interface Command {
	message: string
	command?: string
	fn?: () => void
	options?: ShellCommandOptions
}
