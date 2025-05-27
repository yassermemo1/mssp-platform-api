import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigDemoService } from './core/config/config-demo.service';
import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let configDemoService: ConfigDemoService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        ConfigDemoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                NODE_ENV: 'test',
                PORT: 3001,
                'database.host': 'localhost',
                'database.port': 5432,
                'database.username': 'test_user',
                'database.password': 'test_password',
                'database.name': 'test_db',
                'jwt.secret': 'test_jwt_secret_key_for_testing_purposes_only',
                'jwt.expiresIn': '60m',
                database: {
                  host: 'localhost',
                  port: 5432,
                  username: 'test_user',
                  password: 'test_password',
                  name: 'test_db',
                },
                jwt: {
                  secret: 'test_jwt_secret_key_for_testing_purposes_only',
                  expiresIn: '60m',
                },
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
    configDemoService = app.get<ConfigDemoService>(ConfigDemoService);
  });

  describe('root', () => {
    it('should return a welcome message', () => {
      const result = appController.getHello();
      expect(result).toContain('Hello from MSSP Platform API!');
      expect(result).toContain('test mode');
      expect(result).toContain('port 3001');
    });
  });

  describe('config endpoints', () => {
    it('should return server configuration', () => {
      const result = appController.getServerConfig();
      expect(result).toHaveProperty('port', 3001);
      expect(result).toHaveProperty('nodeEnv', 'test');
      expect(result).toHaveProperty('isProduction', false);
      expect(result).toHaveProperty('isDevelopment', false);
    });

    it('should return database configuration', () => {
      const result = appController.getDatabaseConfig();
      expect(result).toHaveProperty('host', 'localhost');
      expect(result).toHaveProperty('port', 5432);
      expect(result).toHaveProperty('username', 'test_user');
      expect(result).toHaveProperty('name', 'test_db');
    });

    it('should return JWT configuration without exposing secret', () => {
      const result = appController.getJwtConfig();
      expect(result).toHaveProperty('expiresIn', '60m');
      expect(result).toHaveProperty('secretLength');
      expect(result).toHaveProperty('hasSecret', true);
      expect(result.secretLength).toBeGreaterThan(0);
      // Ensure the actual secret is not exposed
      expect(result).not.toHaveProperty('secret');
    });

    it('should return environment information', () => {
      const result = appController.getEnvironmentInfo();
      expect(result).toHaveProperty('logLevel');
      expect(result).toHaveProperty('serverConfig');
      expect(result.serverConfig).toHaveProperty('nodeEnv', 'test');
    });
  });
});
