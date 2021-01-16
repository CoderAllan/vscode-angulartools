import subprocess
import json
import re
from git import Repo, TagReference

def readVersionFromPackageJson() -> None:
    packageJson = open("package.json", "r")
    contentRaw = packageJson.read()
    contentJson = json.loads(contentRaw)
    packageJson.close()
    return contentJson["version"]

def isPackageJsonVersionTagged(repo, packageJsonVersion) -> bool:
    packageJsonVersionTagFound = False
    for tag in repo.tags:
        if tag.name == packageJsonVersion:
            packageJsonVersionTagFound = True
            break
    return packageJsonVersionTagFound

def isChangeLogUpdatedWithPackageJsonVersion(packageJsonVersion) -> bool:
    packageJsonVersionChangeLogEntryFound = False
    changeLog = open("CHANGELOG.md", "r")
    changeLogContent = changeLog.readlines()
    changeLog.close()
    for line in changeLogContent:
        match = re.search(f"^## Version {packageJsonVersion}$", line)
        if match:
            packageJsonVersionChangeLogEntryFound = True
            break
    return packageJsonVersionChangeLogEntryFound

def isAllPackagesInstalledLocally() -> bool:
    process = subprocess.Popen(["cmd", "/c", "npm", "list", "--production", "--parseable", "--depth=99999", "--loglevel=error"], stderr=subprocess.PIPE)
    out = process.stderr.read()
    return (len(out) == 0)


def packageExtension() -> bool:
    process = subprocess.Popen(["cmd", "/c", "vsce", "package"], stderr=subprocess.PIPE)
    out = process.stderr.read()
    return (len(out) == 0)

def main():
    packageJsonVersion = readVersionFromPackageJson()
    repo = Repo("./")
    packageJsonVersionTagFound = isPackageJsonVersionTagged(repo, packageJsonVersion)
    packageJsonVersionChangeLogEntryFound = isChangeLogUpdatedWithPackageJsonVersion(packageJsonVersion)
    allPackagesInstalledLocally = isAllPackagesInstalledLocally()

    if not packageJsonVersionChangeLogEntryFound:
        print("Fail: CHANGELOG.md not updated.")
    else:
        if not allPackagesInstalledLocally:
            print("Fail: Not all packages installed locally. Please run 'npm install' to install packages, or run 'npm list --production --parseable --depth=99999 --loglevel=error' to identify the issue.")
        else:
            if packageJsonVersionTagFound:
                print(f"Fail: Version already tagged: {packageJsonVersion}.")
                print("No vsix package created")
            else:
                print("Creating vsix package...")
                isPackagingOk = packageExtension()
                if not isPackagingOk:
                    print("Fail: Packaging failed.")
                else:
                    print(f"New version found in package.json: {packageJsonVersion}.")
                    print("Creating tag in Git...")
                    repo.create_tag(packageJsonVersion)

main()
