---
author: minko_gechev
categories:
- Go
- Static analysis
- Linting
- Tooling
- Compilers
- Revive
date: 2018-05-28T00:00:00Z
draft: false
tags:
- Go
- Static analysis
- Linting
- Tooling
title: Fast, extensible, configurable, and beautiful linter for Go
og_image: /images/revive/revive.png
url: /2018/05/28/revive-golang-golint-linter
---

About a year ago I decided to polish my Go skills. Although the language is pretty small compared to most others that I use on a daily basis, it still has some useful syntax constructs that I didn't use enough. What a better way to brush up your skills in a programming language other than building tools with it...for analyzing programs written in it?

<div style="background-color: rgba(33, 150, 243, 0.1); padding: 20px;">
You can find <strong>revive</strong> on GitHub at <a href="https://github.com/mgechev/revive">github.com/mgechev/revive</a>.
</div>

<img src="/images/revive/demo.svg" alt="Revive demo" style="width: 100%; display: block; margin: auto">

# Introducing Revive

When I started using Go, a few years ago, I noticed how opinionated the ecosystem was. First, the syntax of the language is very minimalistic. Such property reduces the expressiveness but also makes the code much easier to read, compared to languages such as Perl and Ruby.

<img src="/images/revive/gopher.jpg" alt="Gopher" style="width: 350px; display: block; margin: auto">

Second, the "tabs vs. spaces" debate is not relevant in the Go world. We all use tabs. That's it. Do I prefer tabs over spaces? It doesn't matter - `gofmt` already picked tabs for me. I also noticed that there's `golint`. It's a tool which enforces semantical & syntactical practices. There are few things in `golint` different from most linters, I've used in the past:

- It's not extensible. You can't include/exclude rules, and the project is not wide open for new rules.
- It doesn't let us disable rules for specific files or a range of lines in a file.
- In `golint` failures have a level of confidence. Sometimes failures are false negatives.

The Go team is keeping the tool opinionated and minimalistic. It follows the Go philosophy, and I respect that. The closed scope of the project has few interesting implications:

