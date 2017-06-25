---
title: VR as gamified IDE
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

In the first part of this blog post I discuss the idea of using virtual reality for gamification of manual tasks in the software development process. I introduce a demo project which allows source code visualization and manipulation in a generated Minecraft-like virtual reality. My initial presentation of the demo project was on [ngconf 2017](https://www.youtube.com/watch?v=tBV4IQwPssU), and the project's extension I presented on [AngularUP 2017](http://angular-up.com/) during my talks "[Mad Science with the Angular Compiler](https://www.youtube.com/watch?v=tBV4IQwPssU)".

Since I heard a lot of people being interested in the actual implementation of the demo, in the second part of the post we'll go through its source code, which is [hosted here, on GitHub](https://github.com/mgechev/ngworld). You can find demo of the project in the [last part of the blog post](#demo).

# VR as a gamified IDE

...If you're interested in the actual implementation, you can skip to the ["Sample Implementation" section](#Sample-Implementation).

## Background

The purpose of my "[Mad Science with the Angular Compiler](https://www.youtube.com/watch?v=tBV4IQwPssU)" talk is to demonstrate what doors the Angular compiler opens by providing us an access to the ASTs produced by the frontend of the TypeScript compiler, Angular template, expression and CSS parsers. In the talk I explain how the compiler can be used for:

- Proving that our code aligns to style-related recommendations listed in the [Angular style guide](https://angular.io/styleguide) (see [codelyzer](http://codelyzer.com))
- Simplification of the migration process, by providing pluggable AST transformation rules, depending on the deprecations and the breaking changes introduced by the framework.
- [Tool for reverse engineering](https://github.com/mgechev/ngrev) of Angular applications through source code visualization.

[ngrev](https://github.com/mgechev/ngrev) is already quite useful, however, I wanted to go one step further and provide a more fun demo. That's why for [ngconf](https://youtu.be/tBV4IQwPssU?t=15m19s), I developed an "unconventional compiler" which from an Angular application produces a Minecraft-like WebVR. The VR is produced by the following rules:

- The virtual world corresponds to the entire application, composed by the Angular modules.
- Each module is represented by a "garden".
- The trees in the gardens are the components of the application.
- Each tree has a crown which consists of blocks. Each block is a template element.
- The blocks have different colors depending on whether they represent an Angular component or a plain HTML element.

## Open questions

While I was building this demo, I was thinking about the following three questions:

- Can we make the visualization more interactive and propagate mutations happening in the virtual world to the application's source code?
- Can we use VR for meaningful source code visualization? Obviously, although fun, the demo application doesn't provide a lot of value.
- Can we solve real-life problems this way?

I experimented with the first point. Since tree-shaking is a [big thing in the JavaScript world](https://webpack.js.org/guides/tree-shaking/), and I already had the trees, for [AngularUP](http://angular-up.com/) I introduced the shaking part. In order to make it more memorable, I created a lightweight server which accepts commands from the virtual reality and modifies the source code. For the purpose of the demo, we can tree-shake a tree and drop its leaves, one by one.

<div style="position:relative;height:0;padding-bottom:56.25%"><iframe src="https://www.youtube.com/embed/uwBo201Dd8A?ecver=2" width="640" height="360" frameborder="0" style="position:absolute;width:100%;height:100%;left:0" allowfullscreen></iframe></div>

After one of the Angular SF meetups, I had a chat with [Shawn Stedman](https://twitter.com/pxwise) who told me that after watching my talk on ngconf, he thought about extending the demo and building a Minecraft-based IDE where one can plant trees (i.e. create components), create gardens (add modules), etc. Abstractly thinking, this can be considered as a gamified IDE in the virtual reality.

It turns out that gamifying the software development process is a [broadly](https://dl.acm.org/citation.cfm?id=2494589) [researched](http://www.sciencedirect.com/science/article/pii/S0950584914001980) [topic](https://scholar.google.com/scholar?q=gamification+software+development&hl=bg&as_sdt=0&as_vis=1&oi=scholart&sa=X&ved=0ahUKEwjs4IvR6tjUAhUCNhoKHfLHCbwQgQMIIjAA).

Gamifying the software development process looks like an interesting opportunity, however, it still requires the full engagement of very expensive asset - software engineers. In our daily work environment, as engineers we don't always have to solve exciting, challenging problems which use our full potential. Such tasks can be outsourced to people with lower expertise, even without engineering background.

This is where it gets interesting. Imagine if we're able to isolate the manual, boring tasks that we need to perform every single day and present them into the form of a game released on the global market. This way hundreds of thousands of people, can solve the manual problems while consuming these games.

Looking at this from slightly different perspective, it turns out that scientists already use similar technic for using gamers as computational units for solving NP-complete protein folding problems <a href="#foldit"><sup>[1]</sup></a> <a href="#outsourcing"><sup>[2]</sup></a> <a href="#hope-college"><sup>[3]</sup></a>.

Meanwhile, I found that there is a research for visualization of object-oriented source code in the three dimensional space <a href="#memphis"><sup>[4]</sup></a> and in AltspaceVR experimented introducing a more traditional IDE to VR <a href="#ide-vr"><sup>[5]</sup></a>.

## Conclusions

Virtual Reality opens an entire new world of visualization which we will most likely take advantage of as part of our development process in the next a couple of years. The questions that this blog post opens are:

- Can we move our integrated development environment to VR and...
- Can we isolate some of the manual tasks we need to perform as engineers, abstract them into the form of a game and outsource them as a game.

Although the demo project demonstrated in this blog post doesn't have the potential to be turned into a full-fledged IDE, based on the third-party research in this direction seems that there's an opportunity in this space.

# Sample Implementation

Since looking in the code is always fun, in this section I'll briefly describe the implementation of the demo project. Its [source code is hosted on GitHub](https://github.com/mgechev/ngworld).

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

1. <a href="http://www.skepticblog.org/2011/09/19/gamers-succeed-where-scientists-fail/" id="foldit">Gamers succeed where scientists fail</a>
2. <a href="https://www.polygon.com/2017/3/31/15125824/games-companies-outsourcing" id="outsourcing">Games companies turn to outsourcers for low-cost workers</a>
3. <a href="http://meaningfulplay.msu.edu/proceedings2010/mp2010_paper_16.pdf" id="hope-college">Online Games as Social-Computational Systems for Solving NP-complete Problems</a>
4. <a href="https://pdfs.semanticscholar.org/d574/88e55b326d95ba605dd1e7197555cbe039e1.pdf" id="memphis">Visualizing Software in an Immersive Virtual Reality Environment</a>
5. <a href="http://cognitivevr.co/blog/programming-in-virtual-reality/" id="ide-fr">http://cognitivevr.co/blog/programming-in-virtual-reality/</a>


<h2 id="demo">Demo</h2>

<iframe src="https://mgechev.github.io/ngworld/" style="border: none; width: 100%; height: 600px;"></iframe>
