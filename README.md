# Generate Yarn Lockfiles

### Description
This package allows you to generate a new yarn.lock file from an existing yarn.lock file and package.json for yarn workspace environments to be scannable with Veracode SCA solution.  
The problem is that ther will be no yarn.lock file in any of the workspaaces. This toll will create a new yarn.lock file in each workspace which will make it scannable with Veracodes SCA solution.

### Usage
```
  Usage: dist/index.js --folder <ROOT_FOLDER> 
 ```

### What it will do
1. It will scan the package.json file in the root folder and all subfolders for workspaces
2. It will create a new yarn.lock file in each workspace folder
3. It will add all dependencies from the root package.json file and the workspace package.json file to the workspace yarn.lock file

It will also create entries for other workspaces referenced in the same yarn workspace, howerver it won't create entries for those transitive dependencies.

It supports workspace entries in both formats:
```
"workspaces": {
    "packages": [
      "packages/*"
    ]
  },
```
and
```
"workspaces": {
    "packages": [
      "packages/folder"
    ]
  },
```

Once the yarn.lock files are generated run your SCA scan this way
```
srcclr scan . --recursive --scan-collectors yarn
```

### The output
The output of the run will look similar to this:
```
node dist/index.js --folder '/yarn-workspaces-example'
## WORKSPADCES: ["packages/*"]

## Running /yarn-workspaces-example/packages/*...
#### SUBFOLDER: ["a","b"]
#### Running /yarn-workspaces-example/packages/a...
###### package.json exists, create a yarn.lock file
Overwriting: /yarn-workspaces-example/packages/a/yarn.lock
Lockfile written to: /yarn-workspaces-example/packages/a/yarn.lock
#### Running /yarn-workspaces-example/packages/b...
###### package.json exists, create a yarn.lock file
Lockfile written to: /yarn-workspaces-example/packages/b/yarn.lock
```

### Building
To create the package run
```
ncc build src/entry.ts
```