---
title: VR as an IDE
author: minko_gechev
layout: post
categories:
  - VR
  - WebVR
  - IDE
  - Angular
tags:
  - Source code visualization
  - VR
  - WebVR
  - IDE
---

In the first part of this blog post I've discussed the idea for using virtual reality for gamification of manual tasks in the software development process. I describe a demo project which allows source code visualization and manipulation in a generated virtual reality. The initial presentation of the demo project was on [ngconf 2017](https://ng-conf.org/), and its extension on [AngularUP 2017](https://angularup.com/) during my talk "Mad Science with the Angular Compiler"

The second part of the post describes a simple implementation of the VR-based source code manipulator.

## Background

The purpose of my "Mad Science with the Angular Compiler" talk is to demonstrate how the Angular's metadata collector and ASTs produced by the frontend of the TypeScript compiler, Angular template, expression and CSS parsers, can be used for source code analysis and visualization.

A few months ago, I created a wrapper around the Angular compiler, which provides higher-level API that by an entry point of a project (`tsconfig.json`), collects the metadata for all the components, pipes and providers. I called this library [ngast](https://github.com/mgechev/ngast), because on top of the metadata collection it also returns the ASTs of components' templates, styles, as well as the TypeScript AST nodes, corresponding to the individual symbols.

Based on [ngast](https://github.com/mgechev/ngast), I created a tool for reverse engineering of Angular applications called [ngrev](https://github.com/mgechev/ngrev). An Electron application which provides different views to the project, sorted by abstraction level.

[ngrev](https://github.com/mgechev/ngrev) is already useful, however, I wanted to go one step further and provide a more fun demo. That's why for [ngconf](https://ng-conf.org/), I developed an unconventional compiler which from an Angular application produces a WebVR, build with [aframe](https://aframe.org). The VR is produced by the following rules:

- The virtual world corresponds to the entire application, composed by the Angular modules.
- Each module is represented by a "garden".
- The trees in the gardens are the components of the application.
- Each tree has a crown which consists of blocks. Each block is a template element.
- The blocks have different colors depending on whether they represent an Angular component or a plain HTML element.

## Open questions

While I was building this demo, I had three questions:

- Can we make the visualization interactive and propagate changes in the virtual world to the application's source code?
- Can we use VR for meaningful source code visualization? Obviously, although fun, the demo application doesn't provide a lot of value.
- Can we solve real-life problems this way?

Since tree-shaking is a [big thing in the JavaScript world](LINK), and I already had the trees, for [AngularUP](https://angularup.com/) I introduced the shaking part. In order to make it more memorable, I created a lightweight server which accepts commands from the virtual reality and modifies the source code. For the purpose of the demo, we can tree-shake a tree and drop its leaves, one by one.

After one of the Angular SF meetups, I had a chat with [Shawn](LINK) who told me that after watching my talk on ngconf, he thought about extending the demo and building a Minecraft-like IDE where one can plant trees (i.e. create components), create gardens (add modules), etc. Abstractly thinking, this can be considered as gamification of parts of the software development process. After chatting with Shawn I found that through gamification, in a week, was solved an NP-complete protein folding problem <a href=""><sup>[1]</sup></a>. Although the software development process involves some creativity and cannot be completely automated, at this point, there are manual talks which do not. Is it possible to extract them and put them into a gamified environment.

Researching the topic further, I found that there was a published paper from the University of Michigan, related to visualization of object-oriented source code in the three dimensional space <a href=""><sup>[2]</sup></a>, and there's a startup working in this area <a href=""><sup>[2]</sup></a>.

## Conclusions

TBD

## Sample Implementation

Since looking in the code is always fun, in this section I'll briefly describe the implementation of the demo.

### Parsing

The initial part of the implementation of every compiler is its frontend. We can the phases of lexical analysis and syntax analysis for free from [ngast](https://github.com/mgechev/ngast), which delegates them to [tsc](https://github.com/Microsoft/TypeScript) and the [Angular compiler](LINK).

Parsing the entire project with [ngast](https://github.com/mgechev/ngast) is as simple as this:

```typescript
export const parse = (projectPath: string) => {
  const project = new ProjectSymbols(createProgramFromTsConfig(projectPath), {
    getSync: (path: string) => readFileSync(path).toString(),
    get: (path: string) =>
      new Promise((resolve, reject) =>
        readFile(path, (error, content) => error ? reject(error) : resolve(content.toString())))
  }, (error: string, path: string) => console.error(error, path));

  return formatContext(project);
};
```

### Transforms

After we have the symbols of our project, we want to extract the ASTs of the templates of the components into the same object structure and transform it to a form convenient for code generation.

Here are the signatures of the methods used for this phase and the interfaces of their output:

```typescript
export interface Module {
  name: string;
  components: Component[];
}

export interface Component {
  name: string;
  template: Node[];
  templateUrl: string;
}

export enum NodeType {
  Plain,
  Custom
}

export interface Node {
  name: string;
  type: NodeType,
  children: Node[];
  startOffset: number;
  endOffset: number;
}

export const formatContext = (context: ProjectSymbols) => {...};

const formatModules = (modules: ModuleSymbol[]) => {...};

const transformTemplateAst = (template: TemplateAst) => {...};

const formatComponents = (directives: DirectiveSymbol[]) => {...};
```

- `formatModules` is responsible for transforming the internal [ngast](https://github.com/mgechev/ngast) module representation to a structure which can be used for generation of a "garden".
- `formatComponents` will transform the internal `DirectiveSymbol`s to object suitable for generation of "trees".
- `transformTemplateAst` is used for transformation of the directive's `TemplateAst`s.

The implementations of these methods are straightforward, so we don't have to go into any details, however, if you're interested them, you can see the transformers [here](LINK).

### Layout

For our "special compiler", we need to provide the phase of computing the layout. We'll have a basic VR world where everything is known ahead of time and nothing is being generated lazily.

Here are the method declarations:

```typescript
...

export interface Size {
  width: number;
  height: number;
  depth: number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

export enum LeafType {
  Plain,
  Special
}

export interface Leaf {
  label: string;
  type: LeafType;
  startOffset: number;
  endOffset: number;
}

export type LeaveSet = Leaf[];

export interface TreeLayout {
  name: string;
  position: Position;
  leaves: LeaveSet[];
  templateUrl: string;
}

export interface GardenLayout {
  name: string;
  size: Size;
  position: Position;
  trees: TreeLayout[];
}

export interface WorldLayout {
  size: Size;
  position: Position;
  gardens: GardenLayout[];
}

const getLeaves = (template: Node[]) => {...};

// We have less trees compared to previous layer
const getTreesLayout = (components: Component[], prevSize: Size, prevPosition: Position): TreeLayout[] => {...};

const getGardenLayout = (module: Module, prevGarden: GardenLayout | undefined) => {...};

const getGardensLayout = (modules: Module[]): GardenLayout[] => {...};

export const createWorldLayout = (modules: Module[]): WorldLayout => {...};
```

In the snippet above we calculate the layout for the first tree of the first module, after that the second one, etc, until we calculate the layout for all the trees for the module. Since now we have the size of the module itself (based on the layouts of the nested components), we can calculate the garden's layout.

When we've calculated the layout of each individual garden, we can calculate the layout of the entire world.

### Code Generation

The last step is code generation. Given that we'll use [aframe](LINK), this is going to be a straightforward process. We can represent the leaves, trees and gardes as a mustache templates. Later, based on our calculations in the layout phase, we can compile the templates and fill the variables corresponding to colors, positioning, labeling, etc.

Let's take a look at the tree template, to get a better idea:

```typescript
const TreeTemplate = `
<a-entity id="{{id}}" geometry="primitive: box; depth: 0.1; height: {{height}}; width: 0.2" position="{{x}} {{y}} {{z}}" rotation="0 30 0" material="shader: standard; metalness: 0.6; src: url(images/dirt.jpg); repeat: 1 4" data-template-url="{{{templateUrl}}}">
  <a-entity static-body="" geometry="primitive: box; depth: 0.1; height: {{height}}; width: 0.2" position="-0.1 0 0" rotation="2 60 0" material="shader: standard; metalness: 0.6; src: url(images/dirt.jpg); repeat: 1 4"></a-entity>
  <a-entity static-body="" geometry="primitive: box; depth: 0.1; height: {{height}}; width: 0.2" position="0 0 0.1" rotation="2 -90 0" material="shader: standard; metalness: 0.6; src: url(images/dirt.jpg); repeat: 1 4"></a-entity>
  <a-entity position="0 0 0.4" rotation="-35 -30 0" text="side: double; width: 5; color: white; align: center; value: {{label}};">
  </a-entity>
  {{{leaves}}}
  <a-animation attribute="rotation"¬
               dur="150"¬
               to="5 30 0"¬
               begin="shake-front-{{id}}"
               repeat="0">¬
  </a-animation>¬
  <a-animation attribute="rotation"¬
               dur="150"¬
               to="-3 30 0"¬
               begin="shake-back-{{id}}"
               repeat="0">¬
  </a-animation>¬
  <a-animation attribute="rotation"¬
               dur="150"¬
               to="0 30 0"¬
               begin="shake-ready-{{id}}"
               repeat="0">¬
  </a-animation>¬
</a-entity>
`;
```

This is a standard [aframe](LINK) template where we have an entity with identifier. Inside of it we have declaration of three animations and also placeholder for the leaves. The animations are related to the tree-shaking simulation. The properties of the object that this template accepts, can be represented by the following interface:

```typescript
interface TreeProperties {
  x: number;
  y: number;
  z: number;
  height: number;
  label: string;
  id: string;
  leaves: string;
  templateUrl: string;
}
```

We can see that inside of the `TreeProperties` interface we have declaration of `templateUrl`. Now lets take a look at the leaf template and properties interface:

```typescript
interface LeafProperties {
  color: string;
  x: number;
  y: number;
  z: number;
  label: string;
  width: number;
  height: number;
  depth: number;
  halfLeaf: number;
  id: string;
  treeId: string;
  endOffset: number;
  startOffset: number;
}

const LeafTemplate = `
<a-entity
  id="{{id}}"
  data-start-offset="{{startOffset}}"
  data-end-offset="{{endOffset}}"
  data-tree-id="{{treeId}}"
  geometry="primitive: box; depth: {{depth}}; height: {{height}}; width: {{width}}"
  position="{{x}} {{y}} {{z}}"
  material="shader: standard; metalness: 0.6; color: {{color}}; repeat: 1 1">
  ...
  <a-animation attribute="position"¬
               dur="1000"¬
               begin="shake-{{id}}"
               fill="forwards"¬
               to="{{x}} 0 {{z}}"¬
               repeat="0">¬
  </a-animation>¬
</a-entity>
`;
```

There are three interesting properties:

- `treeId` - identifier of the tree this leaf is attached to.
- `startOffset` - the start offset of the template element represented by this leaf.
- `endOffset` - the end offset of the template element represented by this leaf.

This is the metadata required for removal of template elements by "shaking the tree".

### Tree-Shaking

When we shake the tree, we activate the following invocation:

```typescript
fetch('http://localhost:8081', {
  method: 'post',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    file: tree.getAttribute('data-template-url'),
    start: leaf.getAttribute('data-start-offset'),
    end: leaf.getAttribute('data-end-offset')
  })
});
```

All it does is to send a post request to a Web server listening on port `8081`. All the server needs to do, is to remove the element corresponding to the given offset.

However, notice that if we remove an element, the offsets of all the elements following it in the template, will require update. This will involve more complex communication protocol between the VR and the application server. Because of that, the demo application simply replaces all the different characters from the element with whitespace.

### Server

Here's the server implementation, with the mentioned hack:

```typescript
app.post('/', (request, response) => {
  const p = request.body;
  console.log(p.file);
  if (p.file) {
    const content = readFileSync(p.file).toString();
    const result = content.substring(0, p.start) +
      content.substring(p.start, p.end).replace(/\S/g, ' ') +
      content.substring(p.end, content.length);
    writeFileSync(p.file, result);
  }
  response.end();
});
```

## Further improvements

Of course, we can start planting trees and creating gardens in order to turn this demo into a more complete "IDE". Another place for improvement is to drop all child leaves once a parent leaf has been shaken.

There's place for a lot of improvement, however, I'm not sure if such a demo project will provide enough value to worth this investment.

TBD

# Conclusion

TBD

