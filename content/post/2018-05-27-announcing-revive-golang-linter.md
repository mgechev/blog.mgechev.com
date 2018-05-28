---
author: minko_gechev
categories:
- Go
- Static analysis
- Linting
- Tooling
- Compilers
date: 2018-05-27T00:00:00Z
draft: true
tags:
- Go
- Static analysis
- Linting
- Tooling
title: Announcing Revive - fast, extensible, configurable, and beautiful linter for Go
og_image: /images/revive/revive.png
url: /2018/05/27/announcing-revive-golang-linter
---

About a year ago I decided to polish my Go skills. Although the language is pretty small compared to most other languages I used on a daily basis, it still has some useful syntax constructs that I didn't use enough. What a better way to brush up your skills in a programming language other than building tools with it...for analyzing programs written with it?

# Introducing Revive

When I started using Go, a few years ago, I noticed how opinionated the ecosystem was. First, the syntax is very minimalistic. Such property reduces expressiveness but also makes the code much easier to read, compared to languages such as Perl and Ruby.

Second, the "tabs vs. spaces" debate is not relevant in the Go world. You use tabs. That's it. Do I prefer tabs over spaces? I don't care - `gofmt` does the choice for me. I also noticed that there's `golint`. It's a nice tool which enforces semantical & syntactical practices. There are few things in `golint` different from most linters, I've used in the past:

- `golint` is not extensible.
- `golint` doesn't let you disable rules for a specific file or a range of lines in a file.
- In `golint` failures have a level of confidence. Sometimes a failure can return a false negative.

The Go team is keeping the tool opinionated and minimalistic. It follows the Go philosophy, and I respect that. The closed scope of the project has few interesting implications:

- Development of many small tools which perform analysis that developers often need ([`deadcode`](https://github.com/tsenart/deadcode), [`gocyclo`](https://github.com/alecthomas/gocyclo), [`check`](https://github.com/opennota/check), [`errcheck`](https://github.com/kisielk/errcheck), [`megacheck`](https://github.com/dominikh/go-tools/tree/master/cmd/megacheck), [`dupl`](https://github.com/mibk/dupl), [`ineffassign`](https://github.com/gordonklaus/ineffassign), [`interfacer`](https://github.com/mvdan/interfacer), [`unconvert`](https://github.com/mdempsky/unconvert), [`goconst`](https://github.com/jgautheron/goconst), etc)
- [Hacky solutions](https://github.com/golang/lint/blob/85993ffd0a6cd043291f3f63d45d656d97b165bd/lint.go#L123-L134) for ignoring files
- Development of [gometalinter](https://github.com/alecthomas/gometalinter) which wraps most existing tools by invoking them internally and consuming their output. The tool provides a way to filter the produced report

That's how I decided to make my toy linter project public and share it with the community. Revive implements all the rules which `golint` has and the failures have the same concept of "confidence" that `golint` introduces. The default behavior of revive is the same as `golint`, with the difference that it runs faster. Revive builds on top of `golint` by:

- Allows us to enable or disable rules using a configuration file.
- Allows us to configure the linting rules with a TOML file.
- Provides functionality for disabling a specific rule or the entire linter for a file or a range of lines.
  - `golint` allows this only for generated files.
- Provides multiple formatters which let us customize the output.
- Allows us to customize the return code for the entire linter or based on the failure of only some rules.
- Open for the addition of new rules or formatters.
- Provides more rules compared to `golint`.
- Faster. It runs the rules over each file in a separate goroutine.

**I love the opinionated culture in the Go community. I believe that this is the right direction which lets us focus on the important things instead of losing time in discussions on trivial matters. That's why with revive, we can make even more syntax-related arguments relevant by defining more custom rules.**

Later, I'll explain how we can quickly develop more rules for revive but before that, let me provide a few instructions on how you can use the linter!

## Usage

## Contributions

## Conclusion
