# Introduction

This extension doesn't provide ocaml support in vscode, install one of available extensions for that. It's sole purpose is to format the ocaml code

## Features

Formats your ocaml code.
You can add your own formatting guidlines by either choosing one of preset profiles or making your own.
To make your own profile choose profile "own" and add formatting guidelines in .ocamlformat file in project's root as defined in ocamlformat docs. 

## Requirements

Install ocamlformat (https://github.com/ocaml-ppx/ocamlformat).

## Extension Settings

This extension contributes the following settings:

* `ocaml-formatter.profile`: choose formatting profile

## Known Issues

Merlin sometimes marks code as invalid after formatting
