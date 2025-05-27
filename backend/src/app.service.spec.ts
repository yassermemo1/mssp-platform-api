import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';

describe('AppService', () => {
  let service: AppService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                NODE_ENV: 'test',
                PORT: 3001,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return a greeting message with environment and port info', () => {
      const result = service.getHello();

      expect(result).toContain('Hello from MSSP Platform API!');
      expect(result).toContain('Running in test mode');
      expect(result).toContain('on port 3001');
    });

    it('should use default values when config is not available', () => {
      // Mock ConfigService to return undefined for both values
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: any) => {
          return defaultValue;
        });

      const result = service.getHello();

      expect(result).toContain('Running in development mode');
      expect(result).toContain('on port 3000');
    });
  });
});
