# ShenYu Dashboard

![build](https://github.com/dromara/shenyu-dashboard/workflows/build/badge.svg)


## Overview
ShenYu Dashboard is frontend of a management background for [shenyu](https://github.com/dromara/shenyu). The API interface is in the [shenyu-admin](https://github.com/dromara/shenyu/tree/master/shenyu-admin) module.
                                                                                                   
## Prerequisite
- node v8.0+

## How to Build

### Configuration

Modify the api url for different environment, eg: `http://192.168.1.100:8000`


### Develop Environment

```shell
# install dependencies in this project root path.
npm install
# start
npm start
```

### Production Environment

```shell
# install dependencies in this project root path.
npm install
# build for production
npm run build

# copy to shenyu-admin
cp -rf dist/* shenyu-admin/src/main/resources/static/
```

