// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const { execSync } = require('child_process');


function callOcamlFormatCommand(filePath:string,profile:string):any{
	const out = {formattedText:"",error:null};
    try{
        out.formattedText = execSync(`ocamlformat --enable-outside-detected-project --profile=${profile} ${filePath}`).toString();
    }
    catch (error){
        out.error =  error.toString();
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
			const filePath = document.uri.fsPath;

			const settings = vscode.workspace.getConfiguration('ocaml-formatter');
			console.log(settings);
			const profile = settings.get("profile");

			const ocamlFormatResponse = callOcamlFormatCommand(filePath,<string>profile);

			console.log(ocamlFormatResponse);
			
			const fullText = document.getText();

			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(fullText.length)
			);

			if(ocamlFormatResponse.error !== null ){
				vscode.window.showInformationMessage(ocamlFormatResponse.error);
				return [vscode.TextEdit.insert(document.positionAt(0),"")];
			}
		  return [vscode.TextEdit.replace(fullRange, ocamlFormatResponse.formattedText)];
		}
	  });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.formatOCaml', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
