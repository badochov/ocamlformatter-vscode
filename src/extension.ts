// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from "vscode";

import { execSync } from "child_process";

const profiles = [
  "conventional",
  "janestreet",
  "sparse",
  "compact",
  "ocamlformat",
  "own",
];

interface ocamlformatCallOutput {
  text: string;
  error: null | string;
}

function callOcamlFormatCommand(
  content: string,
  fileName: string,
  dir: string,
  profile: string
): ocamlformatCallOutput {
  const out: ocamlformatCallOutput = { text: "", error: null };
  try {
    const sanitizedContent = content.replace(/'/g, "'\\''");

    const settings = vscode.workspace.getConfiguration("ocaml-formatter");
    const ocamlformatPath = <string>settings.get("ocamlformat-path");

    let command = "";
    if (settings.get("eval-opam-env")) {
      command += "eval $(opam env --readonly) && ";
    }
    command += `${ocamlformatPath} --name='${fileName}' --enable-outside-detected-project`;
    if (profiles.includes(profile) && profile !== "own") {
      command = command.concat(` --profile='${profile}'`);
    }
    command += " -";
    console.log(command);
    out.text = execSync(command, {
      cwd: dir,
      input: sanitizedContent,
    }).toString();
  } catch (error) {
    out.error = error.toString();
    console.error(error);
  }
  return out;
}

function formatOcamlFormatterError(error: string) {
  const formatted = error.replace(
    /(\n|\r|.)*--enable-outside-detected-project .*? -/g,
    ""
  );
  return formatted;
}

function getTextForExecution(
  content: string,
  fileName: string = "ocaml-code.ml"
) {
  const useRegex = /#use ".*?"(?= *(?:;;)?)/g;
  const uses = content.match(useRegex);
  const usesArray = uses ? uses : [];
  let output = "";
  const splitByUseContent = content.split(useRegex);
  for (const [i, part] of Object.entries(splitByUseContent)) {
    const ocamlFormatResponse = callOcamlFormatCommand(
      part,
      fileName,
      ".",
      "ocamlformat"
    );
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
  const noCommentsText = formattedText.replace(/\(\*(.|\n|\r)*?\*\)/g, "");
  const preparedText = noCommentsText.replace(/\nlet/g, ";;\nlet");
  const sanitizedText = preparedText.replace(/\"/g, '\\"');
  const escapePercentageSign = sanitizedText.replace(/%/g, "%%");

  return escapePercentageSign;
}

interface getPathInterface {
  error: null | string;
  path: string;
}

function getFileDir(path: string): getPathInterface {
  let out = { error: null, path: "" };
  try {
    out.path = execSync(`dirname '${path}'`).toString().split("\n")[0];
  } catch (error) {
    out.error = error.toString();
    console.error(error);
  }
  return out;
}

function getFileName(path: string): getPathInterface {
  let out = { error: null, path: "" };
  try {
    out.path = execSync(`basename '${path}'`).toString().split("\n")[0];
  } catch (error) {
    out.error = error.toString();
    console.error(error);
  }
  return out;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: "file", language: "ocaml" },
    {
      provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): vscode.TextEdit[] {
        const filePath = document.uri.fsPath;

        const dirObj = getFileDir(filePath);

        if (dirObj.error !== null) {
          vscode.window.showErrorMessage(dirObj.error);
          return [vscode.TextEdit.insert(document.positionAt(0), "")];
        }
        const dir = dirObj.path;

        const fileNameObj = getFileName(filePath);

        if (fileNameObj.error !== null) {
          vscode.window.showErrorMessage(fileNameObj.error);
          return [vscode.TextEdit.insert(document.positionAt(0), "")];
        }
        const fileName = fileNameObj.path;

        const settings = vscode.workspace.getConfiguration("ocaml-formatter");
        const profile = <string>settings.get("profile");

        const fullText = document.getText();

        const ocamlFormatResponse = callOcamlFormatCommand(
          fullText,
          fileName,
          dir,
          profile
        );

        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(fullText.length)
        );

        if (ocamlFormatResponse.error !== null) {
          vscode.window.showErrorMessage(
            formatOcamlFormatterError(ocamlFormatResponse.error)
          );
          return [vscode.TextEdit.insert(document.positionAt(0), "")];
        }

        return [vscode.TextEdit.replace(fullRange, ocamlFormatResponse.text)];
      },
    }
  );

  vscode.commands.registerCommand("ocaml-formatter.runCodeFragment", () => {
    // The code you place here will be executed every time your command is executed
    const editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
      // Display a message box to the user
      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      try {
        let ocamlScript = getTextForExecution(selectedText);

        const terminal = vscode.window.createTerminal("OCaml");
        terminal.show();
        // terminal.sendText(`printf "${ocamlScript}"`);

        terminal.sendText(`/usr/bin/env bash`);
        terminal.sendText(`(printf '${ocamlScript}'; rlwrap cat) | ocaml`);
      } catch (e) {
        vscode.window.showErrorMessage(e);
      }
    } else {
      vscode.window.showErrorMessage("Editor is undefined");
    }
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
