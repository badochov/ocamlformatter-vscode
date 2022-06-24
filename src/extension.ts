// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from "vscode";

import { execSync } from "child_process";
import { dirname, basename } from "path";

const profiles = ["conventional", "janestreet", "ocamlformat", "own"];

function callOcamlFormatCommand(
  content: string,
  fileName: string,
  dir: string,
  profile: string
): string {
  const cmd = buildCommand(fileName, profile);
  console.log(cmd);

  return execSync(cmd, {
    cwd: dir,
    input: content,
  }).toString();
}

function buildCommand(fileName: string, profile: string): string {
  const settings = vscode.workspace.getConfiguration("ocaml-formatter");
  const ocamlformatPath = <string>settings.get("ocamlformat-path");

  const command: string[] = [];
  if (settings.get("eval-opam-env")) {
    command.push("eval $(opam env --readonly)", "&&");
  }
  command.push(
    `${ocamlformatPath}`,
    `--name='${fileName}'`,
    "--enable-outside-detected-project"
  );
  if (profiles.includes(profile) && profile !== "own") {
    command.push(`--profile='${profile}'`);
  }
  command.push("-");
  return command.join(" ");
}

function formatOcamlFormatterError(error: Error) {
  return error
    .toString()
    .replace(/(\n|\r|.)*--enable-outside-detected-project .*? -/g, "");
}

function getTextForExecution(
  content: string,
  fileName: string = "ocaml-code.ml"
) {
  const formattedText = getFormattedText(content, fileName);
  const noCommentsText = formattedText.replace(/\(\*(.|\n|\r)*?\*\)/g, "");
  const preparedText = noCommentsText.replace(/\nlet/g, ";;\nlet");
  const sanitizedText = preparedText.replace(/\"/g, '\\"');
  const escapePercentageSign = sanitizedText.replace(/%/g, "%%");

  return escapePercentageSign;
}

function getFormattedText(content: string, fileName: string): string {
  const useRegex = /#use ".*?"(?= *(?:;;)?)/g;
  const uses = content.match(useRegex) ?? [];
  const output: string[] = [];
  const splitByUseContent = content.split(useRegex);
  for (const [i, part] of Object.entries(splitByUseContent)) {
    try {
      output.push(callOcamlFormatCommand(part, fileName, ".", "ocamlformat"));
    } catch (error) {
      throw new Error(formatOcamlFormatterError(<Error>error));
    }
    if (uses[parseInt(i)] !== undefined) {
      output.push(uses[parseInt(i)], "\n\n");
    }
  }
  output.push(";;");
  return output.join("");
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: "file", language: "ocaml" },
    {
      provideDocumentFormattingEdits,
    }
  );

  vscode.commands.registerCommand(
    "ocaml-formatter.runCodeFragment",
    runCodeFragment
  );
}

function provideDocumentFormattingEdits(
  document: vscode.TextDocument
): vscode.TextEdit[] {
  const filePath = document.uri.fsPath;

  const settings = vscode.workspace.getConfiguration("ocaml-formatter");
  const profile = <string>settings.get("profile");

  const fullText = document.getText();

  try {
    var ocamlFormatResponse = callOcamlFormatCommand(
      fullText,
      basename(filePath),
      dirname(filePath),
      profile
    );
  } catch (error) {
    return errorHandler(document, formatOcamlFormatterError(<Error>error));
  }

  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(fullText.length)
  );
  return [vscode.TextEdit.replace(fullRange, ocamlFormatResponse)];
}

function errorHandler(
  document: vscode.TextDocument,
  error: string
): vscode.TextEdit[] {
  vscode.window.showErrorMessage(error);
  return [vscode.TextEdit.insert(document.positionAt(0), "")];
}

function runCodeFragment() {
  // The code you place here will be executed every time your command is executed
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    vscode.window.showErrorMessage("Editor is undefined");
    return;
  }

  // Display a message box to the user
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  try {
    const ocamlScript = getTextForExecution(selectedText);

    const terminal = vscode.window.createTerminal("OCaml");
    terminal.show();

    terminal.sendText(`/usr/bin/env bash`);
    terminal.sendText(`(printf '${ocamlScript}'; rlwrap cat) | ocaml`);
  } catch (e) {
    if (e instanceof Error) {
      vscode.window.showErrorMessage(e.toString());
    } else {
      vscode.window.showErrorMessage(String(e));
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
