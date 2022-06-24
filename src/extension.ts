// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from "vscode";

import { execSync } from "child_process";
import { dirname, basename } from "path";
import { match, P } from "ts-pattern";

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
  const ocamlformatPath: string = getValueFromConfig("ocamlformat-path");

  const command: string[] = [];
  if (getValueFromConfig<boolean>("eval-opam-env")) {
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
  return getFormattedText(content, fileName);
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

function removeComments(formattedText: string): string {
  let commentsCounter = 0;
  const parts: string[] = [];
  const tokens = tokenify(formattedText);
  console.log(tokens);
  for (const token of tokens) {
    match(token)
      .with({ type: "comOpen" }, () => {
        ++commentsCounter;
      })
      .with({ type: "comClose" }, () => {
        --commentsCounter;
      })
      .with({ type: "code", code: P.select() }, (code) => {
        if (commentsCounter === 0) {
          parts.push(code);
        }
      })
      .exhaustive();
  }
  return parts.join("");
}

type Token =
  | { type: "comOpen" }
  | { type: "comClose" }
  | { type: "code"; code: string };

function tokenify(text: string): Token[] {
  const comOpen = text.split(/\(\*/g);
  const tokens: Token[] = [];
  for (const el of comOpen) {
    const comClose = el.split(/\*\)/g);
    for (const code of comClose) {
      tokens.push({ type: "code", code });
      tokens.push({ type: "comClose" });
    }
    tokens.pop();
    tokens.push({ type: "comOpen" });
  }
  tokens.pop();
  return tokens;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { scheme: "file", language: "ocaml" },
      {
        provideDocumentFormattingEdits,
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "ocaml-formatter.runCodeFragment",
      runCodeFragment
    )
  );
}

function provideDocumentFormattingEdits(
  document: vscode.TextDocument
): vscode.TextEdit[] {
  const filePath = document.uri.fsPath;
  const profile: string = getValueFromConfig("profile");
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

function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("ocaml-formatter");
}

function getValueFromConfig<T>(name: string): T {
  return <T>getConfig().get(name);
}

function getDelay(): number {
  return getValueFromConfig("ocaml-repl-startup-delay");
}

async function runCodeFragment(editor: vscode.TextEditor) {
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  try {
    const ocamlScript = getTextForExecution(selectedText);
    const terminal = vscode.window.createTerminal("OCaml");
    terminal.sendText(`ocaml`);
    await delay(getDelay());
    terminal.sendText(ocamlScript);
    terminal.show();
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
