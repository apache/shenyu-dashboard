# Soul Dashboard

![build](https://github.com/dromara/soul-dashboard/workflows/build/badge.svg)


## Overview
Soul Dashboard is frontend of a management background for [soul](https://github.com/dromara/soul). The API interface is in the [soul-admin](https://github.com/dromara/soul/tree/master/soul-admin) module.
                                                                                                   
## Prerequisite
- node v8.0+

## How to Build

### Configuration

Modify the api url for different environment, eg: `http://192.168.1.100:8000`
![index.ejs](https://dromara.github.io/soul-dashboard/doc/img/index.ejs.png)


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

# copy to soul-admin
cp -rf dist/* soul-admin/src/main/resources/static/
```

## Screenshots

#### Divide Plugin
![Divide Plugin](https://dromara.github.io/soul-dashboard/doc/img/divide-plugin.png)

#### Add Rules
![Add Rules](https://dromara.github.io/soul-dashboard/doc/img/add-rules.jpg)

#### Plugin Management
![Plugin Management](https://dromara.github.io/soul-dashboard/doc/img/plugin-management.jpg)

