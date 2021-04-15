import { ShellCommandOptions } from '../interfaces'
import { exec } from 'child_process'

export class Shell {
	developmentMode = false
	projectDirectory: string
	constructor(
		projectDirectory = __dirname,
		options = { developmentMode: false },
	) {
		this.projectDirectory = projectDirectory
		this.developmentMode = options.developmentMode
		console.log('development mode:', this.developmentMode)
	}

	async executeShellCommand(
		command: string,
		options: ShellCommandOptions = {},
	): Promise<string | Buffer> {
		if (options.skipInDevelopment && this.developmentMode) {
			console.log('(skipped in development)')
			return 'skipped in development'
		}

		let verboseMode: boolean
		if (options.verboseMode) {
			delete options.verboseMode
			verboseMode = true
		}

		options = {
			cwd: this.projectDirectory,
			...options,
		}

		return new Promise((resolve, reject) => {
			exec(
				command,
				options,
				(
					error: Error | null,
					stdout: string | Buffer,
					stderr: string | Buffer,
				) => {
					if (error) {
						console.log(error, stdout || stderr || '')
						reject(error)
					}
					if (verboseMode && stdout) console.log(stdout)
					resolve(stdout ? stdout : stderr)
				},
			)
		})
	}
}
