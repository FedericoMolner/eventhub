const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Carica il file YAML della documentazione
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));

// Configurazione base di Swagger
const options = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "EventHub API Documentation",
    swaggerOptions: {
        persistAuthorization: true
    }
};

module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(swaggerDocument, options)
};