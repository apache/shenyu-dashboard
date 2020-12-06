# Soul DashBoard

![build](https://github.com/dromara/soul-dashboard/workflows/build/badge.svg)

### Overview
Soul DashBoard is frontend of a management background for [soul](https://github.com/dromara/soul).

#### Soul Admin Backend
soul-admin is a standard spring boot project。click [here](https://github.com/dromara/soul/tree/master/soul-admin) for more information;

### Prerequisite
- node v8.0+

### How Build

#### modify api url

modify the api url for different environment, eg: `http://192.168.1.100:8000`

#### develop environment

```shell
# install dependencies in this project root path.
npm install

# start
npm start
```

#### production environment

```shell
# build for production
npm run build
```