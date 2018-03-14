import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import * as prettier from "prettier"
import * as pipe from "../node/pipe"
import { IProjectInfo } from "./analyse-project-interface"
import { md5 } from "./md5"
import { IProjectConfig } from "./project-config-interface"
import {
  helperPath,
  layoutPath,
  markdownLayoutPath,
  markdownTempPath,
  notFoundPath,
  tempJsEntryPath
} from "./structor-config"

const LAYOUT = "LayoutComponent"
const LAYOUT_ROUTE = "LayoutRoute"
const MARKDOWN_LAYOUT = "MarkdownLayoutComponent"
const MARKDOWN_LAYOUT_ROUTE = "MarkdownLayoutRoute"
const MARKDOWN_WRAPPER = "MarkdownWrapper"

interface IEntryText {
  pageImporter: string
  pageRoutes: string
  layoutImporter: string
  notFoundImporter: string
  notFoundRoute: string
  setEnv: string
  setCustomEnv: string
  storesImporter: string
  storesHelper: string
  markdownLayoutImporter: string
  markedImporter: string
}

// // Entry file content
// const getEntryContent = (
//   entryText: IEntryText,
//   projectInfo: IProjectInfo,
//   projectConfig: IProjectConfig,
//   env: string
// ) => {
//   return `
//     // tslint:disable
//     import createBrowserHistory from "history/createBrowserHistory"
//     import { setCustomEnv, setEnvLocal, setEnvProd } from "pri/client"
//     import * as React from "react"
//     import * as ReactDOM from "react-dom"
//     import Loadable from "react-loadable"
//     import { Redirect, Route, Router, Switch } from "react-router-dom"

//     ${env === "local" ? `import { hot } from "react-hot-loader"` : ""}

//     ${entryText.storesImporter}
//     ${entryText.markdownLayoutImporter}
//     ${entryText.markedImporter}

//     const customHistory = createBrowserHistory({
//       basename: "${env === "local" ? "/" : projectConfig.baseHref}"
//     })

//     ${entryText.setEnv}
//     ${entryText.setCustomEnv}

//     ${entryText.layoutImporter}
//     ${entryText.notFoundImporter}
//     ${entryText.pageImporter}

//     class Root extends React.PureComponent<any, any> {
//       public componentWillMount() {
//         ${
//           env === "local"
//             ? `
//           window.addEventListener("message", event => {
//             const data = event.data
//             switch(data.type) {
//               case "changeRoute":
//                 customHistory.push(data.path)
//                 break
//               default:
//             }
//           }, false)
//         `
//             : ""
//         }
//       }

//       public render() {
//         return (
//           ${projectInfo.stores.length > 0 ? "<Provider {...stores}>" : ""}
//           <Router history={customHistory}>
//             <Switch>
//               ${entryText.pageRoutes}
//               ${entryText.notFoundRoute}
//             </Switch>
//           </Router>
//           ${projectInfo.stores.length > 0 ? "</Provider>" : ""}
//         )
//       }
//     }

//     ${
//       env === "local"
//         ? `
//       const HotRoot = hot(module)(Root)

//       ReactDOM.render(
//         <HotRoot />,
//         document.getElementById("root")
//       )
//     `
//         : `
//       ReactDOM.render(
//         <Root />,
//         document.getElementById("root")
//       )
//     `
//     }

//   `
// }

// const getHelperContent = (
//   entryText: IEntryText,
//   info: IProjectInfo,
//   env: string
// ) => `
//   /**
//    * Do not edit this file.
//    * This file is automatic generated to get type help.
//    */

//    ${entryText.storesHelper}
// `

// const safeName = (str: string) => _.upperFirst(_.camelCase(str))

// export async function createEntry(
//   projectInfo: IProjectInfo,
//   projectRootPath: string,
//   env: string,
//   projectConfig: IProjectConfig
// ) {
//   const entryText: IEntryText = {
//     pageImporter: "",
//     pageRoutes: "",
//     layoutImporter: "",
//     notFoundImporter: "",
//     notFoundRoute: "",
//     setEnv: "",
//     setCustomEnv: "",
//     storesImporter: "",
//     storesHelper: "",
//     markdownLayoutImporter: "",
//     markedImporter: ""
//   }

//   // Set env
//   switch (env) {
//     case "local":
//       entryText.setEnv = `setEnvLocal()`
//       break
//     case "prod":
//       entryText.setEnv = `setEnvProd()`
//       break
//     default:
//   }

