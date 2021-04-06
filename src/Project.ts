//
// * IMPORTS
import editJsonFile = require('edit-json-file')

import * as path from 'path'

import { ShellCommand, ShellCommandOptions } from './interfaces'

import { Shell } from './utils'

export class Project {
	projectDirectory: string
	developmentMode: boolean
	commands: ShellCommand[]
	projectName: string

	executeShellCommand: (
		command: string,
		options?: ShellCommandOptions,
	) => Promise<string | Buffer>

	getCommandsArrayFromString(commandsString: string) {
		const commands: ShellCommand[] = []
		commandsString.split(/\n\s*#/).forEach((command) => {
			if (!command) return
			const commandParameters: ShellCommand = { description: '' }
			command.split('\n').forEach((parameter, i) => {
				parameter = parameter.trim()
				if (i === 0) commandParameters.description = parameter
				if (i === 1) {
					if (parameter.substr(0, 2) === '()') {
						commandParameters.fn = eval(parameter)
					} else commandParameters.commandString = parameter
				}
				if (i === 2) {
					const [key, value] = parameter.split(' ')
					if (key === '--cwd') commandParameters.options = { cwd: value }
					else if (key === '--skipInDevelopment')
						commandParameters.options = { skipInDevelopment: true }
				}
			})
			commands.push(commandParameters)
		})
		return commands
	}

	prettifyName(string: string) {
		return string
			.split('-')
			.map((l) => l.substr(0, 1).toUpperCase() + l.substring(1))
			.join(' ')
	}

	constructor(projectName: string, developmentMode = false) {
		projectName = projectName.replace(' ', '-')
		const workingDirectory = path.resolve(__dirname, '../..')
		this.developmentMode = developmentMode
		this.projectName = projectName
		this.projectDirectory = path.resolve(workingDirectory, projectName)
		const shell = new Shell(this.projectDirectory, {
			developmentMode,
		})
		this.executeShellCommand = shell.executeShellCommand

		const commandsString = `# Cloning repo into folder '${projectName}'
		gh repo clone mattdanielmurphy/create-node-project ${projectName}
		--cwd ${workingDirectory}

		# Removing installer files
		rm -r src

		# Updating package.json
		() => this.updatePackageJSON()

		# Updating readme
		echo "# ${this.prettifyName(projectName)}" > readme.md

		# Creating GitHub repo
		git remote remove origin; gh repo create ${projectName} -y --public
		--skipInDevelopment

		# Pushing first commit
		git add .; git commit -m "initial commit"; git push -u origin main
		--skipInDevelopment

		# Installing packages
		mkdir node_modules.nosync; ln -s node_modules.nosync node_modules; yarn
		--skipInDevelopment

		# Opening project folder in Visual Studio Code
		open . -a Visual\\ Studio\\ Code\\ -\\ Insiders
		--skipInDevelopment
		`
		this.commands = this.getCommandsArrayFromString(commandsString)
	}
	updatePackageJSON(): void {
		const file = editJsonFile(path.join(this.projectDirectory, 'package.json'))
		file.set('name', this.projectName)
		file.set('version', '0.0.1')
		file.set(
			'repository',
			`git@github.com:mattdanielmurphy/${this.projectName}.git`,
		)
		file.save()
	}
	async execute(): Promise<void> {
		let lastCommandFailed = false
		for (let i = 0; i < this.commands.length; i++) {
			const { description, commandString, fn, options = {} } = this.commands[i]

			if (lastCommandFailed) return

			console.log(`[${i + 1}/${this.commands.length}] ${description}...`) // [1/7] Cloning Repo...
			if (fn) {
				try {
					fn()
				} catch (error) {
					console.log(error)
					lastCommandFailed = true
				}
			} else if (commandString) {
				console.log(commandString)

				await this.executeShellCommand(commandString, options).catch(
					() => (lastCommandFailed = true),
				)
			}
		}

		console.log('All done!')
	}
}
