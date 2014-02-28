# Letatlin

Letatlin loads your applications environment-dependent configuration from etcd. Planned support for reloading applications to reconfiguration.

## Usage

Populate etcd with some values:

```bash
curl -L http://127.0.0.1:4001/v2/keys/greetings/default -XPUT -d value="Welcome to Letatlin"
curl -L http://127.0.0.1:4001/v2/keys/mysql/documents -XPUT -d value="mysql://user:pass@host/database"
curl -L http://127.0.0.1:4001/v2/keys/config/applicationX/foo -XPUT -d value="Foo value"
curl -L http://127.0.0.1:4001/v2/keys/config/applicationX/bar -XPUT -d value="Bar value"
```

Run this (examples/basic.js):

```javascript
var lib = {
  letatlin: require('../')
};

var environment = {
  greeting: {
    key: "/greetings/default"
  },
  mysql: {
    key: "/mysql/documents",
    format: "url"
  },
  config: {
    key:"/config/applicationX",
    recursive: true
  }
};

lib.letatlin(environment, function runApp(error, env) {
  console.log(env.greeting);
  console.log(JSON.stringify(env, null, '  '));
});

```

And it should output:

```
Welcome to Letatlin
{
  "greeting": "Welcome to Letatlin",
  "mysql": {
    "protocol": "mysql:",
    "slashes": true,
    "auth": "user:pass",
    "host": "host",
    "port": null,
    "hostname": "host",
    "hash": null,
    "search": null,
    "query": null,
    "pathname": "/database",
    "path": "/database",
    "href": "mysql://user:pass@host/database",
    "user": "user",
    "password": "pass"
  },
  "config": {
    "foo": "Foo value",
    "bar": "Bar value"
  }
}
```
