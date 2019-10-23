// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// todo add suport for own formatting file
import * as vscode from 'vscode';

const { execSync } = require('child_process');
const profiles = [
	"conventional",
	"janestreet",
	"sparse",
	"compact",
	"ocamlformat",
	"own"
];

function callOcamlFormatCommand(content: string, fileName: string, dir: string, profile: string): any {
	const out = { formattedText: "", error: null };
	try {
		const sanitizedContent = content.replace(/"/g, '\\"');
		let profileString = '';
		if (profiles.includes(profile)) {
			if (profile !== "own") {
				profileString = `--profile=${profile}`;
			}
		}
		out.formattedText = execSync(`cd ${dir} && echo "${sanitizedContent}" | ocamlformat --name=${fileName} --enable-outside-detected-project ${profileString} -`).toString();
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

function getFileName(path: string) {
	let out = { success: false, error: "", path: "" };
	try {
		out.path = execSync(`basename "${path}"`).toString().split('\n')[0];
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
			const fullPath = document.uri.fsPath;

			const dirObj = getFileDir(fullPath);

			if (dirObj.success === false) {
				vscode.window.showErrorMessage(dirObj.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}
			const dir = dirObj.path;

			const fileNameObj = getFileName(document.uri.fsPath);

			if (fileNameObj.success === false) {
				vscode.window.showErrorMessage(fileNameObj.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}
			const fileName = fileNameObj.path;

			const settings = vscode.workspace.getConfiguration('ocaml-formatter');
			const profile = settings.get("profile");

			const fullText = document.getText();

			const ocamlFormatResponse = callOcamlFormatCommand(fullText, fileName, dir, <string>profile);

			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(fullText.length)
			);

			if (ocamlFormatResponse.error !== null) {
				vscode.window.showErrorMessage(ocamlFormatResponse.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}

			return [vscode.TextEdit.replace(fullRange, ocamlFormatResponse.formattedText)];
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
