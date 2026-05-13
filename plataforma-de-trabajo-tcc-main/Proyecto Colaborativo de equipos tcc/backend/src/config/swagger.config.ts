import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TeamSync API",
      version: "1.0.0",
      description: "API documentacion  para  tu projecto",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // donde están tus rutas
};

export const swaggerSpec = swaggerJsdoc(options);