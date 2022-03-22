import { promises as fs, createWriteStream, readFileSync, readdirSync, writeFileSync } from 'fs';
import * as rimraf from "rimraf";
import { promisify } from "util";

const rmdir = promisify(rimraf);
import { get, set, pick, flatten } from "lodash";
import * as archiver from 'archiver';
import { compile } from 'handlebars';

async function getRepoAdapterList() {
  const file = await fs.readFile(`${ __dirname }/kendraio-adapter-repo.json`, 'utf-8');
  return JSON.parse(file);
}

async function getAdapterInfo(location: string): Promise<any> {
  const data = await fs.readFile(`${ location }/kendraio-adapter.json`, 'utf-8');
  const { name, version, label, description, tags } = JSON.parse(data);
  return {
    name, version, label, description, location, tags
  }
}

async function run() {
  // Remove previous build
  await rmdir('public');

  const index = await getRepoAdapterList();
  console.log(index);

  // Get main adapter info for the index
  const adapterList = await Promise.all(get(index, 'adapters', [])
    .map(location => getAdapterInfo(location)));

  // Write the resulting Adapter Repository index file
  set(index, 'adapters', adapterList);
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
                <a class="pure-button" style="margin-bottom: 0.5em;" href="{{ name }}.zip">Download (Zip)</a><br>
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

  // Compile and add the adapter configurations
  // TODO: Validation and verification of adapter configs
  adapterList.forEach(({ location, name }) => {
    const output = createWriteStream(`${ __dirname }/public/${ name }.zip`);
    const archive = archiver('zip');
    archive.pipe(output);
    archive.directory(location, false);
    archive.finalize();
  });

  adapterList.forEach(({ location, name }) => {
    const data = readFileSync(`${ location }/kendraio-adapter.json`, 'utf-8');
    const attachments =
      flatten(readdirSync(location, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirname => readdirSync(`${location}/${dirname.name}`).map(subDir => `${dirname.name}/${subDir}`))
      ).reduce((acc, key) => {
        acc[key] = JSON.parse(readFileSync(`${location}/${key}`, 'utf-8'));
        return acc;
      }, {});
    writeFileSync(`${ __dirname }/public/${name}.json`, JSON.stringify({ ...JSON.parse(data), attachments }, null, 2));
  });
}

run();
