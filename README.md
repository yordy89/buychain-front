# Frontend

## Node Version
 v10.16.3 and above required

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build -c development` to build the project in 'development' environment.
Run `ng build -c demo` to build the project in 'demo' environment.
Run `ng build -c production` to build the project in 'prod' environment.
The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Swagger Codegen

Swagger-codegen is used for API client generation. [Swagger-codegen](https://github.com/swagger-api/swagger-codegen) Version [2.4.10](https://github.com/swagger-api/swagger-codegen/releases/tag/v2.4.10) works best with current API documentation implementation. Once it's installed globally, 

- use `npm run generate-base-api` command to regenerate the base-api client in data layer.
- use `npm run generate-search-api` command to regenerate the search-api client in data layer.
- use `npm run finance-api` command to regenerate the finance-api client in data layer.


## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Contribution Guidelines

https://github.com/buychain/frontend/blob/master/CONTRIBUTING.md
