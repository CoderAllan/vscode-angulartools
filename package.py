import os
import json
import re
from git import Repo, TagReference

def readVersionFromPackageJson():
  packageJson = open("package.json", "r")
  contentRaw = packageJson.read()
  contentJson = json.loads(contentRaw)
  packageJson.close()
  return contentJson["version"]

def isPackageJsonVersionTagged(repo, packageJsonVersion):
  packageJsonVersionTagFound = False
  for tag in repo.tags:
    if tag.name == packageJsonVersion:
      packageJsonVersionTagFound = True
      break
  return packageJsonVersionTagFound

def isChangeLogUpdatedWithPackageJsonVersion(packageJsonVersion):
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

def packageExtension():
  os.system("vsce package")

def main():
  packageJsonVersion = readVersionFromPackageJson()
  repo = Repo("./")
  packageJsonVersionTagFound = isPackageJsonVersionTagged(repo, packageJsonVersion)
  packageJsonVersionChangeLogEntryFound = isChangeLogUpdatedWithPackageJsonVersion(packageJsonVersion)

  if not packageJsonVersionChangeLogEntryFound:
    print("Fail: CHANGELOG.md not update!")
  else:
    if not packageJsonVersionTagFound:
      print(f"New version found in package.json: {packageJsonVersion}.")
      print("Creating tag in Git...")
      repo.create_tag(packageJsonVersion)
      print("Creating vsix package...")
      packageExtension()
    else:
      print(f"Fail: Version already tagged: {packageJsonVersion}.")
      print("No vsix package created")
  
main()
