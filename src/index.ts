//
// * IMPORTS

import editJsonFile = require('edit-json-file')

import * as path from 'path'

import { exec } from 'child_process'

//
// * PROGRAM

const projectName = process.argv.slice(2).join('-')

if (projectName) createProject(projectName)
else
	console.log(
		'Please provide a project name:\n\tcreate-node-project [directory] [project-name]',
	)

//
// * FUNCTIONS

interface Options {
	cwd?: string
	verboseMode?: boolean
}

async function executeShellCommand(command: string, options: Options = {}) {
	let verboseMode: boolean
	if (options.verboseMode) {
		delete options.verboseMode
		verboseMode = true
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

async function createProject(projectName: string) {
	const workingDirectory = path.resolve(__dirname, '../..')
	const projectDirectory = path.resolve(workingDirectory, projectName)
	async function executeListOfShellCommands(
		commands: {
			message: string
			command?: string
			fn?(): void
			options?: Options
		}[],
		options?: Options,
	) {
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
				await executeShellCommand(command || '', {
					cwd: projectDirectory,
					...options,
				}).catch(() => (lastCommandFailed = true))
			}
		}
	}

	function getRemoveInstallerFilesCommand() {
		const installerFiles = ['src']
		return `rm -r ${installerFiles.join(' ')}`
	}

	const commands = [
		{
			message: `Cloning repo into folder '${projectName}'`,
			command: `gh repo clone mattdanielmurphy/create-node-project ${projectName}`,
			options: { cwd: workingDirectory },
		},
		{
			message: 'Removing installer files',
			command: getRemoveInstallerFilesCommand(),
		},
		{
			message: 'Updating package.json',
			fn: () => {
				const file = editJsonFile(path.join(projectDirectory, 'package.json'))
				file.set('name', projectName)
				file.set('version', '0.0.1')
				file.set(
					'repository',
					`git@github.com:mattdanielmurphy/${projectName}.git`,
				)
				file.save()
			},
		},
		{
			message: 'Updating readme',
			command: `echo "# ${projectName}" > readme.md`,
		},
		{
			message: 'Creating GitHub repo',
			command: `git remote remove origin; gh repo create ${projectName} -y --public`,
		},
		{
			message: 'Pushing first commit',
			command:
				'git add .; git commit -m "initial commit"; git push -u origin main',
		},
		{
			message: 'Installing packages', // and do node_modules.nosync trick
			command:
				'mkdir node_modules.nosync; ln -s node_modules.nosync node_modules; yarn',
		},
		{
			message: 'Opening project folder in Visual Studio Code',
			command: 'code-insiders .',
		},
	]

	console.log('All done!')
	executeListOfShellCommands(commands)
}
