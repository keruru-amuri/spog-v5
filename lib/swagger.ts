import { createSwaggerSpec } from 'next-swagger-doc';

/**
 * OpenAPI specification for the MABES SPOG Inventory Management API
 */
export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'MABES SPOG Inventory Management API',
        version: '1.0.0',
        description: 'API documentation for the MABES SPOG Inventory Management system',
        contact: {
          name: 'SPOG Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: '/api',
          description: 'API server',
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Authentication endpoints',
        },
        {
          name: 'Inventory',
          description: 'Inventory management endpoints',
        },
        {
          name: 'Consumption',
          description: 'Consumption recording endpoints',
        },
        {
          name: 'Reports',
          description: 'Reporting endpoints',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          // Authentication schemas
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                example: 'password123',
              },
              rememberMe: {
                type: 'boolean',
                example: false,
              },
            },
          },
          LoginResponse: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    format: 'uuid',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  firstName: {
                    type: 'string',
                  },
                  lastName: {
                    type: 'string',
                  },
                  role: {
                    type: 'string',
                    enum: ['admin', 'manager', 'user'],
                  },
                },
              },
              token: {
                type: 'string',
              },
              expiresAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          RegisterRequest: {
            type: 'object',
            required: ['email', 'password', 'firstName', 'lastName'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                example: 'user@example.com',
              },
              password: {
                type: 'string',
                format: 'password',
                example: 'password123',
              },
              firstName: {
                type: 'string',
                example: 'John',
              },
              lastName: {
                type: 'string',
                example: 'Doe',
              },
              department: {
                type: 'string',
                example: 'Engineering',
              },
            },
          },

          // Inventory schemas
          InventoryItem: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
                nullable: true,
              },
              category: {
                type: 'string',
                enum: ['Sealant', 'Paint', 'Oil', 'Grease'],
              },
              location_id: {
                type: 'string',
                format: 'uuid',
                nullable: true,
              },
              current_balance: {
                type: 'number',
                format: 'float',
              },
              original_amount: {
                type: 'number',
                format: 'float',
              },
              minimum_quantity: {
                type: 'number',
                format: 'float',
              },
              unit: {
                type: 'string',
              },
              consumption_unit: {
                type: 'string',
                nullable: true,
              },
              status: {
                type: 'string',
                enum: ['normal', 'low', 'critical'],
              },
              last_refilled: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              expiry_date: {
                type: 'string',
                format: 'date',
                nullable: true,
              },
              image_url: {
                type: 'string',
                format: 'uri',
                nullable: true,
              },
              created_at: {
                type: 'string',
                format: 'date-time',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          CreateInventoryItemRequest: {
            type: 'object',
            required: ['name', 'category', 'current_balance', 'original_amount', 'unit'],
            properties: {
              name: {
                type: 'string',
                example: 'Silicone Sealant',
              },
              description: {
                type: 'string',
                example: 'General purpose silicone sealant',
                nullable: true,
              },
              category: {
                type: 'string',
                enum: ['Sealant', 'Paint', 'Oil', 'Grease'],
                example: 'Sealant',
              },
              location_id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
                nullable: true,
              },
              current_balance: {
                type: 'number',
                format: 'float',
                example: 100,
              },
              original_amount: {
                type: 'number',
                format: 'float',
                example: 200,
              },
              minimum_quantity: {
                type: 'number',
                format: 'float',
                example: 50,
                nullable: true,
              },
              unit: {
                type: 'string',
                example: 'g',
              },
              consumption_unit: {
                type: 'string',
                example: 'g',
                nullable: true,
              },
              expiry_date: {
                type: 'string',
                format: 'date',
                example: '2025-12-31',
                nullable: true,
              },
              image_url: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/image.jpg',
                nullable: true,
              },
            },
          },
          UpdateInventoryItemRequest: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'Silicone Sealant',
              },
              description: {
                type: 'string',
                example: 'General purpose silicone sealant',
                nullable: true,
              },
              category: {
                type: 'string',
                enum: ['Sealant', 'Paint', 'Oil', 'Grease'],
                example: 'Sealant',
              },
              location_id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
                nullable: true,
              },
              current_balance: {
                type: 'number',
                format: 'float',
                example: 100,
              },
              original_amount: {
                type: 'number',
                format: 'float',
                example: 200,
              },
              minimum_quantity: {
                type: 'number',
                format: 'float',
                example: 50,
                nullable: true,
              },
              unit: {
                type: 'string',
                example: 'g',
              },
              consumption_unit: {
                type: 'string',
                example: 'g',
                nullable: true,
              },
              expiry_date: {
                type: 'string',
                format: 'date',
                example: '2025-12-31',
                nullable: true,
              },
              image_url: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/image.jpg',
                nullable: true,
              },
            },
          },

          // Consumption schemas
          ConsumptionRecord: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              inventory_item_id: {
                type: 'string',
                format: 'uuid',
              },
              user_id: {
                type: 'string',
                format: 'uuid',
              },
              quantity: {
                type: 'number',
                format: 'float',
              },
              unit: {
                type: 'string',
              },
              notes: {
                type: 'string',
                nullable: true,
              },
              recorded_at: {
                type: 'string',
                format: 'date-time',
              },
              created_at: {
                type: 'string',
                format: 'date-time',
              },
              updated_at: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          CreateConsumptionRecordRequest: {
            type: 'object',
            required: ['inventory_item_id', 'quantity', 'unit'],
            properties: {
              inventory_item_id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
              },
              quantity: {
                type: 'number',
                format: 'float',
                example: 50,
              },
              unit: {
                type: 'string',
                example: 'g',
              },
              notes: {
                type: 'string',
                example: 'Used for maintenance',
                nullable: true,
              },
              recorded_at: {
                type: 'string',
                format: 'date-time',
                example: '2023-04-20T10:00:00Z',
                nullable: true,
              },
            },
          },

          // Report schemas
          InventoryStatusReport: {
            type: 'object',
            properties: {
              report_type: {
                type: 'string',
                enum: ['inventory-status'],
              },
              generated_at: {
                type: 'string',
                format: 'date-time',
              },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    name: {
                      type: 'string',
                    },
                    category: {
                      type: 'string',
                    },
                    current_quantity: {
                      type: 'number',
                      format: 'float',
                    },
                    original_amount: {
                      type: 'number',
                      format: 'float',
                    },
                    minimum_quantity: {
                      type: 'number',
                      format: 'float',
                    },
                    unit: {
                      type: 'string',
                    },
                    stock_percentage: {
                      type: 'number',
                      format: 'float',
                    },
                    status: {
                      type: 'string',
                      enum: ['normal', 'low', 'critical'],
                    },
                    last_updated: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_items: {
                    type: 'integer',
                  },
                  low_stock_items: {
                    type: 'integer',
                  },
                  critical_stock_items: {
                    type: 'integer',
                  },
                  average_stock_level: {
                    type: 'number',
                    format: 'float',
                  },
                },
              },
            },
          },
          ConsumptionTrendsReport: {
            type: 'object',
            properties: {
              report_type: {
                type: 'string',
                enum: ['consumption-trends'],
              },
              generated_at: {
                type: 'string',
                format: 'date-time',
              },
              start_date: {
                type: 'string',
                format: 'date',
              },
              end_date: {
                type: 'string',
                format: 'date',
              },
              group_by: {
                type: 'string',
                enum: ['day', 'week', 'month'],
              },
              trends: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    period: {
                      type: 'string',
                    },
                    total_consumption: {
                      type: 'number',
                      format: 'float',
                    },
                    record_count: {
                      type: 'integer',
                    },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          item_id: {
                            type: 'string',
                            format: 'uuid',
                          },
                          item_name: {
                            type: 'string',
                          },
                          category: {
                            type: 'string',
                          },
                          quantity: {
                            type: 'number',
                            format: 'float',
                          },
                          unit: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_consumption: {
                    type: 'number',
                    format: 'float',
                  },
                  total_records: {
                    type: 'integer',
                  },
                  most_consumed_item: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid',
                      },
                      name: {
                        type: 'string',
                      },
                      quantity: {
                        type: 'number',
                        format: 'float',
                      },
                      unit: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
          ExpiryReport: {
            type: 'object',
            properties: {
              report_type: {
                type: 'string',
                enum: ['expiry'],
              },
              generated_at: {
                type: 'string',
                format: 'date-time',
              },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    name: {
                      type: 'string',
                    },
                    category: {
                      type: 'string',
                    },
                    current_quantity: {
                      type: 'number',
                      format: 'float',
                    },
                    unit: {
                      type: 'string',
                    },
                    expiry_date: {
                      type: 'string',
                      format: 'date',
                    },
                    days_until_expiry: {
                      type: 'integer',
                    },
                    status: {
                      type: 'string',
                      enum: ['critical', 'warning', 'normal'],
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_expiring_items: {
                    type: 'integer',
                  },
                  critical_items: {
                    type: 'integer',
                  },
                  warning_items: {
                    type: 'integer',
                  },
                },
              },
            },
          },
          LocationUtilizationReport: {
            type: 'object',
            properties: {
              report_type: {
                type: 'string',
                enum: ['location-utilization'],
              },
              generated_at: {
                type: 'string',
                format: 'date-time',
              },
              locations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    location_id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    name: {
                      type: 'string',
                    },
                    type: {
                      type: 'string',
                    },
                    total_items: {
                      type: 'integer',
                    },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'string',
                            format: 'uuid',
                          },
                          name: {
                            type: 'string',
                          },
                          category: {
                            type: 'string',
                          },
                          current_quantity: {
                            type: 'number',
                            format: 'float',
                          },
                          unit: {
                            type: 'string',
                          },
                        },
                      },
                    },
                  },
                },
              },
              summary: {
                type: 'object',
                properties: {
                  total_locations: {
                    type: 'integer',
                  },
                  total_items: {
                    type: 'integer',
                  },
                  most_utilized_location: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid',
                      },
                      name: {
                        type: 'string',
                      },
                      item_count: {
                        type: 'integer',
                      },
                    },
                  },
                },
              },
            },
          },

          // Error schemas
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
              details: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
  });

  return spec;
};
