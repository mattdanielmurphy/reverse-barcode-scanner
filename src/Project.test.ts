import { Project } from './Project'
import { exec } from 'child_process'

jest.setTimeout(15000)

describe('should create project', () => {
	removeTestProjectFolder()
	const projectName = 'create-node-project-test'
	const project = new Project(projectName, true)
	it('should create project folder in ~/Projects', async () => {
		await project.execute().catch((err) => {
			console.log('ERROR', err)
			removeTestProjectFolder()
		})
		const projects = await projectsInProjectDirectory()
		expect(projects).toContain(projectName)
	})
})

//
// * functions ------------------------------------------------------------------------

async function executeCommand(commandString: string): Promise<string> {
	return await new Promise<string>((resolve, reject) => {
		exec(commandString, (err, stdout, stderr) => {
			if (err || stderr) reject(err || stderr)
			if (stdout) resolve(stdout)
		})
	})
}

function removeTestProjectFolder() {
	executeCommand('rm -rf ~/Projects/create-node-project-test')
}

async function projectsInProjectDirectory() {
	const projects = await executeCommand('ls ~/Projects')
	return projects.split('\n')
}