//   // Set custom env
//   if (projectConfig.env) {
//     entryText.setCustomEnv = `setCustomEnv(${JSON.stringify(
//       projectConfig.env
//     )})`
//   }

//   // Clear temp markdown files
//   fs.emptyDirSync(path.join(projectRootPath, markdownTempPath.dir))

//   // Set routes
//   projectInfo.routes.forEach(route => {
//     const filePath = path.parse(route.filePath)
//     const relativePageFilePath = path.relative(
//       projectRootPath,
//       filePath.dir + "/" + filePath.name
//     )
//     const componentName =
//       safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5)
//     const chunkName = _.camelCase(route.path) || "index"

//     const pathInfo = path.parse(route.filePath)

//     switch (filePath.ext) {
//       case ".tsx":
//       case ".ts":
//         if (projectInfo.routes.length < 2) {
//           // If only one page, don't need code splitting.
//           if (projectInfo.stores.length === 0) {
//             entryText.pageImporter += `
//               import ${componentName} from "${normalizePath(
//               path.join(pathInfo.dir, pathInfo.name)
//             )}"
//             `
//           } else {
//             entryText.pageImporter += `
//               import ${componentName}Temp from "${normalizePath(
//               path.join(pathInfo.dir, pathInfo.name)
//             )}"
//               const ${componentName} = Connect()(${componentName}Temp)
//             `
//           }
//         } else {
//           const importCode =
//             projectInfo.stores.length === 0
//               ? `import(/* webpackChunkName: "${chunkName}" */ "${normalizePath(
//                   path.join(pathInfo.dir, pathInfo.name)
//                 )}")`
//               : `import(/* webpackChunkName: "${chunkName}" */ "${normalizePath(
//                   path.join(pathInfo.dir, pathInfo.name)
//                 )}").then(res => Connect()(res.default))  `

//           entryText.pageImporter += `
//             const ${componentName} = Loadable({
//               loader: () => ${importCode},
//               loading: (): any => null
//             })\n
//           `
//         }

//         entryText.pageRoutes += `
//           <${projectInfo.hasLayout ? LAYOUT_ROUTE : "Route"} exact path="${
//           route.path
//         }" component={${componentName}} />\n
//         `
//         break
//       case ".md":
//         if (!entryText.markedImporter) {
//           entryText.markedImporter = `
//             import * as highlight from "highlight.js"
//             import "highlight.js/styles/github.css"
//             import markdownIt from "markdown-it"

//             const markdown = markdownIt({
//               html: true,
//               linkify: true,
//               typographer: true,
//               highlight: (str: string, lang: string) => {
//                 if (lang === "tsx") {
//                   lang = "jsx"
//                 }

//                 if (lang === "typescript") {
//                   lang = "javascript"
//                 }

//                 if (lang && highlight.getLanguage(lang)) {
//                   try {
//                     return highlight.highlight(lang, str).value;
//                   } catch (__) {
//                     //
//                   }
//                 }

//                 return ""
//               }
//             })

//             const ${MARKDOWN_WRAPPER} = ({ children }: any) => (
//               <div dangerouslySetInnerHTML={{ __html: markdown.render(children as string) }} />
//             )
//           `
//         }

//         // Create esmodule file for markdown
//         const fileContent = fs.readFileSync(route.filePath).toString()
//         const safeFileContent = fileContent.replace(/\`/g, `\\\``)
//         const markdownTsAbsolutePath = path.join(
//           projectRootPath,
//           markdownTempPath.dir,
//           componentName + ".ts"
//         )
//         const markdownTsAbsolutePathWithoutExt = path.join(
//           projectRootPath,
//           markdownTempPath.dir,
//           componentName
//         )
//         fs.outputFileSync(
//           markdownTsAbsolutePath,
//           `export default \`${safeFileContent}\``
//         )

//         if (projectInfo.routes.length < 2) {
//           // If only one page, don't need code splitting.
//           const tempComponentName = `${componentName}Md`
//           const wrapperStr = `<${MARKDOWN_WRAPPER}>{${tempComponentName}}</${MARKDOWN_WRAPPER}>`
//           entryText.pageImporter += `
//             import ${tempComponentName} from "${normalizePath(
//             markdownTsAbsolutePathWithoutExt
//           )}"
//             const ${componentName} = () => (${wrapperStr})
//           `
//         } else {
//           let importCode = ""
//           const wrapperStr = `<${MARKDOWN_WRAPPER}>{code.default}</${MARKDOWN_WRAPPER}>`
//           importCode = `
//             import(/* webpackChunkName: "${chunkName}" */ "${normalizePath(
//             markdownTsAbsolutePathWithoutExt
//           )}").then(code => {
//               return () => (${wrapperStr})
//             })
//           `

