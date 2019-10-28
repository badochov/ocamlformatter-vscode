# Introduction

Extension to format ocaml code and run it in interactive terminal.

This extension doesn't provide ocaml support in vscode, install one of available extensions for that.

## Features

Formats your ocaml code.
It formats your code predictably and folowing your favourite rules.
You can add your own formatting guidlines by either choosing one of preset profiles or making your own.
To make your own profile choose profile "own" and add formatting guidelines in .ocamlformat file in project's root as defined in ocamlformat docs. 

You can select fragment of code and run it in the ocaml interactive terminal in the vscode terminal by right clicking after selecting and choosing "Run code fragment in interactive console"

## Requirements
You must have installed:
* OCaml
* ocamlformat (https://github.com/ocaml-ppx/ocamlformat).

## Extension Settings

This extension contributes the following settings:

* `ocaml-formatter.profile`: choose formatting profile

## Known Issues

Merlin sometimes marks code as invalid after formatting
