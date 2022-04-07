{"adapterName":"github","label":"Github","description":null,"infoUrl":null,"supportUrl":null,"maintainer":null,"tags":[],"version":"0.0.1","name":"github","modified":true,"workflow":[{"workflowId":"myWorkflow","title":"Github Authentication","adapterName":"github","modified":false,"config":"configs/myWorkflow.json"},{"adapterName":"github","workflowId":"githubAuth","title":"Github Authentication","modified":true,"config":"configs/githubAuth.json"},{"adapterName":"github","workflowId":"githubUser","title":"Github Authentication","modified":true,"config":"configs/githubUser.json"},{"adapterName":"github","workflowId":"githubRepoIssues","title":"Github Repository Issues","modified":true,"config":"configs/githubRepoIssues.json"},{"adapterName":"github","workflowId":"githubRepoList","title":"Github Repository Issues","modified":true,"config":"configs/githubRepoList.json"},{"workflowId":"createCommit","title":"Create commit","adapterName":"github","modified":true,"config":"configs/createCommit.json"},{"adapterName":"github","workflowId":"loadGithubUserData","title":"Load github data into state","modified":true,"config":"configs/loadGithubUserData.json"}],"database":[],"forms":[],"attachments":{"configs/myWorkflow.json":{"workflowId":"myWorkflow","title":"Github Authentication","adapterName":"github","blocks":[],"modified":false},"configs/githubAuth.json":{"workflowId":"githubAuth","title":"Github Authentication","adapterName":"github","blocks":[{"type":"init"},{"type":"form","label":"Github Authentication","jsonSchema":{"type":"object","properties":{"token":{"type":"string","title":"Personal access token","pattern":"^gh.?_.*"}}},"uiSchema":{"token":{"ui:widget":"password"}}},{"type":"mapping","mapping":"data.token"},{"type":"debug","open":1,"showContext":false},{"type":"variable-set","name":"github.token"}],"modified":false},"configs/githubUser.json":{"workflowId":"githubUser","title":"Github Authentication","adapterName":"github","blocks":[{"type":"init"},{"type":"gosub","adapterName":"github","workflowId":"loadGithubUserData","blockComment":"load github data"},{"type":"switch","valueGetter":"type(state.flags.github.viewer) == `string` && length(context.github.viewer) > `0` && state.flags.github.viewer != `clear`","cases":[{"value":true,"blocks":[{"type":"template","template":"Connected to Github as: {{state.flags.github.viewer}}"}]},{"value":false,"blocks":[{"type":"gosub","adapterName":"github","workflowId":"githubAuth"}]}],"blockComment":"Request auth if no data exists"},{"type":"debug","open":1,"showData":true,"showContext":false,"showState":true,"blockComment":""}],"modified":true},"configs/githubRepoIssues.json":{"workflowId":"githubRepoIssues","title":"Github Repository Issues","adapterName":"github","blocks":[{"type":"init"},{"type":"mapping","mapping":"context.github.repository"},{"type":"form","label":"github repostitory selector","jsonSchema":{"type":"object","properties":{"owner":{"type":"string","title":"Repository owner","default":"kendraio"},"repository":{"type":"string","title":"Repository name","default":"kendraio-app"}}},"uiSchema":{}},{"type":"context-save","contextKey":"github.repository"},{"type":"variable-get","name":"github.token"},{"type":"context-save","contextKey":"github.token"},{"type":"graphql","endpoint":"https://api.github.com/graphql","query":"query MyQuery($owner: String!, $repository: String!) {\r\n    repository(owner: $owner, name: $repository) {\r\n      issues(first: 100, states: [OPEN], orderBy:  {field: UPDATED_AT, direction: DESC}) {\r\n        totalCount\r\n        nodes {\r\n          number\r\n          id\r\n          title\r\n          url\r\n          createdAt\r\n          updatedAt   \r\n          comments(last: 5, orderBy: {field: UPDATED_AT, direction: DESC}) {\r\n            totalCount\r\n          } \r\n        }\r\n      }\r\n    } \r\n  }","variables":{"token":"context.authToken","owner":"context.github.repository.owner","repository":"context.github.repository.repository"},"headers":{"Authorization":"join(' ', [`Bearer`, context.github.token])"},"allowFirst":true,"allowEmpty":true},{"type":"debug","open":1,"showContext":true},{"type":"mapping","mapping":"data.data.repository.issues.nodes[].{number: number, title: title, url: url, createdAt: createdAt, updatedAt: updatedAt, comments: comments.totalCount}"},{"type":"grid","gridOptions":{"pagination":true,"paginationPageSize":20,"defaultColDef":{"sortable":true,"resizable":true}}}],"modified":false},"configs/githubRepoList.json":{"workflowId":"githubRepoList","title":"Github Repository Issues","adapterName":"github","blocks":[{"type":"init"},{"type":"mapping","mapping":"context.github.repositories"},{"type":"debug","open":1,"showContext":true},{"type":"grid","gridOptions":{"pagination":true,"paginationPageSize":20,"defaultColDef":{"sortable":true,"resizable":true}}},{"type":"form","label":"github repostitory selector","jsonSchema":{"type":"object","properties":{"owner":{"type":"string","title":"Repository owner","default":"kendraio"},"repository":{"type":"string","title":"Repository name","default":"kendraio-app"}}},"uiSchema":{}},{"type":"mapping","mapping":"[context.github.repositories || [], [data]][]"},{"type":"debug","open":1,"showContext":true},{"type":"context-save","contextKey":"github.repositories"}],"modified":false},"configs/createCommit.json":{"workflowId":"createCommit","title":"Create commit","adapterName":"github","blocks":[{"type":"init"},{"type":"gosub","adapterName":"github","workflowId":"loadGithubUserData","blockComment":"load github data"},{"type":"adapter-info","adapterName":"github","compileAdapter":true,"blockComment":"load adapter data"},{"type":"mapping","mapping":"btoa(json(data))","blockComment":"base64 encode"},{"type":"context-save","key":"content","blockComment":""},{"type":"graphql","endpoint":"https://api.github.com/graphql","query":"query {\r\n        repository(owner: $owner, name: $name) {\r\n          ... on Repository{\r\n            ref(qualifiedName: $branch) {\r\n                       target {\r\n                         ... on Commit {\r\n                           oid\r\n                         }\r\n                       }\r\n                     }      \r\n                }\r\n          }\r\n        }","variables":{"owner":"`the-greenman`","name":"`kendraio-test`","branch":"`main`"},"headers":{"Authorization":"join(' ', [`Bearer`, state.flags.github.token])"},"allowFirst":false,"allowEmpty":true},{"type":"debug","open":1,"showData":true,"showContext":false,"showState":true,"blockComment":""},{"type":"mapping","mapping":"data.data.repository.ref.target.oid","blockComment":"Extract last oid from result"},{"type":"debug","open":1,"showData":true,"showContext":true,"showState":true,"blockComment":""},{"type":"form","jsonSchema":{},"uiSchema":{}},{"type":"context-save","key":"github.lastOid","blockComment":"save last Oid"},{"type":"mapping","mapping":"{\r\n  \"input\": {\r\n    \"branch\": {\r\n      \"repositoryNameWithOwner\": `the-greenman/kendraio-test`,\r\n      \"branchName\": `main`\r\n    },\r\n    \"message\": {\r\n      \"headline\": `Hello from GraphQL!`\r\n    },\r\n    \"fileChanges\": {\r\n      \"additions\": [\r\n        {\r\n          \"path\": `GraphQL.md`,\r\n          \"contents\": context.content\r\n        }\r\n      ]\r\n    },\r\n    \"expectedHeadOid\": context.github.lastOid\r\n  }\r\n}","blockComment":"Set up input data"},{"type":"graphql","endpoint":"https://api.github.com/graphql","query":"mutation MyQuery($input: CreateCommitOnBranchInput!) \r\n{ \r\n    createCommitOnBranch(input: $input) { \r\n        commit { \r\n          url \r\n        } \r\n    } \r\n    \r\n}","variables":{"input":"data.input","token":"state.flags.github.token"},"headers":{"Authorization":"join(' ', [`Bearer`, state.flags.github.token])"},"allowFirst":false,"allowEmpty":false},{"type":"debug","open":1,"showData":true,"showContext":false,"showState":false}],"modified":true},"configs/loadGithubUserData.json":{"workflowId":"loadGithubUserData","title":"Load github data into state","adapterName":"github","blocks":[{"type":"init"},{"type":"variable-get","name":"github.token"},{"type":"context-save","contextKey":"state.flags.github.token","blockComment":""},{"type":"debug","open":1,"showData":true,"showContext":false,"showState":true,"blockComment":""},{"type":"graphql","endpoint":"https://api.github.com/graphql","query":"query MyQuery {\r\n    viewer { \r\n        login \r\n        }\r\n}","variables":{},"headers":{"Authorization":"join(' ', [`Bearer`, state.flags.github.token])"},"allowFirst":true,"allowEmpty":true},{"type":"mapping","mapping":"data.data.viewer.login"},{"type":"context-save","contextKey":"state.flags.github.viewer","blockComment":""}],"modified":true}}}