//           entryText.pageImporter += `
//             const ${componentName} = Loadable({
//               loader: () => ${importCode},
//               loading: (): any => null
//             })\n
//           `
//         }

//         entryText.pageRoutes += `
//           <${
//             projectInfo.hasMarkdownLayout ? MARKDOWN_LAYOUT_ROUTE : "Route"
//           } exact path="${route.path}" component={${componentName}} />\n
//         `
//         break
//       default:
//     }
//   })

//   // Set stores
//   if (projectInfo.stores.length > 0) {
//     const entryRelativeToHelper = path.relative(
//       path.join(tempJsEntryPath.dir),
//       path.join(helperPath.dir, helperPath.name)
//     )
//     entryText.storesImporter += `import { useStrict } from "dob"\n`
//     entryText.storesImporter += `import { Connect, Provider } from "dob-react"\n`
//     entryText.storesImporter += `useStrict()\n`
//     entryText.storesImporter += `import { stores } from "${normalizePath(
//       entryRelativeToHelper
//     )}"\n`
//     entryText.storesHelper += `import { combineStores } from "dob"\n`
//     entryText.storesHelper += projectInfo.stores
//       .map(eachStore => {
//         const filePath = path.parse(eachStore.filePath)
//         const importAbsolutePath = path.join(filePath.dir, filePath.name)
//         const importRelativePath = path.relative(
//           path.join(projectRootPath, helperPath.dir),
//           importAbsolutePath
//         )
//         return `import { ${safeName(eachStore.name)}Action, ${safeName(
//           eachStore.name
//         )}Store } from "${normalizePath(importRelativePath)}"`
//       })
//       .join("\n")
//     entryText.storesHelper += `
//       \nconst stores = combineStores({${projectInfo.stores
//         .map(eachStore => {
//           return `${safeName(eachStore.name)}Action, ${safeName(
//             eachStore.name
//           )}Store`
//         })
//         .join(",")}})

//       export { stores }
//     `
//   }

//   // Set layout
//   if (projectInfo.hasLayout) {
//     let layoutImportCode = ""
//     const layoutRelativePath = path.relative(
//       tempJsEntryPath.dir,
//       path.join(layoutPath.dir, layoutPath.name)
//     )

//     if (projectInfo.stores.length === 0) {
//       layoutImportCode = `import ${LAYOUT} from "${normalizePath(
//         layoutRelativePath
//       )}"`
//     } else {
//       layoutImportCode = `
//         import ${LAYOUT}Pure from "${normalizePath(layoutRelativePath)}"
//         const ${LAYOUT} = Connect()(${LAYOUT}Pure)
//       `
//     }

//     entryText.layoutImporter = `
//       ${layoutImportCode}

//       const ${LAYOUT_ROUTE} = ({ component: Component, ...rest }: any) => {
//         return (
//           <Route {...rest} render={matchProps => (
//             <${LAYOUT}>
//               <Component {...matchProps} />
//             </${LAYOUT}>
//           )} />
//         )
//       };\n
//     `
//   }

//   // Set markdown layout
//   if (projectInfo.hasMarkdownLayout) {
//     const markdownRelativePath = path.relative(
//       tempJsEntryPath.dir,
//       path.join(markdownLayoutPath.dir, markdownLayoutPath.name)
//     )

//     let markdownLayoutInportCode = ""

//     if (projectInfo.stores.length === 0) {
//       markdownLayoutInportCode = `import ${MARKDOWN_LAYOUT} from "${normalizePath(
//         markdownRelativePath
//       )}"\n`
//     } else {
//       const markdownLayoutPure = `${MARKDOWN_LAYOUT}Pure`
//       markdownLayoutInportCode = `
//         import ${markdownLayoutPure} from "${normalizePath(
//         markdownRelativePath
//       )}"
//         const ${MARKDOWN_LAYOUT} = Connect()(${markdownLayoutPure})
//       `
//     }

//     entryText.markdownLayoutImporter = `
//       ${markdownLayoutInportCode}

