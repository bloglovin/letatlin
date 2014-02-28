var lib = {
  letatlin: require('../')
};

/*
Assumes that you've seeded etcd like this:

curl -L http://127.0.0.1:4001/v2/keys/greetings/default -XPUT -d value="Welcome to Letatlin"
curl -L http://127.0.0.1:4001/v2/keys/mysql/documents -XPUT -d value="mysql://user:pass@host/database"
curl -L http://127.0.0.1:4001/v2/keys/config/applicationX/foo -XPUT -d value="Foo value"
curl -L http://127.0.0.1:4001/v2/keys/config/applicationX/bar -XPUT -d value="Bar value"
*/

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
