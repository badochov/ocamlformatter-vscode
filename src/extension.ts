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

function escapeSpaces(string: string) {
	return string.replace(/(?= )/g, "\\");
}

function callOcamlFormatCommand(content: string, fileName: string, dir: string, profile: string): any {
	const out = { text: "", error: null };
	try {
		const sanitizedContent = content.replace(/"/g, '\\"');
		let profileString = '';
		if (profiles.includes(profile)) {
			if (profile !== "own") {
				profileString = `--profile=${profile}`;
			}
		}
		console.error(`cd ${dir} && echo "${sanitizedContent}" | ocamlformat --name=${fileName} --enable-outside-detected-project ${profileString} -`);
		out.text = execSync(`cd ${dir} && echo "${sanitizedContent}" | ocamlformat --name=${fileName} --enable-outside-detected-project ${profileString} -`).toString();
	}
	catch (error) {
		out.error = error.toString();
		console.log(error);
	}
	return out;
}


function getTextForExecution(content: string, fileName: string = "ocaml-code") {

	const useRegex = /#use ".*?"(?= *(?:;;)?)/g;
	const uses = content.match(useRegex);
	const usesArray = uses ? uses : [];
	console.log(content);
	let output = "";
	const splitByUseContent = content.split(useRegex);
	console.log(splitByUseContent);
	for (const [i, part] of Object.entries(splitByUseContent)) {
		const ocamlFormatResponse = callOcamlFormatCommand(part, fileName, ".", "ocamlformat");
		if (ocamlFormatResponse.error !== null) {
			vscode.window.showErrorMessage(ocamlFormatResponse.error);
			throw new Error("Formatting error exception");
		}
		output += ocamlFormatResponse.text;
		if (usesArray[parseInt(i)] !== undefined) {
			output += usesArray[parseInt(i)] + "\n\n";
		}
	}
	const formattedText = output + ";;";
	console.log(formattedText);
	const noCommentsText = formattedText.replace(/\(\*(.|\n|\r)*?\*\)/g, "");
	const preparedText = noCommentsText.replace(/\nlet/g, ";;\nlet");
	const sanitizedText = preparedText.replace(/\"/g, "\\\"");
	const escapePercentageSign = sanitizedText.replace(/%/g, "%%");
	console.log(escapePercentageSign);
	return escapePercentageSign;
}

function getFileDir(path: string) {
	let out = { success: false, error: "", path: "" };
	try {
		out.path = escapeSpaces(execSync(`dirname ${path}`).toString().split('\n')[0]);
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
		out.path = escapeSpaces(execSync(`basename "${path}"`).toString().split('\n')[0]);
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
			const filePath = escapeSpaces(document.uri.fsPath);

			const dirObj = getFileDir(filePath);

			if (dirObj.success === false) {
				vscode.window.showErrorMessage(dirObj.error);
				return [vscode.TextEdit.insert(document.positionAt(0), "")];
			}
			const dir = dirObj.path;

			const fileNameObj = getFileName(filePath);

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

			return [vscode.TextEdit.replace(fullRange, ocamlFormatResponse.text)];
		}
	});

	vscode.commands.registerCommand('ocaml-formatter.runCodeFragment', () => {
		// The code you place here will be executed every time your command is executed
		const editor = vscode.window.activeTextEditor;
		if (editor !== undefined) {
			// Display a message box to the user
			const selection = editor.selection;
			const selectedText = editor.document.getText(selection);
			try {
				let ocamlScript = getTextForExecution(selectedText);

				const terminal = vscode.window.createTerminal("OCaml ");
				terminal.show();
				// terminal.sendText(`printf "${ocamlScript}"`);

				terminal.sendText(`(printf "${ocamlScript}"; rlwrap cat) | ocaml`);
			}
			catch (e) {
				vscode.window.showErrorMessage(e);
			}

		}
		else {
			vscode.window.showErrorMessage("Editor is undefined");
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }

