import { Project } from './Project'
import { exec } from 'child_process'

test('should create project', async () => {
	removeTestProjectFolder()
	const projectName = 'create-node-project-test'
	const project = new Project(projectName, true)
	await project.execute()
})

//
// * functions ------------------------------------------------------------------------

function removeTestProjectFolder() {
	exec('rm -rf ~/Projects/create-node-project-test', (err, stdout, stderr) => {
		if (err) {
			console.log(err)
		}
		if (stderr) {
			console.log(stderr)
		}
		if (stdout) {
			console.log(stdout)
		}
	})
}
