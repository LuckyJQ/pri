import * as fs from "fs-extra"
import * as path from "path"
import { IProjectInfo } from "./analyse-project-interface"
import { IProjectConfig } from "./project-config-interface"

export async function generateStaticHtml(projectRootPath: string, projectConfig?: IProjectConfig, projectInfo?: IProjectInfo) {
  projectInfo.routes
    .filter(route => route.path !== "/")
    .forEach(route => {
      generateHtmlByRouterPath(route.path, projectRootPath, projectConfig)
    })
}

export function generateHtmlByRouterPath(routerPath: string, projectRootPath: string, projectConfig?: IProjectConfig) {
  const relativePathWithSuffix = path.join(routerPath, "index.html")
  const htmlPath = path.join(projectRootPath, projectConfig.distDir, relativePathWithSuffix)

  const cssPath = path.join(projectRootPath, projectConfig.distDir, "entry.css")
  const hasCssOutput = fs.existsSync(cssPath)

  fs.outputFileSync(htmlPath, `
    <html>

    <head>
      <title>${projectConfig.title}</title>

      ${hasCssOutput ? `
        <link rel="stylesheet" type="text/css" href="${cssPath}"/>
      ` : ""}

      <style>
        html,
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>

    <body>
      <div id="root"></div>
      <script src="${getEntryPath(projectConfig, "entry.js")}"></script>
    </body>

    </html>
  `)
}

function getEntryPath(projectConfig: IProjectConfig, entryFileName: string) {
  let entryPath = "/" + entryFileName

  if (projectConfig.publicPath) {
    // tslint:disable-next-line:prefer-conditional-expression
    if (projectConfig.publicPath.startsWith("/")) {
      entryPath = path.join(projectConfig.publicPath, entryFileName)
    } else {
      entryPath = "//" + path.join(projectConfig.publicPath, entryFileName)
    }
  }

  return entryPath
}
