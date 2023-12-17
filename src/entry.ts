import * as fs from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import program from 'commander-plus'
import pkg from '../package.json'
import { log, setVerbose } from './logger'
import { generateLockfileString, getAndParseFiles } from './generator'

program
    .version(pkg.version)
    .usage('--folder <folder> [options]')
    .option('--folder <folder>', 'folder path to run on')
    .parse(process.argv)

let missingRequiredArg = false
const printMissingArg = (details: string) => console.error(chalk.red('Missing argument:'), details)

if (!program.folder) {
    printMissingArg('--folder <folder>')
    missingRequiredArg = true
}

if (missingRequiredArg) {
    program.help()
}

setVerbose(true)


//read the workspaces from the package.json
const workspaces = require(program.folder+'/package.json').workspaces.packages;

//display the workspaces
console.log(chalk.green('## WORKSPADCES: '+JSON.stringify(workspaces)))

function findSubfolders(folderPath) {
    try {
        // Read the contents of the folder
        const files = fs.readdirSync(folderPath);

        // Filter out subfolders
        const subfolders = files.filter(file => {
            const fullPath = path.join(folderPath, file);
            return fs.statSync(fullPath).isDirectory();
        });

        return subfolders;
    } catch (err) {
        console.error(chalk.red(`Error reading folder: ${err.message}`));
        return [];
    }
}

function fileExists(filePath) {
    try {
        // Check if the file exists using fs.accessSync
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (err) {
        // An error indicates that the file doesn't exist
        return false;
    }
}

//use the workspaces to run a dedicated command for each workspace
workspaces.forEach(workspace => {
    console.log(chalk.green(`\n## Running ${program.folder}/${workspace}...`));
    //remove /* from the workspace
    var myWorkspace = workspace.replace('/*','');
    
    

    //for each subfolder run the command if the workspace holds an *
    if ( workspace.includes('/*') )  {
        
        //find subfolder in workspace
        const subfolder = findSubfolders(program.folder+'/'+myWorkspace)
        console.log(chalk.green('#### SUBFOLDER: '+JSON.stringify(subfolder)));
        subfolder.forEach(subfolder => {
            console.log(chalk.green(`#### Running ${program.folder}/${myWorkspace}/${subfolder}...`));
            //if a package.json file exists in the subfolder run the command
            if ( fileExists(`${program.folder}/${myWorkspace}/${subfolder}/package.json`) ) {

                //set the program variables

                var myPackage = `${program.folder}/${myWorkspace}/${subfolder}/package.json`
                var myLockfile = `${program.folder}/yarn.lock`
                var myWrite = `${program.folder}/${myWorkspace}/${subfolder}/yarn.lock`
                var myForce = 'true'

                console.log(chalk.green('###### package.json exists, create a yarn.lock file'))
                //run the command

                try {
                    const { inputLockfile, inputPackageJson } = getAndParseFiles(myLockfile, myPackage)
                    log('Using dev:', chalk.cyan(program.dev))
                    const lockfileString = generateLockfileString(
                        { ...inputPackageJson.dependencies, ...(program.dev ? inputPackageJson.devDependencies : {}) },
                        inputLockfile
                    )
                
                    if (myWrite) {
                        const lockWritePath = myWrite ? 'yarn.lock' : myWrite
                        const fileExists = fs.existsSync(myWrite)
                        if (fileExists && !myForce) {
                            console.error('Lockfile already exists at:', chalk.red(lockWritePath), `(Use --force to overwrite)`)
                            process.exit(1)
                        }
                        if (myForce && fileExists) {
                            console.log(chalk.yellow('Overwriting:'), chalk.red(myWrite))
                        }
                        console.log(chalk.yellow('Lockfile written to:'), chalk.blue(myWrite))
                        fs.writeFileSync(path.resolve(myWrite), lockfileString)
                    } else {
                        console.log(lockfileString)
                    }
                } catch (err) {
                    console.error('Error:', chalk.red(err))
                    process.exit(1)
                }
            }
            else {
                console.log(chalk.red('###### package.json does not exist, do not create a yarn.lock file'))
            }
        });
    }
    //for each dedicasted workspace run the command if the workspace doesn't hold an *
    else {
        //if a package.json file exists in the subfolder run the command
        if ( fileExists(`${program.folder}/${workspace}/package.json`) ) {



            //set the program variables

            var myPackage = `${program.folder}/${workspace}/package.json`
            var myLockfile = `${program.folder}/yarn.lock`
            var myWrite =`${program.folder}/${workspace}/yarn.lock`
            var myForce = 'true'

            console.log(chalk.green('###### package.json exists, create a yarn.lock file'))
            //run the command

            try {
                const { inputLockfile, inputPackageJson } = getAndParseFiles(myLockfile, myPackage)
                log('Using dev:', chalk.cyan(program.dev))
                const lockfileString = generateLockfileString(
                    { ...inputPackageJson.dependencies, ...(program.dev ? inputPackageJson.devDependencies : {}) },
                    inputLockfile
                )
            
                if (myWrite) {
                    const lockWritePath = myWrite ? 'yarn.lock' : myWrite
                    const fileExists = fs.existsSync(myWrite)
                    if (fileExists && !myForce) {
                        console.error('Lockfile already exists at:', chalk.red(lockWritePath), `(Use --force to overwrite)`)
                        process.exit(1)
                    }
                    if (myForce && fileExists) {
                        console.log(chalk.yellow('Overwriting:'), chalk.red(myWrite))
                    }
                    console.log(chalk.yellow('Lockfile written to:'), chalk.blue(myWrite))
                    fs.writeFileSync(path.resolve(myWrite), lockfileString)
                } else {
                    console.log(lockfileString)
                }
            } catch (err) {
                console.error('Error:', chalk.red(err))
                process.exit(1)
            }
        }
        else {
            console.log(chalk.red('###### package.json does not exist, do not create a yarn.lock file'))
        }
    }
    
});