//       const ${MARKDOWN_LAYOUT_ROUTE} = ({ component: Component, ...rest }: any) => {
//         return (
//           <Route {...rest} render={matchProps => (
//             <${MARKDOWN_LAYOUT}>
//               <Component {...matchProps} />
//             </${MARKDOWN_LAYOUT}>
//           )} />
//         )
//       };\n
//     `
//   }

//   // Set not found
//   if (projectInfo.has404File) {
//     entryText.notFoundImporter = `import NotFoundComponent from "${normalizePath(
//       path.join(projectRootPath, path.join(notFoundPath.dir, notFoundPath.name))
//     )}"`
//     entryText.notFoundRoute = `
//       <Route component={NotFoundComponent} />
//     `
//   }

//   // Create entry tsx file
//   const entryPath = path.join(projectRootPath, path.format(tempJsEntryPath))
//   fs.outputFileSync(
//     entryPath,
//     prettier.format(
//       getEntryContent(entryText, projectInfo, projectConfig, env),
//       {
//         semi: false,
//         parser: "typescript"
//       }
//     )
//   )

//   // If has stores, create helper.ts
//   const helperAbsolutePath = path.join(projectRootPath, path.format(helperPath))
//   if (projectInfo.stores.length > 0) {
//     fs.outputFileSync(
//       helperAbsolutePath,
//       prettier.format(getHelperContent(entryText, projectInfo, env), {
//         semi: false,
//         parser: "typescript"
//       })
//     )
//   } else {
//     fs.removeSync(helperAbsolutePath)
//   }

//   return entryPath
// }

export class Entry {
  private env: "local" | "prod"
  private projectConfig: IProjectConfig

  constructor(env: "local" | "prod", projectConfig: IProjectConfig) {
    this.env = env
    this.projectConfig = projectConfig
  }

  public getAll() {
    return [
      this.getHeader(),
      this.getBody(),
      this.getEntryComponent(),
      this.getFooter()
    ].join("\n")
  }

  public pipeHeader(fn: (header: string) => string) {
    pipe.set("entryHeader", fn)
  }

  public pipeBody(fn: (body: string) => string) {
    pipe.set("entryBody", fn)
  }

  public pipeEntryComponent(fn: (entryComponent: string) => string) {
    pipe.set("entryEntryComponent", fn)
  }

  public pipeFooter(fn: (footer: string) => string) {
    pipe.set("entryFooter", fn)
  }

  public pipeRenderRoutes(fn: (renderRoutes: string) => string) {
    pipe.set("entryRenderRoutes", fn)
  }

  public pipeRenderRouter(fn: (renderRouter: string) => string) {
    pipe.set("entryRenderRouter", fn)
  }

  protected getHeader() {
    return pipe.get(
      "entryHeader",
      `
      import createBrowserHistory from "history/createBrowserHistory"
      import { setCustomEnv, setEnvLocal, setEnvProd } from "pri/client"
      import * as React from "react"
      import * as ReactDOM from "react-dom"
      import Loadable from "react-loadable"
      import { Redirect, Route, Router, Switch } from "react-router-dom"
    `
    )
  }

  protected getBody() {
    return pipe.get(
      "entryBody",
      `
      const customHistory = createBrowserHistory({
        basename: "${this.env === "local" ? "/" : this.projectConfig.baseHref}"
      })
    `
    )
  }

  protected getEntryComponent() {
    return pipe.get(
      "entryEntryComponent",
      `
      class Root extends React.PureComponent<any, any> {
        public render() {
          return (
            ${this.getRenderRouter()}
          )
        }
      }
    `
    )
  }

  protected getFooter() {
    return pipe.get(
      "entryFooter",
      `
      ReactDOM.render(<Root />, document.getElementById("root"))
    `
    )
  }

  protected getRenderRoutes() {
    return pipe.get("entryRenderRoutes", "")
  }

  protected getRenderRouter() {
    return pipe.get(
      "entryRenderRouter",
      `
      <Router history={customHistory}>
        <Switch>
          ${this.getRenderRoutes()}
        </Switch>
      </Router>
    `
    )
  }
}

export function createEntry(projectRootPath: string, content: string) {
  // Create entry tsx file
  const entryPath = path.join(projectRootPath, path.format(tempJsEntryPath))
  fs.outputFileSync(
    entryPath,
    prettier.format(content, {
      semi: false,
      parser: "typescript"
    })
  )
}
