//
// * IMPORTS
import editJsonFile = require('edit-json-file')

import * as path from 'path'

import { exec } from 'child_process'

interface ShellCommandOptions {
	cwd?: string
	verboseMode?: boolean
	skipInDevelopment?: boolean
}

export class Project {
	projectDirectory: string
	developmentMode: boolean
	constructor(projectName: string, developmentMode = false) {
		this.developmentMode = developmentMode
		const workingDirectory = path.resolve(__dirname, '../..')
		this.projectDirectory = path.resolve(workingDirectory, projectName)

		const commands = [
			{
				message: `Cloning repo into folder '${projectName}'`,
				command: `gh repo clone mattdanielmurphy/create-node-project ${projectName}`,
				options: { cwd: workingDirectory },
			},
			{
				message: 'Removing installer files',
				command: 'rm -r src',
			},
			{
				message: 'Updating package.json',
				fn: () => this.updatePackageJSON(projectName),
			},
			{
				message: 'Updating readme',
				command: `echo "# ${projectName}" > readme.md`,
			},
			{
				message: 'Creating GitHub repo',
				command: `git remote remove origin; gh repo create ${projectName} -y --public`,
				options: { skipInDevelopment: true },
			},
			{
				message: 'Pushing first commit',
				command:
					'git add .; git commit -m "initial commit"; git push -u origin main',
				options: { skipInDevelopment: true },
			},
			{
				message: 'Installing packages',
				command:
					'mkdir node_modules.nosync; ln -s node_modules.nosync node_modules; yarn',
			},
			{
				message: 'Opening project folder in Visual Studio Code',
				command: 'open . -a Visual\\ Studio\\ Code\\ -\\ Insiders',
			},
		]

		console.log('All done!')
		this.executeListOfShellCommands(commands)
	}
	updatePackageJSON(projectName: string): void {
		const file = editJsonFile(path.join(this.projectDirectory, 'package.json'))
		file.set('name', projectName)
		file.set('version', '0.0.1')
		file.set('repository', `git@github.com:mattdanielmurphy/${projectName}.git`)
		file.save()
	}
	async executeListOfShellCommands(
		commands: {
			message: string
			command?: string
			fn?: () => void
			options?: ShellCommandOptions
		}[],
		options?: ShellCommandOptions,
	): Promise<void> {
		const optionsForAllCommands = options || {}
		let lastCommandFailed = false

		for (let i = 0; i < commands.length; i++) {
			const { message, command, options = {}, fn } = commands[i]
			Object.assign(options, optionsForAllCommands)

			if (lastCommandFailed) return

			console.log(`[${i + 1}/${commands.length}] ${message}...`) // [1/7] Cloning Repo...
			if (fn) {
				try {
					fn()
				} catch (error) {
					console.log(error)
					lastCommandFailed = true
				}
			} else {
				await this.executeShellCommand(command || '', options).catch(
					() => (lastCommandFailed = true),
				)
			}
		}
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
						console.log(error)
						reject(error)
					}
					if (verboseMode && stdout) console.log(stdout)
					resolve(stdout ? stdout : stderr)
				},
			)
		})
	}
}
