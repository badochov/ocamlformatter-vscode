// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// todo add suport for own formatting file
import * as vscode from 'vscode';

const { execSync } = require('child_process');


function callOcamlFormatCommand(filePath: string, profile: string, dir: string): any {
	const out = { formattedText: "", error: null };
	try {
		let profileString = '';
		if (profile !== "own") {
			profileString = `--profile=${profile}`;
		}
		out.formattedText = execSync(`cd ${dir} && ocamlformat --enable-outside-detected-project ${profileString} ${filePath}`).toString();
	}
	catch (error) {
		out.error = error.toString();
		console.log(error);
	}
	return out;
}

function createTempFile(content: string, path: string) {
	let out = { success: false, error: "" };
	const sanitizedContent = content.replace(/"/g, '\\"');
	try {
		console.log(path);
		execSync(`echo "${sanitizedContent}" > ${path}`);
		out.success = true;
	}
	catch (error) {
		out.error = error.toString();
		console.log(error);
	}
	return out;
}

function getFileDir(path: string) {
	let out = { success: false, error: "", path: "" };
	try {
		out.path = execSync(`dirname ${path}`).toString().split('\n')[0];
		out.success = true;
	}
	catch (error) {
		out.error = error.toString();
		console.log(error);
	}
	return out;
}

function removeTempFile(path: string) {
	let out = { success: false, error: "" };
	try {
		execSync(`rm "${path}"`);
		out.success = true;
	}
	catch (error) {
		out.error = error.toString();
		console.log(error);
	}
	return out;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'ocaml' }, {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {


			const dirObj = getFileDir(document.uri.fsPath);

			if (dirObj.success === false) {
				vscode.window.showErrorMessage(dirObj.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}
			const dir = dirObj.path;

			const tempFilePath = `${dir}/badochov.ocaml-formatter.temp.txt`;

			// const filePath = document.uri.fsPath;
			const writeTempFileOut = createTempFile(document.getText(), tempFilePath);

			if (writeTempFileOut.success === false) {
				vscode.window.showErrorMessage(writeTempFileOut.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}

			const settings = vscode.workspace.getConfiguration('ocaml-formatter');
			console.log(settings);
			const profile = settings.get("profile");

			const ocamlFormatResponse = callOcamlFormatCommand(tempFilePath, <string>profile, dir);

			console.log(ocamlFormatResponse);

			const fullText = document.getText();

			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(fullText.length)
			);

			if (ocamlFormatResponse.error !== null) {
				vscode.window.showErrorMessage(ocamlFormatResponse.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}

			const removed = removeTempFile(tempFilePath);

			if (removed.success !== true) {
				vscode.window.showErrorMessage(removed.error);
			}

			return [vscode.TextEdit.replace(fullRange, ocamlFormatResponse.formattedText)];
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
