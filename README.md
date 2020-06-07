# Introduction

Extension to format ocaml code and run it in interactive terminal.

This extension doesn't provide ocaml support in vscode, install one of available extensions for that.

It's wrapper for ocamlformat.

## Features

Formats your ocaml code.
It formats your code predictably and following your favourite rules.
You can add your own formatting guidlines by either choosing one of preset profiles or making your own.
To make your own profile choose profile "own" and add formatting guidelines in `.ocamlformat` file in project's root as defined in ocamlformat docs.

You can select fragment of code and run it in the ocaml interactive terminal in the vscode terminal by right clicking after selecting and choosing "Run code fragment in interactive console"

## Requirements

You must have installed:

- OCaml
- [ocamlformat](https://github.com/ocaml-ppx/ocamlformat) installed preferably globally otherwise set path to it in `ocamlformat-path` setting

## Extension Settings

This extension contributes the following settings:

- `ocaml-formatter.profile`: choose formatting profile
- `ocaml-formatter.ocamlformat-path`: choose path to ocamlformat if it's not installed globally, path must be safe to use (eg no unsanitized spaces)
- `ocaml-formatter.eval-opam-env`: evals opam env at every run if set to true, [useful if use have ocamlformat installed locally](https://github.com/badochov/ocamlformatter-vscode/issues/2#issuecomment-640237333)

## Known Issues

- Merlin sometimes marks code as invalid after formatting
- Doesn't or not always work on WSL, possible fix is to set path to `ocamlformat` manually
