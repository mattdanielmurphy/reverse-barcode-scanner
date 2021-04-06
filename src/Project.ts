//
// * IMPORTS
import editJsonFile = require('edit-json-file')

import * as path from 'path'

import { Command, ShellCommandOptions } from './interfaces'

import { Shell } from './utils'

export class Project {
	projectDirectory: string
	developmentMode: boolean
	commands: Command[]

	executeShellCommand: (
		command: string,
		options?: ShellCommandOptions,
	) => Promise<string | Buffer>

	constructor(projectName: string, developmentMode = false) {
		const workingDirectory = path.resolve(__dirname, '../..')
		this.developmentMode = developmentMode
		this.projectDirectory = path.resolve(workingDirectory, projectName)
		const shell = new Shell(this.projectDirectory, {
			developmentMode,
		})
		this.executeShellCommand = shell.executeShellCommand

		this.commands = [
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
				options: { skipInDevelopment: true },
			},
		]
	}
	updatePackageJSON(projectName: string): void {
		const file = editJsonFile(path.join(this.projectDirectory, 'package.json'))
		file.set('name', projectName)
		file.set('version', '0.0.1')
		file.set('repository', `git@github.com:mattdanielmurphy/${projectName}.git`)
		file.save()
	}
	async execute(): Promise<void> {
		let lastCommandFailed = false

		for (let i = 0; i < this.commands.length; i++) {
			const { message, command, options = {}, fn } = this.commands[i]

			if (lastCommandFailed) return

			console.log(`[${i + 1}/${this.commands.length}] ${message}...`) // [1/7] Cloning Repo...
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

		console.log('All done!')
	}
}