- Development of many small tools which perform commonly needed analysis ([`deadcode`](https://github.com/tsenart/deadcode), [`gocyclo`](https://github.com/alecthomas/gocyclo), [`check`](https://github.com/opennota/check), [`errcheck`](https://github.com/kisielk/errcheck), [`megacheck`](https://github.com/dominikh/go-tools/tree/master/cmd/megacheck), [`dupl`](https://github.com/mibk/dupl), [`ineffassign`](https://github.com/gordonklaus/ineffassign), [`interfacer`](https://github.com/mvdan/interfacer), [`unconvert`](https://github.com/mdempsky/unconvert), [`goconst`](https://github.com/jgautheron/goconst), etc)
- [Hacky solutions](https://github.com/golang/lint/blob/85993ffd0a6cd043291f3f63d45d656d97b165bd/lint.go#L123-L134) for ignoring files
- Development of [`gometalinter`](https://github.com/alecthomas/gometalinter) which wraps most existing tools by invoking them internally and consuming their output. The tool provides a way to filter the produced reports

<img src="/images/revive/revive.png" alt="Logo of Revive" style="width: 350px; display: block; margin: auto">
<div style="margin-top: 20px; font-size: 12px; text-align: center">The logo of revive by <a href="https://github.com/hawkgs">Georgi Serev</a></div>

That's why I decided to make my toy linter project public and share it with the community. **`Revive` implements all the rules which `golint` has and the failures have the same concept of "confidence" that `golint` introduced**. In fact, invoking `revive` with no flags has the same behavior as `golint`, with the difference that it runs faster. `Revive` builds on top of `golint` by:

- Allowing us to enable or disable rules using a configuration file.
- Allowing us to configure the linting rules with a TOML file.
- Providing functionality for disabling a specific rule or the entire linter for a file or a range of lines.
  - `golint` allows this only for generated files.
- Providing multiple formatters which let us customize the output.
- Allowing us to customize the return code for the entire linter or based on the failure of only some rules.
- *Everyone can extend it easily with custom rules or formatters.*
- `Revive` provides more rules compared to `golint`.
- `Revive` runs faster. It runs the rules over each file in a separate goroutine.

**I love the opinionated culture in the Go community. I believe that this is the right direction which lets us focus on the important things instead of losing time in discussions on trivial matters. That's why with `revive`, we can make even more syntax-related arguments irrelevant by defining more opinionated rules and providing stricter presets.**

Later, I'll explain how we can quickly develop more rules for `revive` but before that, let me share a few instructions on how you can use the linter!

## Usage

Install `revive` with:

```bash
go get github.com/mgechev/revive
```

The command above adds the `revive` binary under `$GOPATH/bin`.

Using the tool with no flags has the same behavior as `golint`. The magic happens when we add the `-formatter` flag:

<img src="/images/revive/friendly.svg" alt="Friendly formatter" style="width: 100%; display: block; margin: auto">

From the image above, we can see that we got 31 warnings for the `"exported"` rule. This rule is port of a built-in rule from `golint` which enforces practices for exported symbols (find the full set of rules [here](https://github.com/mgechev/revive#available-rules)).

If we prefer to ignore these warnings for the entire project, we can use a config file in TOML format:

<img src="/images/revive/editconfig.svg" alt="Edit config" style="width: 100%; display: block; margin: auto">

What if we want to disable a specific rule for only part of the file? In such case, we can use the following technique:

```go
package models

// revive:disable
type Expression struct {
    Value      string
    IsStar     bool
    IsVariadic bool
    IsWriter   bool
    Underlying string
}
// revive:enable
```

The annotations above disables all `revive` rules for the entire struct. In case we prefer to disable only the `exported` rule, we should use:

```go
package models

// revive:disable:exported
type Expression struct {
    Value      string
    IsStar     bool
    IsVariadic bool
    IsWriter   bool
    Underlying string
}
// revive:enable:exported
```

Finally, if we want to ignore all files from a directory, we can use the `-exclude` flag:

```shell
revive -exclude tests/... ./...
```

The command above will lint all files from the current directory, excluding all files in `tests`, recursively. If we want to exclude more than one directory use:

```shell
revive -exclude tests/... -exclude utils/... ./...
```

### Configurability

In an image in the last section, we saw that by using a config file in TOML format, we could configure the execution of `revive`. Here's an example config file:

```text
# Ignores files with "GENERATED" header, similar to golint
ignoreGeneratedHeader = true

# Sets the default severity to "warning"
severity = "warning"

# Sets the default failure confidence. The semantics behind this property
# is that revive ignores all failures with a confidence level below 0.8.
confidence = 0.8

# Sets the error code for failures with severity "error"
errorCode = 0

# Sets the error code for failures with severity "warning"
warningCode = 0

# Configuration of the `cyclomatic` rule. Here we specify that
# the rule should fail if it detects code with higher complexity than 10.
[rule.cyclomatic]
  arguments = [10]

# Sets the severity of the `package-comments` rule to "error".
[rule.package-comments]
  severity = "error"
```

Let's quickly go over the individual properties.

- `ignoreGeneratedHeader` - `golint` ignores files which have header `GENERATED`. To disable this behavior, set the flag to `false`.
- `severity` - `revive` has two types of severity - `warning` and `error`. This way we can distinguish between critical failures with high confidence level and such with lower.
- `confidence` - similarly to `golint`, `revive` lets us assign a confidence level to rules which may return false negatives. The `confidence` property lets us filter failures below given confidence level.
- `errorCode` and `warningCode` - these two properties let us have different return codes for the different severities. We may want your errors to fail the CI but our warnings not to.

The remaining lines are related to rule configuration. **Each rule can be configured** by setting its arguments and its severity. For example, the rule for cyclomatic complexity above, fails if in our codebase there's a construction which exceeds the cyclomatic complexity of 10.

<img src="/images/revive/looking-upwards.jpg" alt="Gopher" style="width: 350px; display: block; margin: auto">

## Extensibility and Contributions

Initially, I wanted to let developers use be able to create external plugins which later could be referenced by the configuration file and loaded dynamically. Unfortunately, `-buildmode=plugin` has very [limited support with known issues](https://golang.org/pkg/plugin/).

Ignoring this limitation, there are other two easy ways to add new rules and run them against your code:

- Contribute to the project - `revive` is open for external contributions. If a rule makes sense and passes its unit tests, it's more than welcome to become part of `revive`! On top of that, creating a new rule is just a matter of implementing this simple interface:

```go
type Rule interface {
    Name() string
    Apply(*File, Arguments) []Failure
}
```

- Fork the project and push the rules there. If you think your rules won't apply to others (although the chances are that they will), you can fork `revive` and not push them upstream. Just make sure that you sync your code with upstream once in a while to get all the new features and bug fixes from there!

Keep in mind that to create a rule you don't have to be familiar with the entire codebase. All rules are well encapsulated into visitors with simple interface. A sample implementation of `arguments-limit` could be found [here](https://github.com/mgechev/revive/blob/b754e5414caec17f6465692421b87c5ef38aa113/rule/argument-limit.go).

**What about formatters?**

Well, creating a new formatter is as simple as creating a new rule. Just implement the following interface:

```go
type Formatter interface {
    Format(<-chan Failure, RulesConfig) (string, error)
    Name() string
}
```

Here you can find a sample implementation of a [JSON formatter](https://github.com/mgechev/revive/blob/b754e5414caec17f6465692421b87c5ef38aa113/formatter/json.go).

## Performance

I run some basic benchmarks to compare the performance of `golint` and `revive`. Here's what I found out after running both linters against `kubernetes`:

```shell
time golint be/…
real    0m25.389s
user    0m29.221s
sys     0m3.065s
```

```shell
time revive be/…
real    0m6.524s
user    0m22.882s
sys     0m1.114s
```

Since **`revive`** lints the individual files in separate goroutines, it **outperforms `golint` about 4 times**.

## Conclusion

`Revive` is a simple, fast, configurable, extensible, flexible, and beautiful linter for Go. It runs the linting rules on top of each file in a separate goroutine which improves the performance significantly. `Revive` lets us configure the individual rules and disable them for the entire project, individual files, or range of lines within a file. Last but not least, `revive` lets us use a set of built-in formatters which output the failures in a digestible, accessible, and easy to consume format.

The project is continuously evolving and open for new contributions in the form of new rules, formatters, or bug fixes! If you want to create an even stricter linting preset, cut the coding style discussions in your team to the minimum, and focus on the essential things, `revive` may help.

<img src="/images/revive/gopher.png" alt="Drop mic" style="width: 350px; display: block; margin: auto">

