# Introduction

This extension doesn't provide ocaml support in vscode, install one of available extensions for that. It's sole purpose is to format the ocaml code

## Features

Formats your ocaml code

## Requirements

Install ocamlformat (https://github.com/ocaml-ppx/ocamlformat).
Add this line to settings (JSON)
	
"files.associations": {
	"*.ml": "ocaml",
	"*.mli": "ocaml"
}

## Extension Settings

This extension contributes the following settings:

* `ocaml-formatter.profile`: choose formatting profile

## Known Issues

Merlin sometimes marks code as invalid after formatting
