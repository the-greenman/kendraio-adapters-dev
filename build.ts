import { promises as fs, createWriteStream, readFileSync, readdirSync, writeFileSync} from 'fs';
import { statSync, existsSync } from 'fs';
import * as rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);
import { get, set, pick, flatten } from "lodash";
import * as archiver from 'archiver';
import { compile } from 'handlebars';



async function getRepoAdapterList(dir: string) {
  const content = await fs.readdir(`${dir}/adapters`);
// find all diectories in array
  const dirs = content.filter(f => statSync(`${ dir }/adapters/${ f }`).isDirectory());
  
  //  loop through all directories, to see if they contain a kendraio-adapter.json file
  const adapters = await Promise.all(dirs.map(async (location) => {
    // check if the directory contains a kendraio-adapter.json file
    const adapter = `${ dir }/adapters/${ location }/kendraio-adapter.json`;
    if (existsSync(adapter)) {
      // read the file
      const data = await fs.readFile(adapter, 'utf-8');
      // parse the file
      const { name, version, label, description, tags } = JSON.parse(data);
      return {
        name, version, label, description, location, tags
     }
    }
  }));
  return adapters;
}

async function getRepoSettings() {
  const file = await fs.readFile(`${ __dirname }/kendraio-adapter-repo.json`, 'utf-8');
  return JSON.parse(file);
}


async function run() {
  // Remove previous build
  await rmdir('public');
  // Get main adapter info for the index
  const adapterList = await getRepoAdapterList(__dirname);
  const settings = await getRepoSettings();
  const index = {
    name: settings.name,
    description: settings.description,
    adapters: adapterList
  }
  console.log(index);
  await fs.mkdir('public');
  await fs.writeFile('public/index.json', JSON.stringify(index));

  // Write the HTML version
  const indexTemplate = `
<html>
<head>
<title>{{name}}</title>
<link rel="stylesheet" href="https://unpkg.com/purecss@1.0.1/build/pure-min.css" integrity="sha384-oAOxQR6DkCoMliIh8yFnu25d7Eq/PHS21PClpwjOTeU2jRSq11vu66rf90/cZr47" crossorigin="anonymous">
</head>
<body>
<div class="container" style="padding: 1em;">
<h1>{{name}}</h1>
<p>{{description}}</p>
<table class="pure-table pure-table-striped">
    <thead>
        <tr>
            <th>Adapter</th>
            <th>key</th>
            <th>Description</th>
            <th>Version</th>
            <th>Tags</th>
            <th>Download</th>
        </tr>
    </thead>

    <tbody>
  {{#each adapters}}
        <tr>
            <td>{{label}}</td>
            <td>{{name}}</td>
            <td>{{description}}</td>
            <td>{{version}}</td>
            <td>{{ tags }}</td>
            <td>
                <a class="pure-button" href="{{ name }}.json">Download (JSON)</a>
            </td>
        </tr>
  {{/each}}
    </tbody>
</table>
</div>
</body>
</html>
  `;
  const template = compile(indexTemplate);
  await fs.writeFile('public/index.html', template({ ...index }));

  adapterList.forEach(({ location, name }) => {
    let data = readFileSync(`adapters/${ location }/kendraio-adapter.json`, 'utf-8');
    let attachments = get(JSON.parse(data), 'attachments', []);      
    writeFileSync(`${ __dirname }/public/${name}.json`, JSON.stringify({ ...JSON.parse(data), attachments }, null, 2));
  });
}

run();
