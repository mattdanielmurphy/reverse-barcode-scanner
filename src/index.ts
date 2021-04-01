import { Project } from './Project'

//
// * FUNCTIONS

function getProjectNameFromParameters(): string {
	// $ create-node-project [name of project with spaces]
	const projectName = process.argv.slice(2).join('-') // name-of-project-with-spaces

	if (projectName) {
		return projectName
	} else
		throw new Error(
			'Please provide a project name:\n\tcreate-node-project [directory] [project-name]',
		)
}

//
// * PROGRAM START

const projectName = getProjectNameFromParameters()
new Project(projectName)
